from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import Dict, List, Optional, Any
import time
import random
import logging
import traceback
import asyncio
import json
import requests
import aiohttp

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Agent")

class Agent:
    """智能体类，用于在会议中代表一个参与者"""
    
    def __init__(self, name: str, role_description: str, personality: str = "", 
                 skills: List[str] = None, model_params: Dict[str, Any] = None,
                 base_url: str = None, api_key: str = None):
        self.name = name
        self.role_description = role_description
        self.personality = personality
        self.skills = skills or []
        self.model_params = model_params or {
            "model_name": "gpt-3.5-turbo",
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        # 确保base_url有效
        self.base_url = base_url
        if not self.base_url and "base_url" in self.model_params:
            self.base_url = self.model_params["base_url"]
        
        # 确保api_key有效
        self.api_key = api_key
        if not self.api_key and "api_key" in self.model_params:
            self.api_key = self.model_params["api_key"]
        
        # 根据模型名称确定提供商
        self.provider = "openai"  # 默认为OpenAI兼容接口
        model_name = self.model_params.get("model_name", "").lower()
        if "gemini" in model_name:
            self.provider = "google"
        
        self.system_prompt = self._create_system_prompt()
        self.last_response = ""  # 添加存储最后响应的属性
        
        # 初始化会话历史
        self.conversation_history = []
        
        # 初始化LLM实例
        try:
            # 将base_url和api_key添加到model_params中
            if self.base_url and "base_url" not in self.model_params:
                self.model_params["base_url"] = self.base_url
            if self.api_key and "api_key" not in self.model_params:
                self.model_params["api_key"] = self.api_key
                
            # 创建LLM实例
            self.llm = ChatOpenAI(**self.model_params)
            logger.info(f"已初始化智能体 {self.name} 的LLM模型: {model_name}")
        except Exception as e:
            logger.error(f"初始化LLM实例失败: {str(e)}", exc_info=True)
            # 创建一个空属性，以便后续可以检查
            self.llm = None
    
    def _create_system_prompt(self) -> str:
        """创建系统提示"""
        prompt = f"你是{self.name}，{self.role_description}。"
        
        if self.personality:
            prompt += f"\n你的性格特点: {self.personality}"
            
        if self.skills:
            prompt += f"\n你的专业技能: {', '.join(self.skills)}"
            
        prompt += "\n请根据你的角色特点和专业知识参与讨论。"
        
        # 确保conversation_history已初始化
        if not hasattr(self, 'conversation_history') or self.conversation_history is None:
            self.conversation_history = []
            
        return prompt
    
    def generate_response(self, prompt: str, context: List[Dict[str, str]] = None) -> str:
        """生成回应"""
        try:
            # 构建消息
            messages = []
            
            # 添加系统提示
            messages.append({"role": "system", "content": self.system_prompt})
            
            # 添加上下文
            if context:
                messages.extend(context)
                
            # 添加当前提示
            messages.append({"role": "user", "content": prompt})
            
            # 调用API
            response = self._call_api(messages)
            
            return response
        except Exception as e:
            logger.error(f"生成回应失败: {str(e)}", exc_info=True)
            return f"[生成回应失败: {str(e)}]"
    
    async def generate_response_stream(self, prompt: str, context: Optional[List[Dict[str, Any]]] = None):
        """流式生成响应"""
        self.last_response = ""  # 重置上次响应
        
        # 合并上下文和提示
        messages = []
        
        # 添加系统提示
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})
        
        # 添加上下文消息
        if context:
            for msg in context:
                role = "assistant" if msg.get("agent") != "user" else "user"
                content = msg.get("content", "")
                if content:
                    messages.append({"role": role, "content": content})
        
        # 添加当前提示
        messages.append({"role": "user", "content": prompt})
        
        # 使用底层API实时流式生成响应
        response_chunks = []
        async for chunk in self._call_api_with_messages_stream(messages):
            # 累积块以构建完整响应
            response_chunks.append(chunk)
            self.last_response = "".join(response_chunks)
            yield chunk
    
    def _call_api(self, messages):
        """调用LLM API生成响应"""
        try:
            # 确保API基本URL存在并有效
            base_url = self.model_params.get("base_url", "http://localhost:8000")
            if not base_url:
                base_url = "http://localhost:8000"  # 如果未设置，使用默认值
            
            # 构建完整URL
            url = f"{base_url}/v1/chat/completions"
            logger.info(f"准备调用API: url={url}, model={self.model_params.get('model_name')}")
            
            # API请求数据
            data = {
                "model": self.model_params.get("model_name", "gpt-3.5-turbo"),
                "messages": messages,
                "temperature": self.model_params.get("temperature", 0.7),
                "max_tokens": self.model_params.get("max_tokens", 2000)
            }
            
            # 添加API密钥头(如果有)
            headers = {"Content-Type": "application/json"}
            api_key = self.model_params.get("api_key")
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
                logger.info("使用API密钥进行请求")
            
            # 发送请求
            logger.info(f"发送API请求: messages_count={len(messages)}")
            start_time = time.time()
            response = requests.post(
                url,
                json=data,
                headers=headers
            )
            end_time = time.time()
            logger.info(f"API响应时间: {end_time - start_time:.2f}秒, 状态码: {response.status_code}")
            
            # 解析响应
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"API响应成功: content_length={len(content)}")
                return result
            else:
                error_text = response.text
                logger.error(f"API请求失败: 状态码={response.status_code}, 错误={error_text[:200]}")
                raise Exception(f"API请求失败: {response.status_code} {error_text[:200]}")
        except Exception as e:
            logger.error(f"API调用发生异常: {str(e)}", exc_info=True)
            raise
    
    async def _call_api_stream(self, messages: List[Dict[str, str]]):
        """流式调用API"""
        # 确保API基本URL存在并有效
        base_url = self.model_params.get("base_url", "http://localhost:8000")
        if not base_url:
            base_url = "http://localhost:8000"  # 如果未设置，使用默认值
        
        # 构建完整URL
        url = f"{base_url}/v1/chat/completions"
        logger.info(f"准备流式调用API: url={url}")
        
        # 添加API密钥头(如果有)
        headers = {"Content-Type": "application/json"}
        api_key = self.model_params.get("api_key")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            logger.info("使用API密钥进行请求")
        
        data = {
            "model": self.model_params.get("model_name", "gpt-3.5-turbo"),
            "messages": messages,
            "temperature": self.model_params.get("temperature", 0.7),
            "max_tokens": self.model_params.get("max_tokens", 1000),
            "stream": True
        }
        
        # 发送请求
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=headers,
                json=data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"流式API请求失败: 状态码={response.status}, 错误={error_text[:200]}")
                    raise Exception(f"API调用失败: {response.status} {error_text}")
                
                # 处理流式响应
                buffer = ""
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: ') and line != 'data: [DONE]':
                        try:
                            data = json.loads(line[6:])
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    content = delta['content']
                                    buffer += content
                                    yield {"text": content}
                        except json.JSONDecodeError as e:
                            logger.error(f"解析流式响应JSON失败: {e}, line: {line[:100]}")
    
    def speak(self, meeting_topic: str, meeting_mode: str, 
              current_context: str, mode_specific_prompt: str = "") -> str:
        """智能体发言"""
        try:
            # 构建提示信息
            prompt = f"""
会议主题: {meeting_topic}
会议模式: {meeting_mode}
当前讨论上下文: 
{current_context}

{mode_specific_prompt}

请根据你的角色、个性和技能，对当前讨论发表看法:
"""
            
            # 构建消息列表，直接使用OpenAI格式的消息
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # 确保conversation_history已初始化
            if not hasattr(self, 'conversation_history') or self.conversation_history is None:
                self.conversation_history = []
                
            # 添加会话历史记录 - 转换为API格式
            for message in self.conversation_history:
                if hasattr(message, 'type') and message.type == 'human':
                    messages.append({"role": "user", "content": message.content})
                elif hasattr(message, 'type') and message.type == 'ai':
                    messages.append({"role": "assistant", "content": message.content})
            
            # 添加当前请求
            messages.append({"role": "user", "content": prompt})
            
            # 使用直接API调用
            response_content = self._call_api_directly(messages)
            
            # 如果使用LangChain类，则更新会话历史
            if self.llm is not None:
                from langchain.schema import HumanMessage, AIMessage
                self.conversation_history.append(HumanMessage(content=prompt))
                self.conversation_history.append(AIMessage(content=response_content))
            
            # 返回响应内容
            return response_content
        except Exception as e:
            error_message = f"智能体发言时出错: {str(e)}"
            logger.error(f"{self.name} 发言失败: {error_message}")
            logger.error(traceback.format_exc())  # 记录完整堆栈跟踪
            print(f"错误: {error_message}")  # 打印到控制台便于调试
            return f"[出错] {self.name} 尝试回应，但遇到了技术问题。错误消息: {str(e)}"
    
    def _call_api_directly(self, messages: List[Dict[str, str]]) -> str:
        """直接调用模型API，避免使用LangChain的消息格式转换"""
        try:
            # 确保API基本URL存在并有效
            base_url = self.base_url or self.model_params.get("base_url", "http://localhost:8000")
            if not base_url:
                base_url = "http://localhost:8000"  # 如果未设置，使用默认值
            
            # 检查base_url是否已经包含了api路径
            if not base_url.endswith("/v1/chat/completions") and not base_url.endswith("/chat/completions"):
                # 根据模型名称决定使用哪个API端点
                model_name = self.model_params.get("model_name", "").lower()
                if "deepseek" in model_name:
                    url = f"{base_url}/chat/completions"  # DeepSeek API路径
                else:
                    url = f"{base_url}/v1/chat/completions"  # 标准OpenAI格式路径
            else:
                url = base_url
            
            logger.info(f"直接调用API: url={url}, model={self.model_params.get('model_name')}")
            
            # API请求数据
            data = {
                "model": self.model_params.get("model_name", "gpt-3.5-turbo"),
                "messages": messages,
                "temperature": self.model_params.get("temperature", 0.7),
                "max_tokens": self.model_params.get("max_tokens", 2000)
            }
            
            # 添加API密钥头(如果有)
            headers = {"Content-Type": "application/json"}
            api_key = self.api_key or self.model_params.get("api_key")
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
                logger.info("使用API密钥进行请求")
            
            # 发送请求
            logger.info(f"发送直接API请求: messages_count={len(messages)}")
            start_time = time.time()
            response = requests.post(
                url,
                json=data,
                headers=headers
            )
            end_time = time.time()
            logger.info(f"API响应时间: {end_time - start_time:.2f}秒, 状态码: {response.status_code}")
            
            # 解析响应
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"API响应成功: content_length={len(content)}")
                return content
            else:
                error_text = response.text
                logger.error(f"API请求失败: 状态码={response.status_code}, 错误={error_text[:200]}")
                raise Exception(f"API请求失败: {response.status_code} {error_text[:200]}")
        except Exception as e:
            logger.error(f"直接API调用发生异常: {str(e)}", exc_info=True)
            raise
    
    def _get_fallback_model(self):
        """获取备用模型，在主模型失败时使用"""
        current_model = self.model_params.get("model_name", "")
        
        # 模型备选顺序
        fallback_order = {
            # 对于Gemini模型
            "gemini-2.0-pro-exp-02-05": ["gemini-2.0-flash-exp"],
            "gemini-1.5-pro": ["gpt-3.5-turbo", "claude-3-haiku-20240307"],
            
            # 对于GPT模型
            "gpt-4-turbo": ["gpt-4", "gpt-3.5-turbo", "gemini-1.5-pro"],
            "gpt-4": ["gpt-3.5-turbo", "gemini-1.5-pro"],
            "gpt-3.5-turbo": ["gemini-1.5-pro", "claude-3-haiku-20240307"],
            
            # 其他模型默认回退到gpt-3.5-turbo
        }
        
        # 获取当前模型的备选列表
        fallbacks = fallback_order.get(current_model, ["gemini-2.0-flash-exp"])
        
        for fallback in fallbacks:
            if fallback != current_model:  # 不要选择同一个模型
                return fallback
                
        return "gpt-3.5-turbo"  # 最终备选
    
    def _invoke_with_smart_retry(self, messages):
        """带有智能重试机制的LLM调用方法"""
        # 如果llm未初始化，尝试初始化
        if self.llm is None:
            try:
                logger.info(f"{self.name} 尝试初始化LLM模型...")
                self.llm = ChatOpenAI(**self.model_params)
                logger.info(f"{self.name} 成功初始化LLM模型")
            except Exception as e:
                logger.error(f"{self.name} 初始化LLM模型失败: {str(e)}")
                raise ValueError(f"无法初始化LLM模型: {str(e)}")
        
        max_retries = 5  # 最大重试次数
        base_delay = 2  # 基础延迟（秒）
        max_delay = 60  # 最大延迟（秒）
        
        # 可重试的错误类型
        retryable_errors = [
            "RateLimitError",  # 速率限制
            "ServiceUnavailableError",  # 服务不可用
            "APITimeoutError",  # API超时
            "APIConnectionError",  # 连接错误
            "RESOURCE_EXHAUSTED"  # 资源耗尽（通常在错误消息中）
        ]
        
        attempt = 0
        last_error = None
        
        while attempt <= max_retries:
            try:
                # 如果这是重试，考虑切换到备用模型
                if attempt > 2:  # 在尝试2次主模型后，尝试备用模型
                    # 保存旧模型参数
                    original_model = self.model_params.get("model_name")
                    
                    # 切换到备用模型
                    fallback_model = self._get_fallback_model()
                    logger.info(f"{self.name} 切换到备用模型 {fallback_model}（原模型: {original_model}）")
                    
                    # 更新模型参数
                    self.model_params["model_name"] = fallback_model
                    
                    # 重新创建LLM实例
                    self.llm = ChatOpenAI(**self.model_params)
                    logger.info(f"{self.name} 正在使用备用模型 {fallback_model} 进行第 {attempt} 次重试...")
                elif attempt > 0:
                    logger.info(f"{self.name} 正在使用原始模型进行第 {attempt} 次重试...")
                
                return self.llm.invoke(messages)
                
            except Exception as e:
                last_error = e
                error_str = str(e)
                error_type = type(e).__name__
                
                # 决定是否应该重试这个错误
                should_retry = False
                for retry_error in retryable_errors:
                    if retry_error in error_type or retry_error in error_str:
                        should_retry = True
                        break
                
                if not should_retry:
                    logger.warning(f"{self.name} 遇到不可重试的错误: {error_str}")
                    raise  # 不可重试的错误，直接抛出
                
                attempt += 1
                
                if attempt > max_retries:
                    logger.error(f"{self.name} 达到最大重试次数 {max_retries}，放弃重试")
                    raise  # 重试次数用完，抛出最后的错误
                
                # 计算延迟时间（指数退避 + 抖动）
                delay = min(max_delay, base_delay * (2 ** (attempt - 1)))
                jitter = random.uniform(0, 0.1 * delay)  # 添加0-10%的随机抖动
                delay = delay + jitter
                
                logger.info(f"{self.name} 遇到可重试错误: {error_str}，将在 {delay:.2f} 秒后重试")
                
                # 如果是速率限制错误，尝试提取等待时间
                if "RateLimitError" in error_type:
                    # 有些API会在错误消息中提供建议的等待时间
                    try:
                        if "retry_after" in error_str.lower():
                            parts = error_str.split("retry_after:")
                            if len(parts) > 1:
                                retry_after = float(parts[1].strip().split()[0])
                                delay = max(delay, retry_after + jitter)
                                logger.info(f"从错误中提取到重试时间: {retry_after} 秒")
                    except:
                        pass  # 提取失败，使用计算出的延迟时间
                
                time.sleep(delay)
        
        # 这行代码理论上不会执行到，因为循环内部会在达到最大重试次数时抛出异常
        raise last_error
    
    def update_history(self, global_meeting_history: List[Dict[str, str]]):
        """更新全局会议历史到智能体的感知中"""
        # 将全局会议历史转换为智能体可理解的格式
        for entry in global_meeting_history:
            if entry["agent"] != self.name:  # 不是自己的发言才需要添加
                self.conversation_history.append(HumanMessage(
                    content=f"[{entry['agent']}]: {entry['content']}"
                )) 
    
    def generate_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """
        根据消息历史生成聊天响应
        
        参数:
            messages: 聊天消息历史列表，每个消息包含role和content
        
        返回:
            生成的响应文本
        """
        # 确保包含系统提示
        has_system_prompt = False
        for msg in messages:
            if msg.get("role") == "system":
                has_system_prompt = True
                break
        
        # 添加系统提示作为第一条消息
        if not has_system_prompt and self.system_prompt:
            messages = [{"role": "system", "content": self.system_prompt}] + messages
        
        try:
            # 调用API
            response = self._call_api_with_messages(messages)
            
            # 返回生成的响应
            return response
        except Exception as e:
            logger.error(f"生成聊天响应时出错: {str(e)}")
            return f"抱歉，我在处理您的请求时遇到了问题: {str(e)}"
    
    async def generate_chat_response_stream(self, messages: List[Dict[str, str]]):
        """
        流式生成聊天响应
        
        参数:
            messages: 聊天消息历史列表，每个消息包含role和content
            
        返回:
            生成的响应文本块的异步生成器
        """
        # 确保包含系统提示
        has_system_prompt = False
        for msg in messages:
            if msg.get("role") == "system":
                has_system_prompt = True
                break
        
        # 添加系统提示作为第一条消息
        if not has_system_prompt and self.system_prompt:
            messages = [{"role": "system", "content": self.system_prompt}] + messages
        
        try:
            # 调用流式API
            async for chunk in self._call_api_with_messages_stream(messages):
                yield chunk
        except Exception as e:
            logger.error(f"流式生成聊天响应时出错: {str(e)}")
            yield f"抱歉，我在处理您的请求时遇到了问题: {str(e)}"
    
    async def _call_api_with_messages_stream(self, messages: List[Dict[str, str]]):
        """调用API并获取流式响应"""
        model_name = self.model_params.get("model_name", "gpt-3.5-turbo")
        
        # 对于Gemini模型，使用GeminiClient处理
        if self.provider == "google":
            try:
                from app.clients.gemini_client import GeminiClient
                
                # 获取API密钥
                api_key = self.api_key
                if not api_key and "api_key" in self.model_params:
                    api_key = self.model_params["api_key"]
                
                if not api_key:
                    raise ValueError("使用Gemini API需要有效的API密钥")
                
                # 创建GeminiClient实例
                gemini_client = GeminiClient(api_key=api_key)
                
                # 转换消息格式为Gemini格式
                gemini_messages = []
                for msg in messages:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    gemini_messages.append({"role": role, "content": content})
                
                logger.info(f"使用GeminiClient处理请求: model={model_name}")
                
                # 调用GeminiClient的stream_chat方法
                async for content_type, content in gemini_client.stream_chat(
                    gemini_messages, 
                    model=model_name,
                    temperature=self.model_params.get("temperature", 0.7),
                    max_tokens=self.model_params.get("max_tokens", 10000)
                ):
                    if content_type == "answer":
                        yield content
                
                return
            except ImportError:
                logger.error("无法导入GeminiClient，尝试使用OpenAI兼容接口")
            except Exception as e:
                logger.error(f"使用GeminiClient时出错: {str(e)}", exc_info=True)
                yield f"\n\n[Gemini API错误: {str(e)}]"
                return
        
        # 对于非Gemini模型，使用OpenAI兼容接口（原有代码）
        # 确保API基本URL存在并有效
        base_url = self.base_url
        if not base_url:
            # 尝试从model_params中获取
            base_url = self.model_params.get("base_url", "http://localhost:8000")
            # 如果仍然为空，使用默认值
            if not base_url:
                base_url = "http://localhost:8000"
                logger.warning(f"未设置API基础URL，使用默认值: {base_url}")
        
        # 修复：确保base_url不包含重复的路径
        # 如果base_url已经包含了/v1/chat/completions，则不再添加
        api_endpoint = "/v1/chat/completions"
        if base_url.endswith(api_endpoint):
            full_url = base_url
        else:
            full_url = f"{base_url}{api_endpoint}"
        
        logger.info(f"流式API调用: url={full_url}, model={model_name}")
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # 添加API密钥头(如果有)
        api_key = self.api_key
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        elif "api_key" in self.model_params:
            headers["Authorization"] = f"Bearer {self.model_params['api_key']}"
        
        # 构建请求体
        payload = {
            "model": model_name,
            "messages": messages,
            "stream": True,
            "temperature": self.model_params.get("temperature", 0.7),
            "max_tokens": self.model_params.get("max_tokens", 1000),
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(full_url, 
                                        headers=headers, 
                                        json=payload) as response:
                    # 检查响应
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"API调用失败: {response.status} - {error_text}")
                    
                    # 处理流式响应
                    buffer = ""
                    async for line in response.content:
                        line = line.decode('utf-8')
                        
                        # 如果是空行，跳过
                        if not line.strip():
                            continue
                        
                        # 处理数据行
                        if line.startswith("data: "):
                            data = line[6:].strip()
                            
                            # 处理特殊的[DONE]标记
                            if data == "[DONE]":
                                break
                            
                            try:
                                json_data = json.loads(data)
                                choices = json_data.get("choices", [])
                                
                                if choices and len(choices) > 0:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"流式API调用出错: {str(e)}", exc_info=True)
            yield f"\n\n[错误: {str(e)}]" 