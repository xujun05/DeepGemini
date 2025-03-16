from typing import List, Dict, Any
from app.meeting.meeting_modes.base_mode import BaseMeetingMode
from app.meeting.utils.summary_generator import SummaryGenerator

class DebateMode(BaseMeetingMode):
    """对抗辩论会议模式"""
    
    def __init__(self, max_rounds: int = 3):
        super().__init__(
            name="对抗辩论",
            description="设定正反方，就议题进行辩论，旨在深入分析问题的不同方面。",
            max_rounds=max_rounds  # 使用传入的最大轮数
        )
            
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """根据轮次获取对抗辩论模式下的提示"""
        # 使用agent_name的索引位置来确定正反方
        # 这将确保大约一半的角色在每一方
        is_pro = len(agent_name) % 2 == 0  # 简单地使用名字长度的奇偶性
        side = "正方" if is_pro else "反方"

        print(f"max_rounds: {self.max_rounds}")
        
        if current_round == 1:
            return f"""你正在参与一个关于"{meeting_topic}"的对抗辩论会议。
你被分配到{side}。作为{agent_role}，请从{side}立场出发，就"{meeting_topic}"提出你的论点和理由。
请提供3-5个有力的论据支持你的立场。"""
        
        elif current_round != 1 and current_round != self.max_rounds:
            return f"""这是对抗辩论的中间轮。
继续作为{side}，请针对对方的论点进行反驳，并进一步强化自己的立场。
找出对方论点中的漏洞或不足，同时补充新的支持论据。"""
        
        elif current_round == self.max_rounds:
            return f"""这是对抗辩论的最后阶段。
作为{side}，请总结你的立场和核心论点，驳斥对方主要观点，并给出最终的论述。
尝试说服听众接受你的立场，展示为什么你的立场更合理、更有说服力。"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """对抗辩论模式下的发言顺序，正反方交替发言"""
        # 使用与get_agent_prompt相同的哈希逻辑来区分正反方
        # 这样可以确保两个方法之间的一致性
        
        # 将智能体分为正反方
        pro_agents = []
        con_agents = []
        
        # 先根据哈希值分配
        for agent in agents:
            agent_name = agent["name"]
            agent_role = agent.get("role", "")
            
            # 使用与get_agent_prompt相同的逻辑
            agent_hash = hash(agent_name + agent_role)
            is_pro = agent_hash % 2 == 0
            
            if is_pro:
                pro_agents.append(agent_name)
            else:
                con_agents.append(agent_name)
        
        # 检查平衡性：确保两方都至少有一个角色
        if not pro_agents and con_agents:
            # 如果正方没有角色，但反方有，则将一半反方角色移到正方
            mid = len(con_agents) // 2
            pro_agents = con_agents[:mid]
            con_agents = con_agents[mid:]
        elif not con_agents and pro_agents:
            # 如果反方没有角色，但正方有，则将一半正方角色移到反方
            mid = len(pro_agents) // 2
            con_agents = pro_agents[:mid]
            pro_agents = pro_agents[mid:]
        
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
        """
        判断会议是否应该结束
        注意：应该根据会议实例中设置的max_rounds决定，而不是模式自身的max_rounds
        """
        # 这里不直接使用self.max_rounds，因为会议可能设置了不同的最大轮数
        # 我们依赖Meeting类中的条件检查: `if self.current_round > self.max_rounds`
        return False  # 始终返回False，让Meeting类来决定何时结束会议
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总对抗辩论的结果"""
        # 使用统一的总结生成方法
        return SummaryGenerator.generate_summary(
            meeting_topic=meeting_topic,
            meeting_history=meeting_history,
            prompt_template=self.get_summary_prompt_template()
        )

    def get_summary_prompt_template(self) -> str:
        """获取总结提示模板"""
        return """
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