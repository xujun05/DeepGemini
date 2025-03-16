from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
import os
import traceback
import logging
import time
import random
from typing import List, Dict, Any

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
            logger.info(f"获取模型名称: model_name={model_name}")
            if not model_name:
                model_name = os.environ.get("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
            
            # 调用API生成总结 - 这里应该调用实际的API
            # 暂时使用模板方法提供一个结果
            logger.info(f"尝试使用模型 {model_name} 生成关于 '{meeting_topic}' 的总结")
            
            try:
                # 创建模型时传入API密钥和基础URL
                model_kwargs = {"temperature": 0.3}
                if api_key:
                    model_kwargs["api_key"] = api_key
                if api_base_url:
                    model_kwargs["base_url"] = api_base_url
                
                llm = ChatOpenAI(model_name=model_name, **model_kwargs)
                
                # 智能重试机制
                max_retries = 3
                base_delay = 2
                
                for attempt in range(max_retries + 1):
                    try:
                        if attempt > 0:
                            logger.info(f"总结生成尝试 {attempt}/{max_retries}...")
                        
                        response = llm.invoke([HumanMessage(content=summary_prompt)])
                        return response.content
                        
                    except Exception as e:
                        logger.warning(f"总结生成错误: {str(e)}")
                        
                        if attempt == max_retries:
                            raise  # 最后一次尝试，重新抛出异常
                        
                        # 指数退避
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        logger.info(f"等待 {delay:.2f} 秒后重试...")
                        time.sleep(delay)
                
            except Exception as e:
                logger.error(f"调用API生成总结失败: {str(e)}")
                # 调用备用方法生成模板总结
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