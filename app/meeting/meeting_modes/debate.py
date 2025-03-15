from typing import List, Dict, Any
from .base_mode import BaseMeetingMode
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

class DebateMode(BaseMeetingMode):
    """对抗辩论会议模式"""
    
    def __init__(self):
        super().__init__(
            name="对抗辩论",
            description="设定正反方，就议题进行辩论，旨在深入分析问题的不同方面。"
        )
        self.max_rounds = 3  # 默认最大轮数
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """根据轮次获取对抗辩论模式下的提示"""
        # 简单地将智能体分为正反方（奇数位置的为正方，偶数位置的为反方）
        is_pro = hash(agent_name) % 2 == 0  # 使用名称的哈希值来确定正反方
        side = "正方" if is_pro else "反方"
        
        if current_round == 1:
            return f"""你正在参与一个关于"{meeting_topic}"的对抗辩论会议。
你被分配到{side}。作为{agent_role}，请从{side}立场出发，就"{meeting_topic}"提出你的论点和理由。
请提供3-5个有力的论据支持你的立场。"""
        
        elif current_round == 2:
            return f"""这是对抗辩论的第二轮。
继续作为{side}，请针对对方的论点进行反驳，并进一步强化自己的立场。
找出对方论点中的漏洞或不足，同时补充新的支持论据。"""
        
        else:
            return f"""这是对抗辩论的最后一轮。
作为{side}，请总结你的立场和核心论点，驳斥对方主要观点，并给出最终的论述。
尝试说服听众接受你的立场，展示为什么你的立场更合理、更有说服力。"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """对抗辩论模式下的发言顺序，正反方交替发言"""
        # 将智能体分为正反方
        pro_agents = [agent["name"] for agent in agents if hash(agent["name"]) % 2 == 0]
        con_agents = [agent["name"] for agent in agents if hash(agent["name"]) % 2 != 0]
        
        # 交替排列正反方发言
        speaking_order = []
        max_len = max(len(pro_agents), len(con_agents))
        for i in range(max_len):
            if i < len(pro_agents):
                speaking_order.append(pro_agents[i])
            if i < len(con_agents):
                speaking_order.append(con_agents[i])
        
        return speaking_order
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """当完成预设的轮数后结束会议"""
        return rounds_completed >= self.max_rounds
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总对抗辩论的结果"""
        # 使用LLM生成会议总结
        llm = ChatOpenAI(model_name="gemini-2.0-pro-exp-02-05", temperature=0.3)
        
        # 构建会议历史文本
        history_text = ""
        for entry in meeting_history:
            history_text += f"[{entry['agent']}]: {entry['content']}\n\n"
        
        # 构建总结提示
        prompt = f"""
你是一个辩论分析专家。请对以下关于"{meeting_topic}"的对抗辩论会议进行总结。
会议记录如下:

{history_text}

请提供以下内容:
1. 正方的主要论点和论据概述
2. 反方的主要论点和论据概述
3. 双方论点的对比分析
4. 各论点的强弱点评估
5. 辩论的关键洞见和启示

请保持中立，不要偏向任何一方，并以结构化的方式呈现总结。
"""
        
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content