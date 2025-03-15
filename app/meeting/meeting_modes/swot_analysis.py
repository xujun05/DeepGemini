from typing import List, Dict, Any
from .base_mode import BaseMeetingMode
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

class SWOTAnalysisMode(BaseMeetingMode):
    """SWOT分析会议模式"""
    
    def __init__(self):
        super().__init__(
            name="SWOT分析",
            description="对主题进行优势(Strengths)、劣势(Weaknesses)、机会(Opportunities)和威胁(Threats)的系统性分析。"
        )
        self.max_rounds = 4  # 4轮分别对应SWOT四个方面
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
        # 使用LLM生成会议总结
        llm = ChatOpenAI(model_name="gemini-2.0-pro-exp-02-05", temperature=0.3)
        
        # 构建会议历史文本，按SWOT四个方面组织
        history_by_round = {}
        for entry in meeting_history:
            round_num = entry.get("round", 0)
            if round_num not in history_by_round:
                history_by_round[round_num] = []
            history_by_round[round_num].append(entry)
        
        # 构建SWOT结构化历史
        swot_history = ""
        for round_num in range(1, self.max_rounds + 1):
            if round_num in history_by_round:
                aspect_index = round_num - 1
                if aspect_index < len(self.swot_aspects):
                    swot_history += f"\n## {self.swot_aspects[aspect_index]}\n\n"
                    for entry in history_by_round[round_num]:
                        if entry["agent"] != "system":  # 排除系统消息
                            swot_history += f"[{entry['agent']}]: {entry['content']}\n\n"
        
        # 构建总结提示
        prompt = f"""
你是一个战略分析专家。请对以下关于"{meeting_topic}"的SWOT分析会议进行总结。
会议按照优势(Strengths)、劣势(Weaknesses)、机会(Opportunities)和威胁(Threats)四个方面进行了讨论。

会议记录如下:

{swot_history}

请提供以下内容:
1. 每个SWOT方面的关键点概括（每个方面3-5点）
2. 这些因素之间可能的相互作用和影响
3. 基于SWOT分析的战略建议（至少3-5条）
4. 可能需要进一步探讨的领域或问题

请以表格或列表形式呈现SWOT矩阵，然后提供详细的战略分析和建议。
"""
        
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content 