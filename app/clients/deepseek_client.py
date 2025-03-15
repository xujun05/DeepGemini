"""DeepSeek API 客户端"""
import json
from typing import AsyncGenerator
from app.utils.logger import logger
from .base_client import BaseClient


class DeepSeekClient(BaseClient):
    def __init__(self, api_key: str, api_url: str, provider: str = "deepseek", is_origin_reasoning: bool = True):
        """初始化 DeepSeek 客户端
        
        Args:
            api_key: API密钥
            api_url: API地址
            provider: 提供商名称
            is_origin_reasoning: 是否为推理模型客户端
        """
        super().__init__(api_key, api_url)
        self.provider = provider
        self.is_origin_reasoning = is_origin_reasoning  # 保存标志
        
    def _process_think_tag_content(self, content: str) -> tuple[bool, str]:
        """处理包含 think 标签的内容
        
        Args:
            content: 需要处理的内容字符串
            
        Returns:
            tuple[bool, str]: 
                bool: 是否检测到完整的 think 标签对
                str: 处理后的内容
        """
        has_start = "<think>" in content
        has_end = "</think>" in content
        
        if has_start and has_end:
            return True, content
        elif has_start:
            return False, content
        elif not has_start and not has_end:
            return False, content
        else:
            return True, content
            
    async def stream_chat(
        self,
        messages: list,
        model: str = "deepseek-ai/DeepSeek-R1",
        **kwargs
    ) -> AsyncGenerator[tuple[str, str], None]:
        """流式对话"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 准备请求数据
        data = self._prepare_request_data(messages, model, **kwargs)
        
        logger.debug(f"DeepSeek 请求数据：{data}")

        first_chunk = True
        reasoning_completed = False  # 添加标志来追踪推理是否完成
        think_content_buffer = ""  # 添加缓冲区来收集 think 标签内的内容
        in_think_tag = False  # 添加标志来追踪是否在 think 标签内
        
        async for chunk in self._make_request(headers, data):
            chunk_str = chunk.decode('utf-8')
            
            try:
                lines = chunk_str.splitlines()
                for line in lines:
                    if line.startswith("data: "):
                        json_str = line[len("data: "):]
                        if json_str == "[DONE]":
                            return
                        
                        data = json.loads(json_str)
                        if data and data.get("choices") and data["choices"][0].get("delta"):
                            delta = data["choices"][0]["delta"]
                            if self.is_origin_reasoning:
                                # 处理推理模型的输出
                                if delta.get("reasoning_content"):
                                    content = delta["reasoning_content"]
                                    logger.debug(f"提取推理内容：{content}")
                                    yield "reasoning", content
                                # 处理 content 中的 think 标签内容
                                elif delta.get("content"):
                                    content = delta["content"]
                                    think_content_buffer += content
                                    
                                    if "<think>" in content or in_think_tag:
                                        # 开始收集推理内容
                                        logger.debug(f"检测到推理开始标记：{content}")
                                        in_think_tag = True
                                        # 提取 <think> 标签后的内容
                                        after_think = content.split("<think>")[-1]
                                        if in_think_tag:
                                            logger.debug(f"开始提取 think 标签后的推理内容")
                                            yield "reasoning", content

                                    elif "</think>" in content and not in_think_tag:
                                        # 推理内容结束
                                        in_think_tag = False
                                        logger.debug(f"检测到推理结束标记：{content}")
                                        # 提取 </think> 标签前的内容
                                        before_end_think = content.split("</think>")[0]
                                        if before_end_think.strip():
                                            logger.debug(f"开始提取 think 结束标签前的推理内容")
                                            yield "reasoning", content
                                        reasoning_completed = True
                                        think_content_buffer = ""
                                        
                                    elif not kwargs.get("is_last_step"):
                                        return
                            else:
                                # 处理执行模型的输出
                                if delta.get("content"):
                                    content = delta["content"]
                                    if content.strip():  # 只处理非空内容
                                        if first_chunk and delta.get("role"):
                                            # 第一个块可能包含角色信息
                                            first_chunk = False
                                            if content.strip():
                                                logger.debug(f"执行模型首个响应：{content}")
                                                yield "answer", content
                                        else:
                                            logger.debug(f"执行模型响应：{content}")
                                            yield "answer", content
                                elif delta.get("role") and first_chunk:
                                    # 处理第一个只包含角色信息的块
                                    first_chunk = False
                                    logger.debug("处理执行模型角色信息")
                                    
            except json.JSONDecodeError as e:
                logger.error(f"JSON解析错误: {e}")
                continue
            except Exception as e:
                logger.error(f"处理块数据时发生错误: {e}")
                continue
