from typing import List, Dict, Any
from .base_mode import BaseMeetingMode
from app.meeting.utils.summary_generator import SummaryGenerator

class SWOTAnalysisMode(BaseMeetingMode):
    """SWOT分析会议模式"""
    
    def __init__(self, max_rounds: int = 4):
        super().__init__(
            name="SWOT分析",
            description="对主题进行优势(Strengths)、劣势(Weaknesses)、机会(Opportunities)和威胁(Threats)的系统性分析。",
            max_rounds=max_rounds  # 为SWOT分析设置默认4轮
        )
        self.swot_aspects = ["优势(Strengths)", "劣势(Weaknesses)", 
                           "机会(Opportunities)", "威胁(Threats)"]
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """根据轮次获取SWOT分析模式下的提示"""
        # 确保轮次在有效范围内
        if current_round < 1 or current_round > len(self.swot_aspects):
            current_round = 1
        
        # 获取当前讨论的SWOT方面
        current_aspect = self.swot_aspects[current_round - 1]
        
        return f"""你正在参与一个关于"{meeting_topic}"的SWOT分析会议。
当前我们正在讨论SWOT分析的"{current_aspect}"方面。

作为{agent_role}，请从你的专业视角出发，针对主题"{meeting_topic}"的{current_aspect}，提出你的分析和见解。
请尽量具体、深入，并考虑到你独特角色和技能可能带来的特殊洞察。

如果是"优势"，请关注内部积极因素；
如果是"劣势"，请关注内部消极因素；
如果是"机会"，请关注外部积极因素；
如果是"威胁"，请关注外部消极因素。

请提出至少3-5点相关的分析。"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """SWOT分析模式下的发言顺序，按照列表顺序轮流发言"""
        return [agent["name"] for agent in agents]
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """当完成预设的轮数后结束会议"""
        return rounds_completed >= self.max_rounds
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总SWOT分析会议的结果"""
        # 使用统一的总结生成方法
        return SummaryGenerator.generate_summary(
            meeting_topic=meeting_topic,
            meeting_history=meeting_history,
            prompt_template=self.get_summary_prompt_template()
        )
    
    def get_summary_prompt_template(self) -> str:
        """获取SWOT分析的总结提示模板"""
        return """
你是一个战略分析专家。请对以下关于"{meeting_topic}"的SWOT分析会议进行总结。
会议按照优势(Strengths)、劣势(Weaknesses)、机会(Opportunities)和威胁(Threats)四个方面进行了讨论。

会议记录如下:

{history_text}

请提供以下内容:
1. 每个SWOT方面的关键点概括（每个方面3-5点）
2. 这些因素之间可能的相互作用和影响
3. 基于SWOT分析的战略建议（至少3-5条）
4. 可能需要进一步探讨的领域或问题

请以表格或列表形式呈现SWOT矩阵，然后提供详细的战略分析和建议。
""" 