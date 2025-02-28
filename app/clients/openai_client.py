"""OpenAI API 客户端"""
import json
from typing import AsyncGenerator
from app.utils.logger import logger
from .base_client import BaseClient


class OpenAIClient(BaseClient):
    def __init__(self, api_key: str, api_url: str = "https://api.openai.com/v1/chat/completions"):
        """初始化 OpenAI 客户端
        
        Args:
            api_key: OpenAI API密钥
            api_url: OpenAI API地址
        """
        super().__init__(api_key, api_url)
        self.provider = "openai"

    async def stream_chat(
        self,
        messages: list,
        model: str = "gpt-3.5-turbo",
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
                内容类型: "answer" 或 "reasoning"
                内容: 实际的文本内容
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            # "Accept": "text/event-stream" if stream else "application/json",
        }

        # 使用基类方法准备请求数据
        data = self._prepare_request_data(messages, model, stream=stream, **kwargs)
        logger.debug(f"OpenAI 请求数据: {data}")
        if stream:
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
                            
                            if first_chunk:
                                content = delta.get('content', '')
                                role = delta.get('role', '')
                                if role:
                                    first_chunk = False
                                    if content:
                                        yield "answer", content
                                    continue
                            
                            content = delta.get('content', '')
                            if content:
                                yield "answer", content
                                
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"处理 OpenAI 流式响应时发生错误: {e}")
                    continue
        else:
            async for chunk in self._make_request(headers, data):
                try:
                    response = json.loads(chunk.decode('utf-8'))
                    content = response.get('choices', [{}])[0].get('message', {}).get('content', '')
                    if content:
                        yield "answer", content
                        return
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"处理 OpenAI 非流式响应时发生错误: {e}")
                    continue 