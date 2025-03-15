from typing import List, Dict, Any

class BaseMeetingMode:
    """会议模式基类"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.max_rounds = 3  # 默认最大轮数
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """获取智能体提示"""
        raise NotImplementedError("子类必须实现此方法")
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """确定发言顺序"""
        raise NotImplementedError("子类必须实现此方法")
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """判断会议是否应该结束"""
        raise NotImplementedError("子类必须实现此方法")
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总会议结果"""
        raise NotImplementedError("子类必须实现此方法")
    
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