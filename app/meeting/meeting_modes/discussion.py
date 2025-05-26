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
        elif current_round != 1 and current_round != self.max_rounds:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的讨论。
这是第{current_round}轮讨论，请根据之前的讨论内容，进一步发展你的观点，或回应其他参与者的意见。
你可以提出新的见解，也可以对之前的观点进行补充或质疑。
"""
        else:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的讨论。
这是讨论的最后一轮。
请根据之前的讨论内容，进一步总结你的观点，或回应其他参与者的意见。
"""
from typing import List, Dict, Any, Optional # Added Optional
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
        elif current_round != 1 and current_round != self.max_rounds:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的讨论。
这是第{current_round}轮讨论，请根据之前的讨论内容，进一步发展你的观点，或回应其他参与者的意见。
你可以提出新的见解，也可以对之前的观点进行补充或质疑。
"""
        else:
            return f"""你是{agent_name}，{agent_role}。
你正在参加一个关于"{meeting_topic}"的讨论。
这是讨论的最后一轮。
请根据之前的讨论内容，进一步总结你的观点，或回应其他参与者的意见。
"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                 current_round: int,
                                 suggested_next_speaker: Optional[str] = None) -> List[str]:
        """确定发言顺序"""
        agent_names = [agent["name"] for agent in agents]
        final_order = []

        # Determine base order (custom or default)
        base_order = []
        if self.custom_speaking_order:
            valid_custom_names = [name for name in self.custom_speaking_order if name in agent_names]
            # Add any agents not in custom_speaking_order to the end
            for name in agent_names:
                if name not in valid_custom_names:
                    valid_custom_names.append(name)
            base_order = valid_custom_names
        else:
            base_order = agent_names[:] # shallow copy

        if suggested_next_speaker and isinstance(suggested_next_speaker, str) and suggested_next_speaker in agent_names:
            final_order.append(suggested_next_speaker)
            for name in base_order:
                if name != suggested_next_speaker:
                    final_order.append(name)
        else:
            final_order = base_order
            
        return final_order
    
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
请参考以下关于"{{topic}}"的讨论内容:
{{history}}

作为一名会议总结专家，请提供以下内容:
1. 讨论的主要主题和观点概述（不超过3点）
2. 讨论中达成的主要共识（如果有）
3. 存在的主要分歧或不同视角（如果有）
4. 提出的解决方案或行动建议
5. 可能需要进一步讨论或研究的问题

请以清晰、结构化的方式呈现总结，重点突出最重要的内容。
"""
        
        # 使用统一的总结生成方法
        return SummaryGenerator.generate_summary(
            meeting_topic=topic, 
            meeting_history=meeting_history, 
            prompt_template=prompt_template
        )

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