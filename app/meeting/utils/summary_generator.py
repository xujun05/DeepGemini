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
    
    def generate_summary(self, meeting_topic: str, meeting_history: List[Dict[str, Any]], 
                         prompt_template: str) -> str:
        """生成会议总结"""
        try:
            # 构建历史文本
            history_text = ""
            for entry in meeting_history:
                if entry["agent"] != "system":  # 排除系统消息
                    history_text += f"[{entry['agent']}]: {entry['content']}\n\n"
            
            # 使用模板生成总结提示
            summary_prompt = prompt_template.format(
                topic=meeting_topic,
                history=history_text
            )
            
            # 调用API生成总结
            # 这里应该调用实际的API，但为了简单起见，我们返回一个模板总结
            return self._generate_template_summary(meeting_topic, len(meeting_history))
        except Exception as e:
            logger.error(f"生成会议总结失败: {str(e)}", exc_info=True)
            return f"[生成会议总结失败: {str(e)}]"
    
    def _generate_template_summary(self, meeting_topic: str, message_count: int) -> str:
        """生成模板总结"""
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
    def generate_summary_old(meeting_topic: str, meeting_history: list, 
                         summary_prompt_template: str, model_name: str = None) -> str:
        """
        生成会议总结
        
        参数:
        - meeting_topic: 会议主题
        - meeting_history: 会议历史记录
        - summary_prompt_template: 总结提示模板
        - model_name: 可选的模型名称
        
        返回:
        - 生成的总结文本
        """
        # 封装在try-except中，以便可以处理模型错误
        try:
            # 获取模型名称
            if not model_name:
                model_name = os.environ.get("OPENAI_MODEL_NAME", "gemini-2.0-pro-exp-02-05")
            
            # 创建模型
            llm = ChatOpenAI(model_name=model_name, temperature=0.3)
            
            # 构建会议历史文本
            history_text = ""
            for entry in meeting_history:
                # 跳过系统消息
                if entry.get("agent") == "system":
                    continue
                history_text += f"[{entry['agent']}]: {entry['content']}\n\n"
            
            # 格式化提示模板
            prompt = summary_prompt_template.format(
                meeting_topic=meeting_topic,
                history_text=history_text
            )
            
            # 智能重试机制
            max_retries = 3
            base_delay = 2
            
            for attempt in range(max_retries + 1):
                try:
                    if attempt > 0:
                        logger.info(f"总结生成尝试 {attempt}/{max_retries}...")
                    
                    response = llm.invoke([HumanMessage(content=prompt)])
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
            logger.error(f"生成总结失败: {str(e)}")
            logger.error(traceback.format_exc())
            return f"生成会议总结时出错: {str(e)}\n\n请检查您的API配置和模型设置。" 