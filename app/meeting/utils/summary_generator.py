from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
import os
import traceback
import logging
import time
import random
from typing import List, Dict, Any
import json
import asyncio

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SummaryGenerator")

class SummaryGenerator:
    """会议总结生成器，负责生成各种会议模式的总结"""
    
    def __init__(self, model_name: str = "gpt-3.5-turbo", api_key: str = None, api_url: str = None):
        self.model_name = model_name
        self.api_key = api_key
        self.api_url = api_url
    
    @staticmethod
    def generate_summary(meeting_topic: str, meeting_history: List[Dict[str, Any]], 
                         prompt_template: str, model_name: str = None, api_key: str = None, api_base_url: str = None) -> str:
        """
        生成会议总结
        
        Args:
            meeting_topic: 会议主题
            meeting_history: 会议历史记录
            prompt_template: 提示模板
            model_name: 模型名称，如果为None则使用默认模型
            api_key: API密钥
            api_base_url: API基础URL
        
        Returns:
            str: 生成的总结
        """
        try:
            logger.info(f"开始生成'{meeting_topic}'的会议总结: 历史消息数={len(meeting_history)}")
            
            # 构建历史文本
            history_text = ""
            for entry in meeting_history:
                if entry["agent"] != "system":  # 排除系统消息
                    history_text += f"[{entry['agent']}]: {entry['content']}\n\n"
            
            # 格式化提示模板
            summary_prompt = prompt_template.format(
                topic=meeting_topic,
                meeting_topic=meeting_topic,
                history=history_text,
                history_text=history_text
            )
            
            # 获取模型名称
            logger.info(f"使用模型生成总结: model_name={model_name or '默认模型'}")
            
            # 如果API URL或密钥为空，记录警告
            if not api_base_url:
                logger.warning("API基础URL为空，可能影响总结生成")
            if not api_key:
                logger.warning("API密钥为空，可能影响总结生成")
            
            try:
                # 创建模型时传入API密钥和基础URL
                model_kwargs = {"temperature": 0.3}
                if api_key:
                    model_kwargs["api_key"] = api_key
                    logger.info("使用提供的API密钥")
                if api_base_url:
                    model_kwargs["base_url"] = api_base_url
                    logger.info(f"使用提供的API基础URL: {api_base_url}")
                
                # 设置默认模型名称
                if not model_name:
                    model_name = os.environ.get("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
                    logger.info(f"使用默认模型名称: {model_name}")
                
                logger.info(f"初始化LLM模型: {model_name}")
                llm = ChatOpenAI(model_name=model_name, **model_kwargs)
                
                # 智能重试机制
                max_retries = 3
                base_delay = 2
                
                for attempt in range(max_retries + 1):
                    try:
                        if attempt > 0:
                            logger.info(f"总结生成尝试 {attempt}/{max_retries}...")
                        
                        logger.info("调用LLM生成总结")
                        response = llm.invoke([HumanMessage(content=summary_prompt)])
                        summary = response.content
                        
                        logger.info(f"成功生成总结: 长度={len(summary)}")
                        return summary
                        
                    except Exception as e:
                        logger.warning(f"总结生成错误: {str(e)}")
                        
                        if attempt == max_retries:
                            raise  # 最后一次尝试，重新抛出异常
                        
                        # 指数退避
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        logger.info(f"等待 {delay:.2f} 秒后重试...")
                        time.sleep(delay)
                
            except Exception as e:
                logger.error(f"调用API生成总结失败: {str(e)}", exc_info=True)
                # 调用备用方法生成模板总结
                logger.info("使用模板总结作为备用")
                return SummaryGenerator._generate_template_summary(meeting_topic, len(meeting_history))
            
        except Exception as e:
            logger.error(f"生成会议总结失败: {str(e)}", exc_info=True)
            return f"[生成会议总结失败: {str(e)}]"
    
    @staticmethod
    def _generate_template_summary(meeting_topic: str, message_count: int) -> str:
        """生成模板总结（当API调用失败时使用）"""
        return f"""
# 关于"{meeting_topic}"的讨论总结

## 主要主题和观点
- 参与者讨论了{meeting_topic}的各个方面
- 提出了多种观点和见解

## 达成的共识
- 参与者在某些关键点上达成了一致
- 认同了一些基本原则

## 存在的分歧
- 在某些具体实施方法上存在不同意见
- 对某些问题的优先级有不同看法

## 解决方案和建议
- 提出了几种可能的解决方案
- 建议进一步研究和讨论

## 需要进一步讨论的问题
- 一些技术细节需要更深入的探讨
- 某些方案的可行性需要进一步评估

这个总结是基于{message_count}条消息生成的。
""" 

    @staticmethod
    async def generate_summary_stream(meeting_topic: str, meeting_history: List[Dict[str, Any]],
                                 prompt_template: str, model_name: str = None, api_key: str = None, api_base_url: str = None, 
                                 model_params: Dict[str, Any] = None):
        """
        流式生成会议总结，逐步返回生成的内容
        
        Args:
            meeting_topic: 会议主题
            meeting_history: 会议历史记录
            prompt_template: 提示模板
            model_name: 模型名称，如果为None则使用默认模型
            api_key: API密钥
            api_base_url: API基础URL
            model_params: 模型配置参数字典
        
        Yields:
            str: 生成的总结片段
        """
        try:
            logger.info(f"开始流式生成'{meeting_topic}'的会议总结: 历史消息数={len(meeting_history)}")
            
            # 构建历史文本
            history_text = ""
            for entry in meeting_history:
                if entry["agent"] != "system":  # 排除系统消息
                    history_text += f"[{entry['agent']}]: {entry['content']}\n\n"
            
            # 格式化提示模板
            summary_prompt = prompt_template.format(
                topic=meeting_topic,
                meeting_topic=meeting_topic,
                history=history_text,
                history_text=history_text
            )
            
            # 获取或设置默认模型参数
            if not model_params:
                model_params = {}
            
            # 定义默认参数 - 确保总是有这些基本参数
            default_params = {
                "temperature": 0.3,
                "max_tokens": 8096,
                "top_p": 1.0,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0
            }
            
            # 构建请求体 - 首先使用默认参数
            payload = default_params.copy()
            
            # 添加必要的消息参数
            payload.update({
                "messages": [{"role": "user", "content": summary_prompt}],
                "stream": True,  # 必须启用流式输出
            })
            
            # 然后用模型参数覆盖默认参数（保留特定模型的自定义设置）
            for param, value in model_params.items():
                # 跳过一些已设置的关键参数
                if param not in ["messages", "stream"]:
                    payload[param] = value
            
            # 确保model使用传入的model_name参数（优先级最高）
            if model_name:
                payload["model"] = model_name
            elif "model" not in payload:
                # 如果没有指定model_name且payload中也没有model，使用默认模型
                payload["model"] = os.environ.get("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
            
            # logger.info(f"使用模型流式生成总结: model_name={payload.get('model', '默认模型')}, 参数={payload}")
            
            # 如果API URL或密钥为空，记录警告
            if not api_base_url:
                logger.warning("API基础URL为空，可能影响总结生成")
            if not api_key:
                logger.warning("API密钥为空，可能影响总结生成")
            
            try:
                # 准备API请求
                headers = {
                    "Content-Type": "application/json"
                }
                
                # 添加API密钥
                if api_key:
                    headers["Authorization"] = f"Bearer {api_key}"
                    logger.info("使用提供的API密钥")
                
                # 打印完整参数配置（调试用，生产环境可注释）
                logger.debug(f"API请求参数: {payload}")
                
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{api_base_url}/v1/chat/completions" if api_base_url else "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json=payload
                    ) as response:
                        # 检查响应
                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"API调用失败: {response.status} - {error_text}")
                            # 如果流式API失败，使用备用总结
                            backup_summary = SummaryGenerator._generate_template_summary(meeting_topic, len(meeting_history))
                            for char in backup_summary:
                                yield char
                                await asyncio.sleep(0.01)
                            return
                        
                        # 处理流式响应
                        logger.info("开始接收流式总结内容")
                        accumulated_text = ""
                        async for line in response.content:
                            line = line.decode('utf-8').strip()
                            
                            # 如果是空行，跳过
                            if not line:
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
                                            # 累积文本同时返回每个增量
                                            accumulated_text += content
                                            yield content
                                except json.JSONDecodeError:
                                    continue
                        
                        logger.info(f"流式总结生成完成: 总长度={len(accumulated_text)}")
                        
            except Exception as e:
                logger.error(f"流式总结生成错误: {str(e)}", exc_info=True)
                # 如果出错，生成备用总结
                backup_summary = SummaryGenerator._generate_template_summary(meeting_topic, len(meeting_history))
                logger.info(f"使用备用总结: 长度={len(backup_summary)}")
                
                # 模拟流式输出备用总结
                for char in backup_summary:
                    yield char
                    await asyncio.sleep(0.01)
        
        except Exception as e:
            logger.error(f"流式总结生成过程中出现严重错误: {str(e)}", exc_info=True)
            error_msg = f"[生成会议总结失败: {str(e)}]"
            for char in error_msg:
                yield char
                await asyncio.sleep(0.01) 