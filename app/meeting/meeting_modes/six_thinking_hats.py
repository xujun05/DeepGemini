from typing import List, Dict, Any
from .base_mode import BaseMeetingMode
from app.meeting.utils.summary_generator import SummaryGenerator

class SixThinkingHatsMode(BaseMeetingMode):
    """六顶思考帽会议模式"""
    
    def __init__(self, max_rounds: int = 6):
        super().__init__(
            name="六顶思考帽",
            description="使用爱德华·德博诺的六顶思考帽方法，从六个不同角度思考问题。",
            max_rounds=6  # 为六顶思考帽模式设置默认6轮
        )
        self.max_rounds = max_rounds  # 六顶帽子对应六轮
        self.hats = [
            {"color": "白色", "focus": "事实和信息", "description": "关注客观事实和数据，不做判断和推测"},
            {"color": "红色", "focus": "感受和直觉", "description": "表达直觉、情感和感受，不需要解释理由"},
            {"color": "黑色", "focus": "谨慎和风险", "description": "指出潜在问题、风险和挑战，进行批判性思考"},
            {"color": "黄色", "focus": "积极和机会", "description": "关注积极面、价值和收益，寻找可能性"},
            {"color": "绿色", "focus": "创意和可能性", "description": "提出新想法、创新方案和替代选择"},
            {"color": "蓝色", "focus": "思考的整合", "description": "管理和总结思考过程，进行元认知"}
        ]
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """根据轮次获取六顶思考帽模式下的提示"""
        # 确保轮次在有效范围内
        if current_round < 1 or current_round > len(self.hats):
            current_round = 1
        
        # 获取当前思考帽
        current_hat = self.hats[current_round - 1]
        
        return f"""你正在参与一个关于"{meeting_topic}"的六顶思考帽会议。
当前我们正在使用{current_hat["color"]}思考帽，专注于{current_hat["focus"]}。
{current_hat["color"]}思考帽的特点是：{current_hat["description"]}。

作为{agent_role}，请在{current_hat["color"]}思考帽的框架下，对"{meeting_topic}"发表你的见解。
请完全遵循当前思考帽的思维方式，不要混入其他思考帽的视角。

具体而言：
- 白帽：请提供客观事实、数据和信息，不加入个人观点和判断
- 红帽：表达你的情感反应、直觉和感受，不需要逻辑支持
- 黑帽：指出方案中的风险、问题和挑战，进行严谨的批判性思考
- 黄帽：探索积极方面、价值和好处，保持乐观和建设性
- 绿帽：提出新的创意、可能性和替代方案，打破常规思维
- 蓝帽：梳理讨论脉络，总结前面的思考，提出下一步行动

请提出至少3-5点符合当前思考帽特点的观点。"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """六顶思考帽模式下的发言顺序，按照列表顺序轮流发言"""
        return [agent["name"] for agent in agents]
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """当完成预设的轮数后结束会议"""
        return rounds_completed >= self.max_rounds
    
    def summarize_meeting(self, meeting_topic: str, 
                         meeting_history: List[Dict[str, Any]]) -> str:
        """汇总六顶思考帽会议的结果"""
        # 使用统一的总结生成方法
        return SummaryGenerator.generate_summary(
            meeting_topic=meeting_topic,
            meeting_history=meeting_history,
            prompt_template=self.get_summary_prompt_template()
        )
    
    def get_summary_prompt_template(self) -> str:
        """获取六顶思考帽的总结提示模板"""
        return """
你是一个思维方法专家。请对以下关于"{meeting_topic}"的六顶思考帽会议进行总结。
会议按照六顶思考帽的方法进行了讨论：白帽(事实)、红帽(情感)、黑帽(风险)、黄帽(积极)、绿帽(创意)和蓝帽(整合)。

会议记录如下:

{history_text}

请提供以下内容:
1. 每个思考帽下的关键见解概括（每个帽子3-5点）
2. 综合所有思考角度后对议题的全面理解
3. 根据六帽思考得出的主要行动建议（至少3-5条）
4. 思考过程中发现的关键矛盾或需要进一步探讨的问题

请以结构化的方式呈现总结，确保每个思考帽的视角都得到充分体现，并提供整合性的结论。
""" 