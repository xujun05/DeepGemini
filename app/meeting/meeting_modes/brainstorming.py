from typing import List, Dict, Any
import random

from app.meeting.meeting_modes.base_mode import BaseMeetingMode
from app.meeting.utils.summary_generator import SummaryGenerator
    
class BrainstormingMode(BaseMeetingMode):
    """头脑风暴模式"""
    
    def __init__(self):
        super().__init__(
            name="brainstorming",
            description="头脑风暴模式，鼓励参与者提出创新想法，不进行批评"
        )
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """获取智能体提示"""
        if current_round == 1:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的头脑风暴会议。
这是第一轮讨论，请尽可能提出创新的、有创意的想法。
记住头脑风暴的规则：
1. 数量胜于质量，尽可能提出多的想法
2. 不要批评或评判其他人的想法
3. 欢迎奇怪或不寻常的想法
4. 可以结合和改进已有的想法

请根据你的专业背景和角色，提供至少3个相关的创意或解决方案。
"""
        elif current_round != 1 and current_round != self.max_rounds:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的头脑风暴会议。
这是讨论的中间阶段，请根据之前的讨论内容，进一步发展想法，或提出全新的创意。
"""
        else:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的头脑风暴会议。
这是最后一轮讨论。
请根据之前的讨论内容，总结出你认为最有潜力的想法。
"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """确定发言顺序"""
        # 每轮随机打乱顺序
        agent_names = [agent["name"] for agent in agents]
        random.shuffle(agent_names)
        return agent_names
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """判断会议是否应该结束"""
        # 当完成的轮数达到最大轮数时结束
        return rounds_completed >= self.max_rounds
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总会议结果"""
        # 使用统一的总结生成方法
        return SummaryGenerator.generate_summary(
            meeting_topic=meeting_topic,
            meeting_history=meeting_history,
            prompt_template=self.get_summary_prompt_template()
        )
    
    def get_summary_prompt_template(self) -> str:
        """获取总结提示模板"""
        return """
你是一个头脑风暴会议的总结专家。请对以下关于"{meeting_topic}"的头脑风暴会议进行总结。
会议记录如下:

{history_text}

请提供以下内容:
1. 产生的主要创意和想法概述
2. 最有潜力的想法
3. 特别独特或创新的视角
4. 可能的下一步行动
5. 需要进一步探索的领域

请以清晰、结构化的方式呈现总结，重点突出最有价值的创意。
""" 