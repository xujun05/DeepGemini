from typing import List, Optional
from .agent import Agent

class AgentFactory:
    """智能体工厂类，用于创建预设智能体"""
    
    def get_predefined_agents(self, model_name: Optional[str] = None, base_url: Optional[str] = None, api_key: Optional[str] = None) -> List[Agent]:
        """获取预设智能体列表"""
        # 创建模型参数字典
        model_params = {}
        if model_name:
            model_params["model_name"] = model_name
        
        # 为每个智能体创建特定的个性化模型参数
        predefined_agents_with_params = [
            {
                "name": "创新者",
                "role_description": "负责提出创新性想法，打破传统思维",
                "personality": "积极主动，富有想象力",
                "skills": ["创意思维", "跨领域联想", "创新方案设计"],
                "model_params": {
                    **model_params,
                    "temperature": 0.9,  # 高温度，更有创意
                    "max_tokens": 1000,
                    "model_name": model_name or "gemini-1.5-pro",  # 可以为每个智能体指定不同模型
                },
                "base_url": base_url,  # 可以配置不同的base_url
                "api_key": api_key     # 可以配置不同的api_key
            },
            {
                "name": "批判者",
                "role_description": "负责质疑现有方案，从不同角度分析问题",
                "personality": "理性冷静，善于分析",
                "skills": ["逻辑推理", "风险评估", "批判性思维"],
                "model_params": {
                    **model_params,
                    "temperature": 0.5,  # 低温度，更有逻辑性
                    "max_tokens": 1200,
                    "model_name": model_name or "gpt-4-turbo",  # 批判者用更强大的模型
                },
                "base_url": base_url,
                "api_key": api_key
            },
            {
                "name": "协调者",
                "role_description": "整合各方观点，寻求共识和平衡",
                "personality": "平和包容，善于沟通",
                "skills": ["沟通协调", "冲突解决", "团队建设"],
                "model_params": {
                    **model_params,
                    "temperature": 0.7,  # 中等温度，平衡创意和逻辑
                    "max_tokens": 1100,
                }
            },
            {
                "name": "执行者",
                "role_description": "关注实际操作和落地方案",
                "personality": "务实高效，注重细节",
                "skills": ["项目管理", "资源分配", "行动计划制定"],
                "model_params": {
                    **model_params, 
                    "temperature": 0.4,  # 低温度，更关注实际和细节
                    "max_tokens": 900,
                }
            }
        ]
        
        # 创建智能体实例
        predefined_agents = []
        for agent_data in predefined_agents_with_params:
            agent = Agent(
                name=agent_data["name"],
                role_description=agent_data["role_description"],
                personality=agent_data["personality"],
                skills=agent_data["skills"],
                model_params=agent_data["model_params"],
                base_url=agent_data.get("base_url", base_url),
                api_key=agent_data.get("api_key", api_key)
            )
            predefined_agents.append(agent)
        return predefined_agents

    def create(self, name, role, personality, skills, model_params=None, base_url=None, api_key=None):
        """创建一个智能体实例"""
        agent = Agent(
            name=name,
            role_description=role,
            personality=personality,
            skills=skills,
            model_params=model_params,
            base_url=base_url,
            api_key=api_key
        )
        return agent

    def create_agent(self, name, role, personality, skills, model_params=None, base_url=None):
        """创建智能体的别名方法，与create方法功能相同"""
        return self.create(name, role, personality, skills, model_params, base_url)