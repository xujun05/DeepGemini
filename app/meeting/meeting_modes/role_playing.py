from typing import List, Dict, Any
from .base_mode import BaseMeetingMode
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
import os
import sys
import traceback

# 添加项目根目录到sys.path
sys.path.append("..")
try:
    from ui.app import GeminiAdapter
except ImportError:
    # 如果无法导入，创建一个简单的适配器
    class GeminiAdapter:
        @staticmethod
        def create_model(model_name=None, **kwargs):
            # 从环境变量中获取base_url
            base_url = os.environ.get("OPENAI_API_BASE")
            if not model_name:
                model_name = os.environ.get("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
            
            # 创建模型参数
            model_params = {**kwargs}
            if base_url:
                model_params["openai_api_base"] = base_url
            
            return ChatOpenAI(model_name=model_name, **model_params)

class RolePlayingMode(BaseMeetingMode):
    """角色扮演会议模式"""
    
    def __init__(self):
        super().__init__(
            name="角色扮演",
            description="每个智能体扮演特定的角色或利益相关者，从不同视角探讨问题。"
        )
        self.max_rounds = 3  # 默认最大轮数
    
    def get_agent_prompt(self, agent_name: str, agent_role: str, 
                         meeting_topic: str, current_round: int) -> str:
        """根据轮次获取角色扮演模式下的提示"""
        if current_round == 1:
            return f"""你正在参与一个关于"{meeting_topic}"的角色扮演会议。
作为{agent_role}，你需要从你扮演的角色视角出发，表达对该议题的看法和关注点。
请完全沉浸在你的角色中，从该角色的立场、利益和价值观出发思考问题。
在本轮中，请简要介绍你的角色立场，并表达你对议题的初步看法。"""
        
        elif current_round == 2:
            return f"""这是角色扮演会议的第二轮。
继续保持你作为{agent_role}的角色，回应其他参与者的观点。
你可以表达同意、不同意或提出问题，但一定要保持在角色的立场和视角内。
请对其他角色的发言做出回应，并进一步深化你的观点。"""
        
        else:
            return f"""这是角色扮演会议的最后一轮。
作为{agent_role}，请总结你的立场和关键观点。
在坚持你的角色视角的同时，可以适当提出一些妥协或合作的可能性。
请提出1-2个从你的角色视角出发，认为可行的解决方案或建议。"""
    
    def determine_speaking_order(self, agents: List[Dict[str, Any]], 
                                current_round: int) -> List[str]:
        """角色扮演模式下的发言顺序，按照列表顺序轮流发言"""
        return [agent["name"] for agent in agents]
    
    def should_end_meeting(self, rounds_completed: int, 
                          meeting_history: List[Dict[str, Any]]) -> bool:
        """当完成预设的轮数后结束会议"""
        return rounds_completed >= self.max_rounds
    
    def get_summary_prompt_template(self) -> str:
        """获取角色扮演模式的总结提示模板"""
        return """
你是一个会议总结专家。请对以下关于"{meeting_topic}"的角色扮演会议进行总结。
会议记录如下:

{history_text}

请提供以下内容:
1. 每个角色的主要立场和观点概述
2. 各角色之间的主要分歧点和共识点
3. 提出的主要解决方案或建议
4. 不同角色视角带来的洞见
5. 可能的后续行动或讨论方向

请以清晰、结构化的方式呈现总结。
""" 