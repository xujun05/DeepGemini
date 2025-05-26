"""Gemini API 客户端"""
import json
from typing import AsyncGenerator
import re
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
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

        # logger.debug(f"Gemini 请求数据: {gemini_data}")

        # 构建正确的URL
        base_url = self.api_url
        
        # 如果基础URL仅仅是域名，构建完整URL
        if base_url == "https://generativelanguage.googleapis.com" or not "/models/" in base_url:
            # 构建完整的API路径
            api_version = "v1beta"
            operation = "streamGenerateContent" if stream else "generateContent"
            
            # 移除尾部斜杠（如果有）
            base_url = base_url.rstrip('/')
            
            # 构建完整URL
            final_url = f"{base_url}/{api_version}/models/{model}:{operation}?key={self.api_key}"
            
            # 添加SSE参数（如果是流式请求）
            if stream:
                final_url += "&alt=sse"
        else:
            # 处理已经包含模型和操作的复杂URL
            # 从URL中提取模型名称，如果有的话替换为当前使用的模型
            model_in_url = re.search(r'models/([^/:]+)', base_url)
            if model_in_url:
                base_url = base_url.replace(model_in_url.group(1), model)
            
            # 确保使用正确的端点
            if stream:
                if ':generateContent' in base_url:
                    base_url = base_url.replace(':generateContent', ':streamGenerateContent')
                elif ':streamGenerateContent' not in base_url:
                    # 如果URL没有指定操作，添加streamGenerateContent
                    if base_url.endswith('/'):
                        base_url += 'streamGenerateContent'
                    else:
                        base_url += ':streamGenerateContent'
                    
            # 添加查询参数
            parsed_url = urlparse(base_url)
            query_params = parse_qs(parsed_url.query)
            
            # 构建最终URL
            final_url = base_url
            if '?' not in final_url:
                final_url += '?'
            elif not final_url.endswith('?'):
                final_url += '&'
                
            # 添加必要的参数
            if stream and 'alt' not in query_params:
                final_url += 'alt=sse&'
                
            if 'key' not in query_params:
                final_url += f'key={self.api_key}'
            
        # Redact API key for logging
        parsed_url_for_log = urlparse(final_url)
        query_params_for_log = parse_qs(parsed_url_for_log.query)
        if 'key' in query_params_for_log:
            query_params_for_log['key'] = ['[REDACTED]'] # Mask the API key
        masked_query_for_log = urlencode(query_params_for_log, doseq=True)
        masked_final_url_for_log = urlunparse(parsed_url_for_log._replace(query=masked_query_for_log))
        logger.debug(f"Gemini 最终请求URL (Key Redacted): {masked_final_url_for_log}")
        
        if stream:
            async for chunk in self._make_request(headers, gemini_data, final_url):
                try:
                    chunk_str = chunk.decode('utf-8')
                    if not chunk_str.strip():
                        continue
                        
                    # 处理当前chunk中的每一行
                    for line in chunk_str.split('\n'):
                        line = line.strip()
                        if not line:
                            continue
                            
                        if line.startswith('data: '):
                            json_str = line[6:]
                            if json_str.strip() == '[DONE]':
                                logger.debug("收到流式传输结束标记 [DONE]")
                                return
                            
                            try:
                                data = json.loads(json_str)
                                if data.get("candidates"):
                                    # 获取文本内容
                                    candidate = data["candidates"][0]
                                    content = candidate.get("content", {})
                                    parts = content.get("parts", [])
                                    
                                    for part in parts:
                                        text = part.get("text", "")
                                        if text:
                                            logger.debug(f"流式响应片段: {text[:30]}...")
                                            yield "answer", text
                            except json.JSONDecodeError as je:
                                logger.warning(f"JSON解析错误: {je}, 原始数据: {json_str[:100]}")
                            except Exception as e:
                                logger.error(f"处理SSE数据时出错: {e}")
                except Exception as e:
                    logger.error(f"处理 Gemini 流式响应时发生错误: {str(e)}")
                    continue
        else:
            # 非流式请求处理
            full_response = ""
            async for chunk in self._make_request(headers, gemini_data, final_url):
                try:
                    chunk_str = chunk.decode('utf-8')
                    full_response += chunk_str
                except Exception as e:
                    logger.error(f"处理 Gemini 非流式响应时发生错误: {e}")
            
            try:
                # 尝试解析完整响应
                response = json.loads(full_response)
                if response.get("candidates"):
                    content = response["candidates"][0].get("content", {})
                    parts = content.get("parts", [])
                    
                    result_text = ""
                    for part in parts:
                        text = part.get("text", "")
                        result_text += text
                    
                    if result_text:
                        yield "answer", result_text
            except json.JSONDecodeError:
                logger.error(f"非流式响应JSON解析失败: {full_response[:200]}")
            except Exception as e:
                logger.error(f"处理非流式响应时发生错误: {e}")