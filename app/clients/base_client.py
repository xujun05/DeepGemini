"""基础客户端类，定义通用接口"""
from typing import AsyncGenerator, Any
import aiohttp
from app.utils.logger import logger
from abc import ABC, abstractmethod


class BaseClient(ABC):
    def __init__(self, api_key: str, api_url: str):
        """初始化基础客户端
        
        Args:
            api_key: API密钥
            api_url: API地址
        """
        self.api_key = api_key
        self.api_url = api_url
        
    def _prepare_request_data(self, messages: list, model: str, **kwargs) -> dict:
        """准备请求数据，包括自定义参数
        
        Args:
            messages: 消息列表
            model: 模型名称
            **kwargs: 其他参数，包括自定义参数
            
        Returns:
            dict: 处理后的请求数据
        """
        data = {
            "model": model,
            "messages": messages,
            "stream": kwargs.get("stream", True),
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 2000),
            "top_p": kwargs.get("top_p", 1.0),
            "presence_penalty": kwargs.get("presence_penalty", 0.0),
            "frequency_penalty": kwargs.get("frequency_penalty", 0.0)
        }
        
        # 添加自定义参数
        custom_parameters = kwargs.get("custom_parameters", {})
        if custom_parameters:
            data.update(custom_parameters)
            
        return data
        
    async def _make_request(self, headers: dict, data: dict, url: str = None) -> AsyncGenerator[bytes, None]:
        """发送请求并处理响应
        
        Args:
            headers: 请求头
            data: 请求数据
            url: 自定义请求URL，如不提供则使用self.api_url
            
        Yields:
            bytes: 原始响应数据
        """
        try:
            request_url = url if url else self.api_url
            async with aiohttp.ClientSession() as session:        
                async with session.post(
                    request_url,
                    headers=headers,
                    json=data
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"API 请求失败: {error_text}")
                        return
                        
                    async for chunk in response.content.iter_any():
                        yield chunk
                        
        except Exception as e:
            logger.error(f"请求 API 时发生错误: {e}")
            
    @abstractmethod
    async def stream_chat(self, messages: list, model: str) -> AsyncGenerator[tuple[str, str], None]:
        """流式对话，由子类实现
        
        Args:
            messages: 消息列表
            model: 模型名称
            
        Yields:
            tuple[str, str]: (内容类型, 内容)
        """
        pass
