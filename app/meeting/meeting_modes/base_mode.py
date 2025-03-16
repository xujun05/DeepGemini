from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.meeting.utils.summary_generator import SummaryGenerator

class BaseMeetingMode(ABC):
    """会议模式基类"""
    
    def __init__(self, name: str, description: str, max_rounds: int = 3):
        self.name = name
        self.description = description
        self.max_rounds = max_rounds  # 默认最大轮数，但允许在初始化时设置
    
    def set_max_rounds(self, max_rounds: int):
        """设置最大轮数"""
        if max_rounds > 0:
            self.max_rounds = max_rounds
            return True
        return False
    
    @abstractmethod
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                          meeting_topic: str, current_round: int) -> str:
        """获取智能体提示"""
        pass
    
    @abstractmethod
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """确定发言顺序"""
        pass
    
    @abstractmethod
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """
        判断会议是否应该结束
        基类实现始终返回False，让Meeting类负责基于max_rounds终止会议
        """
        # 让Meeting类基于self.max_rounds决定会议结束
        return False
    
    def get_summary_prompt_template(self) -> str:
        """获取总结提示模板"""
        return """
你是一个会议总结专家。请对以下关于"{meeting_topic}"的会议进行总结。
会议记录如下:

{history_text}

请提供以下内容:
1. 讨论的主要主题和观点概述
2. 讨论中达成的主要共识
3. 存在的主要分歧或不同视角
4. 提出的解决方案或行动建议
5. 可能需要进一步讨论或研究的问题

请以清晰、结构化的方式呈现总结。
"""
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总会议结果"""
        # 获取当前模式的总结提示模板
        prompt_template = self.get_summary_prompt_template()
        
        # 使用总结生成器生成总结
        return SummaryGenerator.generate_summary(
            meeting_topic=meeting_topic,
            meeting_history=meeting_history,
            summary_prompt_template=prompt_template
        ) 