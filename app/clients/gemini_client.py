"""Gemini API 客户端"""
import json
from typing import AsyncGenerator
from app.utils.logger import logger
from .base_client import BaseClient

class GeminiClient(BaseClient):
    def __init__(self, api_key: str, api_url: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent"):
        """初始化 Gemini 客户端
        
        Args:
            api_key: Gemini API密钥
            api_url: Gemini API地址
        """
        # 在 URL 中添加 API Key
        if "?" not in api_url:
            api_url = f"{api_url}?key={api_key}"
        super().__init__(api_key, api_url)
        self.provider = "google"

    async def stream_chat(
        self, 
        messages: list,
        model: str,
        is_origin_reasoning: bool = True
    ) -> AsyncGenerator[tuple[str, str], None]:
        """流式对话
        
        Args:
            messages: 消息列表
            model: 模型名称
            is_origin_reasoning: 是否使用原始推理输出
            
        Yields:
            tuple[str, str]: (内容类型, 内容)
                内容类型: "reasoning" 或 "content" 
                内容: 实际的文本内容
        """
        headers = {
            "Content-Type": "application/json",
        }

        # 转换消息格式为 Gemini 格式
        gemini_messages = []
        for msg in messages:
            if msg["role"] == "user":
                gemini_messages.append({"role": "user", "parts": [{"text": msg["content"]}]})
            elif msg["role"] == "assistant": 
                gemini_messages.append({"role": "model", "parts": [{"text": msg["content"]}]})

        data = {
            "contents": gemini_messages,
            "generationConfig": {
                "temperature": 0.7,
                "topP": 1,
                "topK": 1,
                "maxOutputTokens": 16000,
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
        }

        async for chunk in self._make_request(headers, data):
            try:
                response = json.loads(chunk.decode())
                if "candidates" in response:
                    for candidate in response["candidates"]:
                        if "content" in candidate:
                            content = candidate["content"]["parts"][0]["text"]
                            # 首先输出推理过程
                            yield "reasoning", content
                            # 然后输出最终内容标记
                            yield "content", ""
            except json.JSONDecodeError:
                continue
            except Exception as e:
                logger.error(f"处理 Gemini 响应时发生错误: {e}") 