from typing import List, Dict, Optional, AsyncGenerator
import httpx
import json
import time
from app.utils.logger import logger
from app.models.database import Model

class UniClient:
    """
    通用的模型客户端，用于处理单模型的直接调用
    """
    def __init__(self, model: Model):
        """
        初始化通用客户端
        
        Args:
            model (Model): 模型配置对象，包含 API URL、密钥等信息
        """
        self.model = model
        self.api_url = model.api_url
        self.api_key = model.api_key
        self.model_name = model.model_name
        self.provider = model.provider.lower()
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # 模型参数
        self.temperature = model.temperature
        self.top_p = model.top_p
        self.max_tokens = model.max_tokens
        self.presence_penalty = model.presence_penalty
        self.frequency_penalty = model.frequency_penalty
        
        # 自定义参数
        self.custom_parameters = model.custom_parameters or {}

    def _process_chunk(self, chunk: str) -> Dict:
        """处理不同模型的响应块格式
        
        Args:
            chunk: 原始响应块
            
        Returns:
            Dict: 处理后的响应数据
        """
        try:
            chunk_data = json.loads(chunk)
            delta = {}
            
            # 根据不同的模型提供商处理响应
            if self.provider == "grok3" and "reasoner" in chunk_data:
                # Grok3 格式
                if "choices" in chunk_data and chunk_data["choices"]:
                    # logger.debug(f"chunk_data: {chunk_data}")
                    content = chunk_data["choices"][0].get("delta", {}).get("content", "")
                    if content:
                        # 初始化或获取当前行缓存
                        if not hasattr(self, '_current_line'):
                            self._current_line = ""
                        
                        # 追加新内容到当前行
                        self._current_line += content
                        
                        # 处理完整行
                        lines = []
                        while "\n" in self._current_line:
                            line, self._current_line = self._current_line.split("\n", 1)
                            line = line.strip()
                            if line:  # 忽略空行
                                lines.append(line)
                        
                        # 处理完整的行
                        reasoning_lines = []
                        answer_lines = []
                        
                        for line in lines:
                            if line.startswith(">"):
                                # 添加到推理内容
                                reasoning_lines.append("\n"+line)
                            else:
                                answer_lines.append("\n"+line)
                        
                        # 如果是结束标记，处理最后一行
                        if chunk_data.get("finish_reason") == "stop":
                            last_line = self._current_line.strip()
                            if last_line:
                                if last_line.startswith(">"):
                                    reasoning_lines.append("\n"+last_line)
                                else:
                                    answer_lines.append("\n"+last_line)
                            self._current_line = ""
                        
                        # 构造响应
                        delta = {
                            "role": "assistant",
                            "content": "\n".join(answer_lines) if answer_lines else "",
                            "reasoning_content": "\n".join(reasoning_lines) if reasoning_lines else "",
                            "execution_content": ""
                        }
                        
            elif self.provider in ["deepseek", "腾讯云","oneapi","opanai-completion"]:
                # DeepSeek 格式
                if "choices" in chunk_data and chunk_data["choices"]:
                    original_delta = chunk_data["choices"][0].get("delta", {})
                    delta = {
                        "role": "assistant",
                        "content": original_delta.get("content", ""),
                        "reasoning_content": original_delta.get("reasoning_content", ""),
                        "execution_content": original_delta.get("execution_content", "")
                    }
            else:
                # 其他模型的默认格式
                logger.debug(f"chunk_data: {chunk_data}")
                if "choices" in chunk_data and chunk_data["choices"]:
                    content = chunk_data["choices"][0].get("delta", {}).get("content", "")
                    delta = {
                        "role": "assistant",
                        "content": content,
                        "reasoning_content": "",
                        "execution_content": ""
                    }
            
            return delta
        except json.JSONDecodeError:
            logger.error(f"无法解析响应块: {chunk}")
            return {
                "role": "assistant",
                "content": "",
                "reasoning_content": "",
                "execution_content": ""
            }

    async def generate_stream(self, messages: List[Dict], system_prompt: Optional[str] = None) -> AsyncGenerator[bytes, None]:
        """
        流式生成响应
        
        Args:
            messages (List[Dict]): 消息历史
            system_prompt (Optional[str]): 系统提示词
        
        Yields:
            bytes: 生成的响应片段
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        
        if system_prompt:
            # 确保系统提示使用正确的格式
            if not any(msg.get("role") == "system" for msg in messages):
                messages = [{"role": "system", "content": system_prompt}] + messages
        
        # 确保messages格式符合OpenAI标准
        cleaned_messages = []
        for msg in messages:
            if not isinstance(msg, dict):
                logger.warning(f"跳过非字典格式消息: {msg}")
                continue
            
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if not content:
                logger.warning(f"跳过空内容消息: {msg}")
                continue
            
            cleaned_messages.append({"role": role, "content": content})
        
        if not cleaned_messages:
            logger.error("所有消息都无效，无法发送请求")
            error_data = {
                "id": chat_id,
                "object": "chat.completion.chunk",
                "created": created_time,
                "model": self.model_name,
                "choices": [{
                    "index": 0,
                    "delta": {"content": "错误: 没有有效的消息可以处理"},
                    "finish_reason": "stop"
                }]
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n".encode('utf-8')
            yield "data: [DONE]\n\n".encode('utf-8')
            return
            
        # 构建请求payload，确保符合API格式要求
        payload = {
            "model": self.model_name,
            "messages": cleaned_messages,
            "stream": True
        }
        
        # 添加模型参数（如果不为None或默认值）
        if self.temperature != 0.7:
            payload["temperature"] = self.temperature
        
        if self.top_p != 1.0:
            payload["top_p"] = self.top_p
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
        
        if self.presence_penalty:
            payload["presence_penalty"] = self.presence_penalty
        
        if self.frequency_penalty:
            payload["frequency_penalty"] = self.frequency_penalty
        
        # 只添加API实际支持的自定义参数
        if self.provider == "deepseek" and self.custom_parameters:
            for key, value in self.custom_parameters.items():
                # 避免覆盖标准参数
                if key not in payload and value is not None:
                    payload[key] = value
        
        # 记录请求详情（用于调试）
        logger.info(f"发送API请求: url={self.api_url}, model={self.model_name}")
        logger.debug(f"请求载荷: {json.dumps(payload, ensure_ascii=False)}")
        
        try:
            # 设置 timeout 为 30 秒
            timeout = httpx.Timeout(30.0, connect=30.0, read=30.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream('POST', self.api_url, json=payload, headers=self.headers) as response:
                    # 检查响应状态码
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_text = error_text.decode('utf-8')
                        logger.error(f"API请求失败: 状态码={response.status_code}, 响应={error_text}")
                        
                        # 返回错误信息
                        error_data = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": self.model_name,
                            "choices": [{
                                "index": 0,
                                "delta": {"content": f"API请求失败: HTTP {response.status_code}\n{error_text}"},
                                "finish_reason": "stop"
                            }]
                        }
                        yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n".encode('utf-8')
                        yield "data: [DONE]\n\n".encode('utf-8')
                        return
                    
                    # 处理成功的响应
                    async for line in response.aiter_lines():
                        if line.strip():
                            if line.startswith('data: '):
                                line = line[6:]  # 移除 "data: " 前缀
                            if line == '[DONE]':
                                yield "data: [DONE]\n\n".encode('utf-8')
                                break
                            
                            try:
                                chunk = line.strip()
                                if chunk:
                                    # 处理响应块
                                    delta = self._process_chunk(chunk)
                                    response_data = {
                                        "id": chat_id,
                                        "object": "chat.completion.chunk",
                                        "created": created_time,
                                        "model": self.model_name,
                                        "choices": [{
                                            "index": 0,
                                            "delta": delta
                                        }]
                                    }
                                    yield f"data: {json.dumps(response_data, ensure_ascii=False)}\n\n".encode('utf-8')
                            except Exception as e:
                                logger.error(f"处理响应块时出错: {str(e)}")
                                continue
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP状态错误: {e.response.status_code} - {e.response.text}")
            error_data = self._format_error_data(chat_id, created_time, f"HTTP错误: {e.response.status_code} - {e.response.text}")
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n".encode('utf-8')
            yield "data: [DONE]\n\n".encode('utf-8')
        except httpx.RequestError as e:
            logger.error(f"请求错误: {str(e)}")
            error_data = self._format_error_data(chat_id, created_time, f"请求错误: {str(e)}")
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n".encode('utf-8')
            yield "data: [DONE]\n\n".encode('utf-8')
        except Exception as e:
            logger.error(f"生成响应时出错: {str(e)}")
            error_data = self._format_error_data(chat_id, created_time, f"错误: {str(e)}")
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n".encode('utf-8')
            yield "data: [DONE]\n\n".encode('utf-8')

    def _format_error_data(self, chat_id, created_time, error_message):
        """格式化错误数据为OpenAI兼容格式"""
        return {
            "id": chat_id,
            "object": "chat.completion.chunk",
            "created": created_time,
            "model": self.model_name,
            "choices": [{
                "index": 0,
                "delta": {"content": error_message},
                "finish_reason": "stop"
            }]
        }

    async def generate(self, messages: List[Dict], system_prompt: Optional[str] = None) -> Dict:
        """
        非流式生成响应
        
        Args:
            messages (List[Dict]): 消息历史
            system_prompt (Optional[str]): 系统提示词
        
        Returns:
            Dict: 完整的响应
        """
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        
        if system_prompt:
            # 确保系统提示使用正确的格式
            if not any(msg.get("role") == "system" for msg in messages):
                messages = [{"role": "system", "content": system_prompt}] + messages
        
        # 确保messages格式符合OpenAI标准
        cleaned_messages = []
        for msg in messages:
            if not isinstance(msg, dict):
                logger.warning(f"跳过非字典格式消息: {msg}")
                continue
            
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if not content:
                logger.warning(f"跳过空内容消息: {msg}")
                continue
            
            cleaned_messages.append({"role": role, "content": content})
        
        if not cleaned_messages:
            logger.error("所有消息都无效，无法发送请求")
            return {
                "id": chat_id,
                "object": "chat.completion",
                "created": created_time,
                "model": self.model_name,
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "错误: 没有有效的消息可以处理",
                        "reasoning_content": "",
                        "execution_content": ""
                    },
                    "finish_reason": "stop"
                }]
            }
        
        # 构建请求payload，确保符合API格式要求
        payload = {
            "model": self.model_name,
            "messages": cleaned_messages,
            "stream": False
        }
        
        # 添加模型参数（如果不为None或默认值）
        if self.temperature != 0.7:
            payload["temperature"] = self.temperature
        
        if self.top_p != 1.0:
            payload["top_p"] = self.top_p
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
        
        if self.presence_penalty:
            payload["presence_penalty"] = self.presence_penalty
        
        if self.frequency_penalty:
            payload["frequency_penalty"] = self.frequency_penalty
        
        # 只添加API实际支持的自定义参数
        if self.provider == "deepseek" and self.custom_parameters:
            for key, value in self.custom_parameters.items():
                # 避免覆盖标准参数
                if key not in payload and value is not None:
                    payload[key] = value
        
        # 记录请求详情（用于调试）
        logger.info(f"发送API请求: url={self.api_url}, model={self.model_name}")
        logger.debug(f"请求载荷: {json.dumps(payload, ensure_ascii=False)}")
        
        try:
            # 设置 timeout 为 30 秒
            timeout = httpx.Timeout(30.0, connect=30.0, read=30.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=self.headers
                )
                
                # 记录API响应状态
                logger.info(f"API响应状态码: {response.status_code}")
                
                # 检查响应状态码
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"API请求失败: 状态码={response.status_code}, 响应={error_text}")
                    
                    # 返回错误信息
                    return {
                        "id": chat_id,
                        "object": "chat.completion",
                        "created": created_time,
                        "model": self.model_name,
                        "choices": [{
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": f"API请求失败: HTTP {response.status_code}\n{error_text}",
                                "reasoning_content": "",
                                "execution_content": ""
                            },
                            "finish_reason": "stop"
                        }]
                    }
                
                # 处理成功的响应
                result = response.json()
                
                # 确保响应格式正确
                if "choices" not in result or not result["choices"]:
                    logger.error(f"API响应格式错误: {result}")
                    return {
                        "id": chat_id,
                        "object": "chat.completion",
                        "created": created_time,
                        "model": self.model_name,
                        "choices": [{
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": f"API响应格式错误: {json.dumps(result)}",
                                "reasoning_content": "",
                                "execution_content": ""
                            },
                            "finish_reason": "stop"
                        }]
                    }
                
                # 构建标准格式响应
                return {
                    "id": chat_id,
                    "object": "chat.completion",
                    "created": created_time,
                    "model": self.model_name,
                    "choices": [{
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": result["choices"][0]["message"]["content"],
                            "reasoning_content": "",
                            "execution_content": ""
                        },
                        "finish_reason": result["choices"][0].get("finish_reason", "stop")
                    }]
                }
        except Exception as e:
            logger.error(f"生成响应时出错: {str(e)}")
            return {
                "id": chat_id,
                "object": "chat.completion",
                "created": created_time,
                "model": self.model_name,
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": f"生成响应时出错: {str(e)}",
                        "reasoning_content": "",
                        "execution_content": ""
                    },
                    "finish_reason": "stop"
                }]
            }

    @staticmethod
    def create_client(model: Model) -> 'UniClient':
        """
        创建通用客户端实例
        
        Args:
            model (Model): 模型配置对象
        
        Returns:
            UniClient: 通用客户端实例
        """
        return UniClient(model)

    def _prepare_request_kwargs(self) -> dict:
        """准备请求参数"""
        kwargs = {
            "temperature": self.temperature,
            "top_p": self.top_p,
            "max_tokens": self.max_tokens,
            "presence_penalty": self.presence_penalty,
            "frequency_penalty": self.frequency_penalty,
        }
        
        # 添加自定义参数
        if self.custom_parameters:
            kwargs["custom_parameters"] = self.custom_parameters
            
        return kwargs 