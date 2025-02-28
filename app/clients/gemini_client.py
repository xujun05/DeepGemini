"""Gemini API 客户端"""
import json
from typing import AsyncGenerator
from app.utils.logger import logger
from .base_client import BaseClient

class GeminiClient(BaseClient):
    def __init__(self, api_key: str, api_url: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"):
        """初始化 Gemini 客户端
        
        Args:
            api_key: Gemini API密钥
            api_url: Gemini API地址
        """
        super().__init__(api_key, api_url)
        self.provider = "google"

    async def stream_chat(
        self,
        messages: list,
        model: str = "gemini-pro",
        stream: bool = True,
        **kwargs
    ) -> AsyncGenerator[tuple[str, str], None]:
        """流式或非流式对话
        
        Args:
            messages: 消息列表
            model: 模型名称
            stream: 是否使用流式输出
            **kwargs: 其他参数，包括自定义参数
            
        Yields:
            tuple[str, str]: (内容类型, 内容)
        """
        headers = {
            "Content-Type": "application/json"
        }

        # 准备基础请求数据
        data = self._prepare_request_data(messages, model, stream=stream, **kwargs)
        
        # 转换为 Gemini 格式
        gemini_data = {
            "contents": [
                {
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [{"text": msg["content"]}]
                }
                for msg in messages
            ],
            "generationConfig": {
                "temperature": data.get("temperature", 0.7),
                "topP": data.get("top_p", 1.0),
                "maxOutputTokens": data.get("max_tokens", 2000)
            }
        }
        
        # 添加自定义参数
        custom_parameters = kwargs.get("custom_parameters", {})
        if custom_parameters:
            if "generationConfig" in custom_parameters:
                gemini_data["generationConfig"].update(custom_parameters["generationConfig"])
            if "safetySettings" in custom_parameters:
                gemini_data["safetySettings"] = custom_parameters["safetySettings"]
            # 其他可能的自定义参数...

        logger.debug(f"Gemini 请求数据: {gemini_data}")

        # 添加 API 密钥到 URL
        url = f"{self.api_url}?key={self.api_key}"
        
        if stream:
            async for chunk in self._make_request(headers, gemini_data):
                try:
                    chunk_str = chunk.decode('utf-8')
                    if not chunk_str.strip():
                        continue
                        
                    for line in chunk_str.split('\n'):
                        if line.startswith('data: '):
                            json_str = line[6:]
                            if json_str.strip() == '[DONE]':
                                return
                                
                            data = json.loads(json_str)
                            if data.get("candidates"):
                                content = data["candidates"][0].get("content", {})
                                text = content.get("parts", [{}])[0].get("text", "")
                                if text:
                                    yield "answer", text
                                    
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"处理 Gemini 流式响应时发生错误: {e}")
                    continue
        else:
            async for chunk in self._make_request(headers, gemini_data):
                try:
                    response = json.loads(chunk.decode('utf-8'))
                    if response.get("candidates"):
                        content = response["candidates"][0].get("content", {})
                        text = content.get("parts", [{}])[0].get("text", "")
                        if text:
                            yield "answer", text
                            return
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"处理 Gemini 非流式响应时发生错误: {e}")
                    continue