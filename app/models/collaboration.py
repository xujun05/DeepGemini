"""通用模型协作类，用于处理不同模型之间的协作"""
import json
import time
import asyncio
from typing import AsyncGenerator
from app.utils.logger import logger
from app.clients import DeepSeekClient, ClaudeClient, GeminiClient

class ModelCollaboration:
    """处理模型协作的通用类"""

    def __init__(self, 
                 reasoning_model_config: dict,
                 execution_model_config: dict,
                 is_origin_reasoning: bool = True,
                 reasoning_system_prompt: str = "",
                 execution_system_prompt: str = ""):
        """初始化模型协作
        
        Args:
            reasoning_model_config: 推理模型配置
            execution_model_config: 执行模型配置
            is_origin_reasoning: 是否使用原始推理输出
            reasoning_system_prompt: 推理模型的系统提示词
            execution_system_prompt: 执行模型的系统提示词
        """
        self.reasoning_model_config = reasoning_model_config
        self.execution_model_config = execution_model_config
        self.is_origin_reasoning = is_origin_reasoning
        self.reasoning_system_prompt = reasoning_system_prompt
        self.execution_system_prompt = execution_system_prompt
        
        # 初始化推理模型客户端，设置 is_origin_reasoning=True
        self.reasoning_client = self._init_client(
            reasoning_model_config,
            is_origin_reasoning=True
        )
        
        # 初始化执行模型客户端，设置 is_origin_reasoning=False
        self.execution_client = self._init_client(
            execution_model_config,
            is_origin_reasoning=False
        )

    def _init_client(self, model_config: dict, is_origin_reasoning: bool = True):
        """根据模型配置初始化对应的客户端
        
        Args:
            model_config: 模型配置信息
            is_origin_reasoning: 是否为推理模型客户端
            
        Returns:
            BaseClient: 对应的模型客户端实例
        """
        provider = model_config['provider'].lower()
        if provider == "deepseek" or provider == "腾讯云":
            return DeepSeekClient(
                api_key=model_config['api_key'],
                api_url=model_config['api_url'],
                provider=provider,
                is_origin_reasoning=is_origin_reasoning  # 传递标志给客户端
            )
        elif provider == "google":
            return GeminiClient(
                api_key=model_config['api_key'],
                api_url=model_config['api_url']
            )
        elif provider == "anthropic":
            return ClaudeClient(
                api_key=model_config['api_key'],
                api_url=model_config['api_url'],
                provider=provider
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def _prepare_client_args(self, client, messages: list, model: str, model_arg: tuple = None) -> dict:
        """根据不同的客户端准备对应的参数
        
        Args:
            client: 模型客户端实例
            messages: 消息列表
            model: 模型名称
            model_arg: 模型参数元组
            
        Returns:
            dict: 客户端特定的参数字典
        """
        base_args = {
            "messages": messages,
            "model": model
        }
        
        if isinstance(client, ClaudeClient):
            if model_arg:
                base_args["model_arg"] = model_arg
        
        # DeepSeek客户端需要 is_origin_reasoning 参数
        if isinstance(client, DeepSeekClient):
            base_args["is_origin_reasoning"] = self.is_origin_reasoning
            
        return base_args

    def _prepare_messages_with_system_prompt(self, messages: list, system_prompt: str) -> list:
        """准备带有系统提示词的消息列表
        
        Args:
            messages: 原始消息列表
            system_prompt: 系统提示词
            
        Returns:
            list: 处理后的消息列表
        """
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

    async def chat_completions_with_stream(
        self,
        messages: list,
        model_arg: tuple[float, float, float, float] = None
    ) -> AsyncGenerator[bytes, None]:
        """处理完整的流式输出过程
        
        Args:
            messages: 初始消息列表
            model_arg: 模型参数元组 (temperature, top_p, max_tokens, presence_penalty, frequency_penalty)
            
        Yields:
            字节流数据，格式如下：
            {
                "id": "chatcmpl-xxx",
                "object": "chat.completion.chunk",
                "created": timestamp,
                "model": model_name,
                "choices": [{
                    "index": 0,
                    "delta": {
                        "role": "assistant",
                        "reasoning_content": reasoning_content,
                        "content": content
                    }
                }]
            }
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())

        output_queue = asyncio.Queue()
        execution_queue = asyncio.Queue()
        reasoning_content = []

        async def process_reasoning():
            """处理推理模型的输出"""
            logger.info(f"开始处理推理模型流，使用模型：{self.reasoning_model_config['model_name']}, "
                       f"提供商: {self.reasoning_model_config['provider']}")
            try:
                # 添加系统提示词
                reasoning_messages = self._prepare_messages_with_system_prompt(
                    messages, 
                    self.reasoning_system_prompt
                )
                
                client_args = self._prepare_client_args(
                    self.reasoning_client,
                    reasoning_messages,
                    self.reasoning_model_config['model_name'],
                    model_arg
                )
                async for content_type, content in self.reasoning_client.stream_chat(**client_args):
                    if content_type == "reasoning":
                        reasoning_content.append(content)
                        response = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": self.reasoning_model_config['model_name'],
                            "choices": [{
                                "index": 0,
                                "delta": {
                                    "role": "assistant",
                                    "reasoning_content": content,
                                    "content": ""
                                }
                            }]
                        }
                        await output_queue.put(f"data: {json.dumps(response)}\n\n".encode('utf-8'))
                    elif content_type == "content":
                        logger.info(f"推理完成，收集到的推理内容长度：{len(''.join(reasoning_content))}")
                        logger.info(f"推理内容：{''.join(reasoning_content)}")
                        await execution_queue.put("".join(reasoning_content))
                        break
            except Exception as e:
                logger.error(f"处理推理模型流时发生错误: {e}")
                await execution_queue.put("")
            await output_queue.put(None)

        async def process_execution():
            """处理执行模型的输出"""
            try:
                logger.info("等待获取推理内容...")
                reasoning = await execution_queue.get()
                logger.debug(f"获取到推理内容，内容长度：{len(reasoning) if reasoning else 0}")
                
                if not reasoning:
                    logger.warning("未能获取到有效的推理内容，将使用默认提示继续")
                    reasoning = "获取推理内容失败"

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

                # 添加系统提示词
                execution_messages = self._prepare_messages_with_system_prompt(
                    execution_messages,
                    self.execution_system_prompt
                )

                logger.info(f"开始处理执行模型流，使用模型: {self.execution_model_config['model_name']}, "
                          f"提供商: {self.execution_model_config['provider']}")

                # 用于处理首个响应
                first_chunk = True

                client_args = self._prepare_client_args(
                    self.execution_client,
                    execution_messages,
                    self.execution_model_config['model_name'],
                    model_arg
                )
                async for content_type, content in self.execution_client.stream_chat(**client_args):
                    if content_type in ["answer", "reasoning"]:  # 兼容不同客户端的输出类型
                        if first_chunk:
                            # 收集首个响应的内容并立即发送
                            response = {
                                "id": chat_id,
                                "object": "chat.completion.chunk",
                                "created": created_time,
                                "model": self.execution_model_config['model_name'],
                                "choices": [{
                                    "index": 0,
                                    "delta": {
                                        "role": "assistant",
                                        "content": content
                                    }
                                }]
                            }
                            await output_queue.put(f"data: {json.dumps(response)}\n\n".encode('utf-8'))
                            first_chunk = False
                        else:
                            # 处理后续响应
                            response = {
                                "id": chat_id,
                                "object": "chat.completion.chunk",
                                "created": created_time,
                                "model": self.execution_model_config['model_name'],
                                "choices": [{
                                    "index": 0,
                                    "delta": {
                                        "role": "assistant",
                                        "content": content
                                    }
                                }]
                            }
                            await output_queue.put(f"data: {json.dumps(response)}\n\n".encode('utf-8'))
                
            except Exception as e:
                logger.error(f"处理执行模型流时发生错误: {e}")
            await output_queue.put(None)

        # 创建并发任务
        reasoning_task = asyncio.create_task(process_reasoning())
        execution_task = asyncio.create_task(process_execution())
        
        # 等待两个任务完成
        finished_tasks = 0
        while finished_tasks < 2:
            item = await output_queue.get()
            if item is None:
                finished_tasks += 1
            else:
                yield item
        
        yield b'data: [DONE]\n\n'

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