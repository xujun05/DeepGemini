"""DeepGemini 服务，用于协调 DeepSeek-R1 和 Gemini API 的调用"""
import json
import time
import tiktoken
import asyncio
from typing import AsyncGenerator
from app.utils.logger import logger
from app.clients import DeepSeekClient, GeminiClient


class DeepGemini:
    """处理 DeepSeek-R1 和 Gemini API 的流式输出衔接"""

    def __init__(self, deepseek_api_key: str, gemini_api_key: str,
                 deepseek_api_url: str = "https://api.deepseek.com/v1/chat/completions",
                 gemini_api_url: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent",
                 is_origin_reasoning: bool = True):
        """初始化 API 客户端
        
        Args:
            deepseek_api_key: DeepSeek API密钥
            gemini_api_key: Gemini API密钥
            deepseek_api_url: DeepSeek API地址
            gemini_api_url: Gemini API地址
            is_origin_reasoning: 是否使用原始推理输出
        """
        self.deepseek_client = DeepSeekClient(deepseek_api_key, deepseek_api_url)
        self.gemini_client = GeminiClient(gemini_api_key, gemini_api_url)
        self.is_origin_reasoning = is_origin_reasoning

    async def chat_completions_with_stream(
        self,
        messages: list,
        deepseek_model: str = "deepseek-reasoner",
        claude_model: str = "gemini-pro",
        **kwargs  # 添加 kwargs 来接收额外的参数
    ) -> AsyncGenerator[bytes, None]:
        """处理完整的流式输出过程
        
        Args:
            messages: 初始消息列表
            deepseek_model: DeepSeek 模型名称
            claude_model: Gemini 模型名称 (为了保持接口一致，参数名保持为 claude_model)
            **kwargs: 额外的参数，比如 model_arg (会被忽略)
            
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
        gemini_queue = asyncio.Queue()
        reasoning_content = []

        async def process_deepseek():
            logger.info(f"开始处理 DeepSeek 流，使用模型：{deepseek_model}, 提供商: {self.deepseek_client.provider}")
            try:
                async for content_type, content in self.deepseek_client.stream_chat(messages, deepseek_model, self.is_origin_reasoning):
                    if content_type == "reasoning":
                        reasoning_content.append(content)
                        response = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": deepseek_model,
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
                        logger.info(f"DeepSeek 推理完成，收集到的推理内容长度：{len(''.join(reasoning_content))}")
                        await gemini_queue.put("".join(reasoning_content))
                        break
            except Exception as e:
                logger.error(f"处理 DeepSeek 流时发生错误: {e}")
                await gemini_queue.put("")
            await output_queue.put(None)

        async def process_gemini():
            try:
                logger.info("等待获取 DeepSeek 的推理内容...")
                reasoning = await gemini_queue.get()
                logger.debug(f"获取到推理内容，内容长度：{len(reasoning) if reasoning else 0}")
                if not reasoning:
                    logger.warning("未能获取到有效的推理内容，将使用默认提示继续")
                    reasoning = "获取推理内容失败"

                gemini_messages = messages.copy()
                combined_content = f"""
                Here's my another model's reasoning process:\n{reasoning}\n\n
                Based on this reasoning, provide your response directly to me:"""
                
                last_message = gemini_messages[-1]
                if last_message.get("role", "") == "user":
                    original_content = last_message["content"]
                    fixed_content = f"Here's my original input:\n{original_content}\n\n{combined_content}"
                    last_message["content"] = fixed_content

                logger.info(f"开始处理 Gemini 流，使用模型: {claude_model}, 提供商: {self.gemini_client.provider}")

                async for content_type, content in self.gemini_client.stream_chat(
                    messages=gemini_messages,
                    model=claude_model
                ):
                    if content_type == "reasoning":
                        response = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": claude_model,
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
                logger.error(f"处理 Gemini 流时发生错误: {e}")
            await output_queue.put(None)
        
        deepseek_task = asyncio.create_task(process_deepseek())
        gemini_task = asyncio.create_task(process_gemini())
        
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
        deepseek_model: str = "deepseek-reasoner",
        claude_model: str = "gemini-pro",
        **kwargs  # 添加 kwargs 来接收额外的参数
    ) -> dict:
        """处理非流式输出过程
        
        Args:
            messages: 初始消息列表
            deepseek_model: DeepSeek 模型名称
            claude_model: Gemini 模型名称 (为了保持接口一致，参数名保持为 claude_model)
            **kwargs: 额外的参数，比如 model_arg (会被忽略)
            
        Returns:
            dict: OpenAI 格式的完整响应
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        reasoning_content = []

        # 1. 获取 DeepSeek 的推理内容
        try:
            async for content_type, content in self.deepseek_client.stream_chat(messages, deepseek_model, self.is_origin_reasoning):
                if content_type == "reasoning":
                    reasoning_content.append(content)
                elif content_type == "content":
                    break
        except Exception as e:
            logger.error(f"获取 DeepSeek 推理内容时发生错误: {e}")
            reasoning_content = ["获取推理内容失败"]

        # 2. 构造 Gemini 的输入消息
        reasoning = "".join(reasoning_content)
        gemini_messages = messages.copy()

        combined_content = f"""
        Here's my another model's reasoning process:\n{reasoning}\n\n
        Based on this reasoning, provide your response directly to me:"""
        
        last_message = gemini_messages[-1]
        if last_message.get("role", "") == "user":
            original_content = last_message["content"]
            fixed_content = f"Here's my original input:\n{original_content}\n\n{combined_content}"
            last_message["content"] = fixed_content

        # 3. 获取 Gemini 的响应
        answer = ""
        try:
            async for content_type, content in self.gemini_client.stream_chat(
                messages=gemini_messages,
                model=claude_model
            ):
                if content_type == "reasoning":
                    answer += content

            # 4. 构造 OpenAI 格式的响应
            return {
                "id": chat_id,
                "object": "chat.completion",
                "created": created_time,
                "model": claude_model,
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
        except Exception as e:
            logger.error(f"获取 Gemini 响应时发生错误: {e}")
            raise e 