"""Claude API 客户端"""
import json
from typing import AsyncGenerator, Optional, List, Dict
from app.utils.logger import logger
from .base_client import BaseClient


class ClaudeClient(BaseClient):
    def __init__(self, api_key: str, api_url: str = "https://api.anthropic.com/v1/messages", provider: str = "anthropic", is_origin_reasoning: bool = False):
        """初始化 Claude 客户端
        
        Args:
            api_key: Claude API密钥
            api_url: Claude API地址
            provider: API提供商
            is_origin_reasoning: 是否为原始推理模型
        """
        super().__init__(api_key, api_url)
        self.provider = provider
        self.is_origin_reasoning = is_origin_reasoning
        self.reasoning_content = []
        logger.debug(f"ClaudeClient url: {self.api_url}")

    async def stream_chat(
        self,
        messages: list,
        model_arg: tuple[float, float, float, float] = (0.7, 0.7, 0, 0),
        model: str = "claude-3-5-sonnet-20240620",
        stream: bool = True,
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[Dict] = None,
        enable_thinking: bool = False,
        thinking_budget_tokens: int = 16000,
        **kwargs
    ) -> AsyncGenerator[tuple[str, str], None]:
        """流式或非流式对话
        
        Args:
            messages: 消息列表
            model_arg: 模型参数元组[temperature, top_p, presence_penalty, frequency_penalty]
            model: 模型名称
            stream: 是否使用流式输出
            tools: 工具配置列表
            tool_choice: 工具选择配置
            enable_thinking: 是否启用扩展思考
            thinking_budget_tokens: 思考token预算
        """
        temperature, top_p, presence_penalty, frequency_penalty = model_arg
        
        # 准备基础请求数据
        data = self._prepare_request_data(
            messages=messages,
            model=model,
            stream=stream,
            temperature=temperature,
            top_p=top_p,
            presence_penalty=presence_penalty,
            frequency_penalty=frequency_penalty,
            **kwargs
        )
        
        # 添加 Claude 特定参数
        if tools:
            data["tools"] = tools
        if tool_choice:
            data["tool_choice"] = tool_choice
        if enable_thinking:
            data["thinking_budget_tokens"] = thinking_budget_tokens

        if self.provider == "anthropic":
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",  # Standard Claude API version
                "Accept": "text/event-stream" if stream else "application/json",
                # Add other necessary headers if required by your specific Claude setup/version
                # For example, some versions might need: "anthropic-beta": "tools-2024-04-04" if using tools
            }

            # 用于收集推理内容
            self.reasoning_content = []
            in_thinking = False

            async for chunk in self._make_request(headers, data):
                chunk_str = chunk.decode('utf-8')
                if not chunk_str.strip():
                    continue

                for line in chunk_str.split('\n'):
                    if line.startswith('data: '):
                        json_str = line[6:]
                        if json_str.strip() == '[DONE]':
                            return

                        try:
                            chunk_data = json.loads(json_str)
                            logger.debug(f"chunk_data: {chunk_data}")
                            
                            # 处理新的响应格式
                            if 'choices' in chunk_data:
                                delta = chunk_data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                
                                if content:
                                    # 处理推理内容
                                    if '<think>' in content:
                                        in_thinking = True
                                        content = content.replace('<think>', '').strip()
                                    
                                    if '</think>' in content:
                                        in_thinking = False
                                        content = content.replace('</think>', '').strip()
                                        if content and self.is_origin_reasoning:
                                            yield "reasoning_content", content
                                        return
                                    
                                    # 如果在推理块内且是推理模型，输出推理内容
                                    if in_thinking and self.is_origin_reasoning:
                                        if content.strip():
                                            self.reasoning_content.append(content)
                                            yield "reasoning_content", content
                                    # 如果不是推理模型，直接输出内容
                                    elif not self.is_origin_reasoning and content.strip():
                                        yield "answer", content
                            
                            # 处理旧的响应格式
                            elif chunk_data.get('type') == 'content_block_delta':
                                delta = chunk_data.get('delta', {})
                                
                                if delta.get('type') == 'thinking_delta':
                                    thinking = delta.get('thinking', '')
                                    if thinking:
                                        yield "thinking", thinking
                                
                                elif delta.get('type') == 'tool_use':
                                    tool_content = json.dumps(delta.get('input', {}))
                                    if tool_content:
                                        yield "tool_use", tool_content
                                
                                elif delta.get('type') == 'text_delta':
                                    content = delta.get('text', '')
                                    if content:
                                        # 处理推理内容
                                        if '<think>' in content:
                                            in_thinking = True
                                            content = content.replace('<think>', '').strip()
                                        
                                        if '</think>' in content:
                                            in_thinking = False
                                            content = content.replace('</think>', '').strip()
                                            if content and self.is_origin_reasoning:
                                                yield "reasoning_content", content
                                            return
                                        
                                        # 如果在推理块内且是推理模型，输出推理内容
                                        if in_thinking and self.is_origin_reasoning:
                                            if content.strip():
                                                self.reasoning_content.append(content)
                                                yield "reasoning_content", content
                                        # 如果不是推理模型，直接输出内容
                                        elif not self.is_origin_reasoning and content.strip():
                                            yield "answer", content
                                        
                        except json.JSONDecodeError:
                            continue
        else:
            raise ValueError(f"不支持的Claude Provider: {self.provider}")
