"""Grok3 API 客户端"""
import json
from typing import AsyncGenerator
from app.utils.logger import logger
from .base_client import BaseClient


class Grok3Client(BaseClient):
    def __init__(self, api_key: str, api_url: str, is_origin_reasoning: bool = True):
        """初始化 Grok3 客户端
        
        Args:
            api_key: API密钥
            api_url: API地址
            is_origin_reasoning: 是否为推理模型
        """
        super().__init__(api_key, api_url)
        self.provider = "grok3"
        self._current_line = ""  # 初始化行缓存
        self.is_origin_reasoning = is_origin_reasoning
        
    async def stream_chat(
        self,
        messages: list,
        model: str = "grok3-reasoner",
        stream: bool = True,
        **kwargs
    ) -> AsyncGenerator[tuple[str, str], None]:
        """流式或非流式对话
        
        Args:
            messages: 消息列表
            model: 模型名称
            stream: 是否使用流式输出
            **kwargs: 其他参数
                is_last_step: 是否为最后一步
                is_first_step: 是否为第一步
            
        Yields:
            tuple[str, str]: (内容类型, 内容)
                内容类型: "reasoning" 或 "content"
                内容: 实际的文本内容
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream" if stream else "application/json",
        }
        
        data = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 2000),
            "top_p": kwargs.get("top_p", 1.0),
            "presence_penalty": kwargs.get("presence_penalty", 0.0),
            "frequency_penalty": kwargs.get("frequency_penalty", 0.0)
        }
        
        if stream:
            # 重置行缓存
            self._current_line = ""
            reasoning_completed = False  # 追踪推理是否完成
            
            async for chunk in self._make_request(headers, data):
                try:
                    chunk_str = chunk.decode('utf-8')
                    if not chunk_str.strip():
                        continue
                        
                    for line in chunk_str.split('\n'):
                        if line.startswith('data: '):
                            json_str = line[6:]
                            if json_str.strip() == '[DONE]':
                                # 处理最后可能剩余的内容
                                if self._current_line.strip():
                                    last_line = self._current_line.strip()
                                    if last_line.startswith('>'):
                                        if self.is_origin_reasoning:
                                            yield "reasoning", last_line[1:].strip()
                                    else:
                                        if not self.is_origin_reasoning or kwargs.get("is_last_step"):
                                            yield "content", last_line
                                return
                                
                            data = json.loads(json_str)
                            content = data.get('choices', [{}])[0].get('delta', {}).get('content', '')
                            
                            if content:
                                # 追加到当前行
                                self._current_line += content
                                
                                # 处理完整行
                                while "\n" in self._current_line:
                                    line, self._current_line = self._current_line.split("\n", 1)
                                    line = line.strip()
                                    # 跳过分隔符行
                                    if line == "---":
                                        continue
                                    if line:  # 忽略空行
                                        if line.startswith(">"):
                                            if self.is_origin_reasoning:
                                                yield "reasoning", "\n"+line[1:].strip()
                                        else:
                                            # 检测推理内容是否结束
                                            if not reasoning_completed:
                                                reasoning_completed = True
                                                # 如果不是最后一步，直接结束流
                                                if not kwargs.get("is_last_step"):
                                                    return
                                            # 如果是最后一步或非推理模型，继续处理 content
                                            if not self.is_origin_reasoning or kwargs.get("is_last_step"):
                                                yield "content", "\n"+line
                                
                                # 如果是结束标记，处理最后一行
                                if data.get("finish_reason") == "stop":
                                    last_line = self._current_line.strip()
                                    if last_line:
                                        if last_line.startswith(">"):
                                            if self.is_origin_reasoning:
                                                yield "reasoning", "\n"+last_line[1:].strip()
                                        else:
                                            if not self.is_origin_reasoning or kwargs.get("is_last_step"):
                                                yield "content", "\n"+last_line
                                    self._current_line = ""
                                            
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"处理 Grok3 流式响应时发生错误: {e}")
                    continue
        else:
            # 非流式输出处理
            async for chunk in self._make_request(headers, data):
                try:
                    response = json.loads(chunk.decode('utf-8'))
                    content = response.get('choices', [{}])[0].get('message', {}).get('content', '')
                    
                    if content:
                        reasoning_completed = False
                        # 按行处理内容
                        for line in content.split('\n'):
                            line = line.strip()
                            if line:
                                if line.startswith('>'):
                                    if self.is_origin_reasoning:
                                        yield "reasoning", "\n"+line[1:].strip()
                                else:
                                    # 检测推理内容是否结束
                                    if not reasoning_completed:
                                        reasoning_completed = True
                                        # 如果不是最后一步，直接结束流
                                        if not kwargs.get("is_last_step"):
                                            return
                                    # 如果是最后一步或非推理模型，继续处理 content
                                    if not self.is_origin_reasoning or kwargs.get("is_last_step"):
                                        yield "content", "\n"+line
                            
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.error(f"处理 Grok3 非流式响应时发生错误: {e}")
                    continue 