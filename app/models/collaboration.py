"""通用模型协作类，用于处理不同模型之间的协作"""
import json
import time
import asyncio
from typing import AsyncGenerator
from app.utils.logger import logger
from app.clients import DeepSeekClient, ClaudeClient, GeminiClient

class ModelCollaboration:
    """处理多步骤模型协作的通用类"""

    def __init__(self, configuration: dict):
        """初始化模型协作
        
        Args:
            configuration: 配置信息，包含所有步骤的模型配置
        """
        self.configuration = configuration
        self.steps = configuration['steps']
        self.clients = {}
        
        # 初始化所有需要的客户端
        for step in self.steps:
            model_config = step['model']
            client_key = f"{model_config['provider']}_{model_config['id']}"
            
            if client_key not in self.clients:
                self.clients[client_key] = self._init_client(model_config, step['step_type'])

    def _init_client(self, model_config: dict, step_type: str):
        """根据模型配置初始化对应的客户端"""
        provider = model_config['provider'].lower()
        is_origin_reasoning = step_type in ['reasoning', 'general']
        
        if provider == "deepseek" or provider == "腾讯云":
            return DeepSeekClient(
                api_key=model_config['api_key'],
                api_url=model_config['api_url'],
                provider=provider,
                is_origin_reasoning=is_origin_reasoning
            )
        elif provider == "google":
            return GeminiClient(
                api_key=model_config['api_key'],
                api_url=model_config['api_url'],
                is_origin_reasoning=is_origin_reasoning
            )
        elif provider == "anthropic":
            return ClaudeClient(
                api_key=model_config['api_key'],
                api_url=model_config['api_url'],
                provider=provider
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def chat_completions_with_stream(
        self,
        messages: list,
        model_arg: tuple[float, float, float, float]
    ) -> AsyncGenerator[bytes, None]:
        """处理多步骤的流式输出过程"""
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        
        # 创建消息历史记录
        message_history = messages.copy()
        
        # 处理每个步骤
        for step_index, step in enumerate(self.steps):
            try:
                model_config = step['model']
                client_key = f"{model_config['provider']}_{model_config['id']}"
                client = self.clients[client_key]
                
                # 准备消息和客户端参数
                messages_with_prompt = self._prepare_messages_with_system_prompt(
                    message_history, 
                    step.get('system_prompt', '')
                )
                client_args = self._prepare_client_args(
                    client,
                    messages_with_prompt,
                    model_config['model_name'],
                    model_arg
                )

                # 使用异步列表存储推理内容
                reasoning_content = []
                
                # 立即开始流式处理
                async for content_type, content in client.stream_chat(**client_args):
                    if step['step_type'] == 'reasoning':
                        # 对于推理步骤，立即发送内容并异步存储
                        reasoning_content.append(content)
                        response = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": model_config['model_name'],
                            "choices": [{
                                "index": 0,
                                "delta": {
                                    "role": "assistant",
                                    "step_index": step_index + 1,
                                    "step_type": step['step_type'],
                                    "reasoning_content": content
                                }
                            }]
                        }
                        yield f"data: {json.dumps(response)}\n\n".encode('utf-8')
                    else:
                        # 对于执行步骤，直接发送内容
                        response = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": model_config['model_name'],
                            "choices": [{
                                "index": 0,
                                "delta": {
                                    "role": "assistant",
                                    "step_index": step_index + 1,
                                    "step_type": step['step_type'],
                                    "content": content
                                }
                            }]
                        }
                        yield f"data: {json.dumps(response)}\n\n".encode('utf-8')

                # 更新消息历史 - 只在推理步骤结束时进行
                if step['step_type'] == 'reasoning' and reasoning_content:
                    message_history.append({
                        "role": "assistant",
                        "content": "".join(reasoning_content)
                    })
                
            except Exception as e:
                logger.error(f"步骤 {step_index + 1} 处理错误: {e}", exc_info=True)
                error_response = {
                    "id": chat_id,
                    "object": "chat.completion.chunk",
                    "created": created_time,
                    "model": model_config['model_name'],
                    "choices": [{
                        "index": 0,
                        "delta": {
                            "role": "assistant",
                            "step_index": step_index + 1,
                            "step_type": step['step_type'],
                            "content": f"Error in step {step_index + 1}: {str(e)}"
                        }
                    }]
                }
                yield f"data: {json.dumps(error_response)}\n\n".encode('utf-8')
                continue

        # 发送完成标记
        yield b"data: [DONE]\n\n"

    def _prepare_messages_with_system_prompt(self, messages: list, system_prompt: str) -> list:
        """准备带有系统提示词的消息列表"""
        if not system_prompt:
            return messages

        # 创建消息列表的副本
        new_messages = messages.copy()
        
        # 如果第一条消息不是系统消息，添加系统消息
        if not new_messages or new_messages[0].get("role") != "system":
            new_messages.insert(0, {
                "role": "system",
                "content": system_prompt
            })
        # 如果第一条是系统消息，更新其内容
        else:
            original_content = new_messages[0]["content"]
            new_messages[0]["content"] = f"{system_prompt}\n\n{original_content}"
            
        return new_messages

    def _prepare_client_args(self, client, messages: list, model: str, model_arg: tuple = None) -> dict:
        """准备客户端特定的参数"""
        base_args = {
            "messages": messages,
            "model": model
        }
        
        if isinstance(client, ClaudeClient) and model_arg:
            base_args["model_arg"] = model_arg
            
        return base_args

    async def chat_completions_without_stream(
        self,
        messages: list,
        model_arg: tuple[float, float, float, float] = None
    ) -> dict:
        """处理非流式输出过程
        
        Args:
            messages: 初始消息列表
            model_arg: 模型参数元组 (temperature, top_p, presence_penalty, frequency_penalty)
            
        Returns:
            dict: OpenAI 格式的完整响应
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        reasoning_content = []
        answer_content = []

        # 1. 获取推理模型的输出
        logger.info("开始获取推理模型输出...")
        try:
            client_args = self._prepare_client_args(
                self.reasoning_client,
                messages,
                self.reasoning_model_config['model_name'],
                model_arg
            )
            async for content_type, content in self.reasoning_client.stream_chat(**client_args):
                if content_type == "reasoning":
                    reasoning_content.append(content)
                elif content_type == "content":
                    break
        except Exception as e:
            logger.error(f"获取推理模型输出时发生错误: {e}", exc_info=True)
            reasoning_content = ["获取推理内容失败"]

        reasoning = "".join(reasoning_content)
        logger.info(f"获取到推理内容，长度: {len(reasoning)}")

        # 2. 构造执行模型的输入消息
        execution_messages = messages.copy()
        combined_content = f"""
        Here's my another model's reasoning process:\n{reasoning}\n\n
        Based on this reasoning, provide your response directly to me:"""
        
        last_message = execution_messages[-1]
        if last_message.get("role", "") == "user":
            original_content = last_message["content"]
            fixed_content = f"Here's my original input:\n{original_content}\n\n{combined_content}"
            last_message["content"] = fixed_content

        # 移除 system 消息
        execution_messages = [msg for msg in execution_messages if msg.get("role") != "system"]

        # 3. 获取执行模型的输出
        logger.info("开始获取执行模型输出...")
        try:
            client_args = self._prepare_client_args(
                self.execution_client,
                execution_messages,
                self.execution_model_config['model_name'],
                model_arg
            )
            async for content_type, content in self.execution_client.stream_chat(**client_args):
                if content_type in ["answer", "reasoning"]:
                    answer_content.append(content)
        except Exception as e:
            logger.error(f"获取执行模型输出时发生错误: {e}", exc_info=True)
            raise e

        answer = "".join(answer_content)
        logger.info(f"获取到执行模型输出，长度: {len(answer)}")

        # 4. 构造 OpenAI 格式的响应
        return {
            "id": chat_id,
            "object": "chat.completion",
            "created": created_time,
            "model": self.execution_model_config['model_name'],
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": answer,
                    "reasoning_content": reasoning
                },
                "finish_reason": "stop"
            }]
        } 