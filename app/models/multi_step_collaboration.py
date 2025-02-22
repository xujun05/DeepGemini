from typing import List, Dict, AsyncGenerator
import asyncio
import json
import time
from app.utils.logger import logger
from app.clients import DeepSeekClient, ClaudeClient, GeminiClient
from app.clients.uni_client import UniClient
from app.clients.openai_client import OpenAIClient

class MultiStepModelCollaboration:
    """处理多步骤模型协作的类"""
    
    def __init__(self, steps: List[Dict]):
        """初始化多步骤协作处理器
        
        Args:
            steps: 步骤列表，每个步骤包含:
                - model: 数据库模型对象
                - step_type: 步骤类型 (reasoning/execution)
                - system_prompt: 系统提示词
        """
        self.steps = steps
        self.clients = []
        
        # 检查是否为单模型情况
        self.is_single_model = len(steps) == 1
        if self.is_single_model:
            self.uni_client = UniClient.create_client(steps[0]['model'])
        
        # 初始化每个步骤的客户端
        for step in steps:
            model = step['model']
            client = self._init_client(
                model.provider,
                model.api_key,
                model.api_url,
                step['step_type'] == 'reasoning'
            )
            self.clients.append({
                'client': client,
                'model_name': model.model_name,
                'step_type': step['step_type'],
                'system_prompt': step['system_prompt']
            })

    def _init_client(self, provider: str, api_key: str, api_url: str, is_reasoning: bool):
        """初始化对应的客户端"""
        try:
            # 根据提供商类型初始化对应的客户端
            if provider == "deepseek":
                return DeepSeekClient(api_key, api_url, is_origin_reasoning=is_reasoning)
            elif provider == "google":
                return GeminiClient(api_key, api_url)
            elif provider == "anthropic":
                return ClaudeClient(api_key, api_url)
            elif provider == "grok3":
                from app.clients import Grok3Client
                return Grok3Client(api_key, api_url, is_origin_reasoning=is_reasoning)
            elif provider in ["oneapi", "openrouter", "openai-completion"]:
                from app.clients import OpenAIClient
                return OpenAIClient(api_key, api_url)
            elif provider == "腾讯云":
                # 腾讯云使用与 DeepSeek 相同的客户端
                return DeepSeekClient(api_key, api_url, provider="腾讯云", is_origin_reasoning=is_reasoning)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        except Exception as e:
            logger.error(f"初始化客户端时发生错误: {e}")
            raise

    async def process_with_stream(
        self,
        messages: list
    ) -> AsyncGenerator[bytes, None]:
        """处理多步骤流式输出
        
        Args:
            messages: 初始消息列表
            
        Yields:
            bytes: 流式响应数据
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        
        current_messages = messages.copy()
        previous_result = ""
        
        # 如果是单模型，直接使用通用客户端
        if self.is_single_model:
            step = self.steps[0]
            async for chunk in self.uni_client.generate_stream(
                messages=messages,
                system_prompt=step.get('system_prompt')
            ):
                yield chunk
            return
        
        for idx, client_info in enumerate(self.clients):
            client = client_info['client']
            step_type = client_info['step_type']
            system_prompt = client_info['system_prompt']
            is_last_step = idx == len(self.clients) - 1
            is_first_step = idx == 0
            
            # 添加系统提示词
            if system_prompt:
                current_messages = self._add_system_prompt(current_messages, system_prompt)
            
            # 如果不是第一步，添加前一步的结果到提示中
            if idx > 0:
                current_messages = self._add_previous_step_result(
                    current_messages,
                    previous_result,
                    step_type
                )
            
            # 收集当前步骤的输出
            current_output = []
            async for content_type, content in client.stream_chat(
                messages=current_messages,
                model=client_info['model_name'],
                is_last_step=is_last_step,
                is_first_step=is_first_step
            ):
                current_output.append(content)
                
                # 构建响应
                delta = {
                    "role": "assistant",
                    f"{step_type}_content": content if step_type == "reasoning" else ""
                }
                
                # 只有执行模型或最后一步的推理模型才输出 content
                if step_type == "execution" or is_last_step:
                    delta["content"] = content
                
                # 生成流式响应
                response = {
                    "id": chat_id,
                    "object": "chat.completion.chunk",
                    "created": created_time,
                    "model": client_info['model_name'],
                    "choices": [{
                        "index": 0,
                        "delta": delta
                    }]
                }
                
                yield f"data: {json.dumps(response)}\n\n".encode('utf-8')
            
            # 保存当前步骤的完整输出，用于下一步
            previous_result = "".join(current_output)

    async def process_without_stream(self, messages: list) -> dict:
        """处理非流式输出
        
        Args:
            messages: 初始消息列表
            
        Returns:
            dict: 完整的响应数据
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        
        current_messages = messages.copy()
        previous_result = ""
        final_response = {
            "role": "assistant",
            "reasoning_content": "",
            "execution_content": "",
            "content": ""
        }
        
        # 如果是单模型，直接使用通用客户端
        if self.is_single_model:
            step = self.steps[0]
            return await self.uni_client.generate(
                messages=messages,
                system_prompt=step.get('system_prompt')
            )
        
        for idx, client_info in enumerate(self.clients):
            client = client_info['client']
            step_type = client_info['step_type']
            system_prompt = client_info['system_prompt']
            is_last_step = idx == len(self.clients) - 1
            is_first_step = idx == 0
            if system_prompt:
                current_messages = self._add_system_prompt(current_messages, system_prompt)
            
            if idx > 0:
                current_messages = self._add_previous_step_result(
                    current_messages,
                    previous_result,
                    step_type
                )
            
            current_output = []
            async for content_type, content in client.stream_chat(
                messages=current_messages,
                model=client_info['model_name'],
                is_last_step=is_last_step,
                is_first_step=is_first_step
            ):
                current_output.append(content)
            
            output_text = "".join(current_output)
            previous_result = output_text
            
            # 更新响应内容
            final_response[f"{step_type}_content"] = output_text
            if step_type == "execution" or is_last_step:
                final_response["content"] = output_text
        
        return {
            "id": chat_id,
            "object": "chat.completion",
            "created": created_time,
            "model": self.clients[-1]['model_name'],
            "choices": [{
                "index": 0,
                "message": final_response
            }]
        }

    def _add_system_prompt(self, messages: list, system_prompt: str) -> list:
        """添加系统提示词到消息列表"""
        new_messages = messages.copy()
        if new_messages and new_messages[0].get("role") == "system":
            new_messages[0]["content"] = f"{system_prompt}\n\n{new_messages[0]['content']}"
        else:
            new_messages.insert(0, {
                "role": "system",
                "content": system_prompt
            })
        return new_messages

    def _add_previous_step_result(self, messages: list, previous_result: str, step_type: str) -> list:
        """添加前一步结果到消息中"""
        new_messages = messages.copy()
        last_message = new_messages[-1]
        
        prefix = "reasoning" if step_type == "execution" else "previous step"
        prompt = f"""
        Here's the {prefix} result:\n{previous_result}\n\n
        Based on this, please provide your response:
        """
        
        if last_message.get("role") == "user":
            last_message["content"] = f"{last_message['content']}\n\n{prompt}"
        
        return new_messages 