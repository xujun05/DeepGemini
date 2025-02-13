"""Gemini API 客户端"""
import json
from typing import AsyncGenerator
from app.utils.logger import logger
from .base_client import BaseClient

class GeminiClient(BaseClient):
    def __init__(self, api_key: str, api_url: str = "https://gemini.yyds.top/v1/chat/completions"):
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
        model: str,
        is_origin_reasoning: bool = True
    ) -> AsyncGenerator[tuple[str, str], None]:
        """流式对话
        
        Args:
            messages: 消息列表
            model: 模型名称
            is_origin_reasoning: 是否使用原始推理输出
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        data = {
            "messages": messages,
            "model": model,
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 16000,
        }

        first_chunk = True
        async for chunk in self._make_request(headers, data):
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
                        delta = data.get('choices', [{}])[0].get('delta', {})
                        
                        # 处理第一个chunk的完整消息
                        if first_chunk:
                            content = delta.get('content', '')
                            role = delta.get('role', '')
                            if role:  # 如果包含role，这是第一个chunk
                                first_chunk = False
                                if content:  # 确保不会丢失第一个chunk中的content
                                    yield "reasoning", content
                                continue
                            
                        # 处理后续chunks
                        content = delta.get('content', '')
                        if content:
                            yield "reasoning", content
                            
            except json.JSONDecodeError:
                continue
            except Exception as e:
                logger.error(f"处理 Gemini 响应时发生错误: {e}")