from typing import List, Dict, Any
import random

from app.meeting.meeting_modes.base_mode import BaseMeetingMode
from app.meeting.utils.summary_generator import SummaryGenerator

class DiscussionMode(BaseMeetingMode):
    """普通讨论模式"""
    
    def __init__(self):
        super().__init__(
            name="discussion",
            description="普通讨论模式，参与者轮流发言，共同讨论主题"
        )
        self.summary_generator = SummaryGenerator()
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """获取智能体提示"""
        if current_round == 1:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的讨论。
这是第一轮讨论，请分享你对这个主题的初步看法和观点。
请考虑你的专业背景和角色，提供有价值的见解。
"""
        else:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的讨论。
这是第{current_round}轮讨论。
请根据之前的讨论内容，进一步发展你的观点，或回应其他参与者的意见。
你可以提出新的见解，也可以对之前的观点进行补充或质疑。
"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """确定发言顺序"""
        # 简单地按照提供的顺序发言
        agent_names = [agent["name"] for agent in agents]
        
        # 第一轮按顺序，后续轮次随机打乱顺序
        if current_round > 1:
            random.shuffle(agent_names)
            
        return agent_names
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """判断会议是否应该结束"""
        # 当完成的轮数达到最大轮数时结束
        return rounds_completed >= self.max_rounds
    
    def summarize_meeting(self, topic: str, meeting_history: List[Dict[str, str]]) -> str:
        """
        生成会议总结
        
        参数:
            topic: 会议主题
            meeting_history: 会议历史记录
        
        返回:
            str: 会议总结
        """
        # 计算讨论轮数
        agent_messages = [msg for msg in meeting_history if msg["agent"] != "system"]
        agents = set([msg["agent"] for msg in agent_messages if msg["agent"] != "system"])
        message_per_agent = len(agent_messages) / max(len(agents), 1)
        estimated_rounds = max(1, int(message_per_agent))
        
        # 构建摘要提示模板
        prompt_template = f"""
请对以下关于"{{topic}}"的讨论进行总结。
讨论内容如下:

{{history}}

请提供一个全面的总结，包括:
1. 讨论的主要观点
2. 各方达成的共识（如果有）
3. 存在的分歧（如果有）
4. 讨论得出的结论或行动步骤（如果有）

这个总结是基于{len(meeting_history)}条消息生成的，涵盖了{estimated_rounds}轮讨论。
"""
        
        # 使用LLM生成总结 - 直接传递正确的参数
        return self.summary_generator.generate_summary(meeting_topic=topic, meeting_history=meeting_history, prompt_template=prompt_template)

    def _format_history_for_summary(self, meeting_history: List[Dict[str, str]]) -> str:
        """
        将会议历史记录格式化为适合总结的文本格式
        
        参数:
            meeting_history: 会议历史记录列表
            
        返回:
            str: 格式化后的会议历史文本
        """
        formatted_text = ""
        for entry in meeting_history:
            if entry["agent"] != "system":  # 排除系统消息
                formatted_text += f"[{entry['agent']}]: {entry['content']}\n\n"
        
        return formatted_text