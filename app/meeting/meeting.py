from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
import logging

from app.meeting.agents.agent import Agent

logger = logging.getLogger(__name__)

class Meeting:
    """会议类，用于管理多智能体会议"""
    
    def __init__(self, topic: str, agents: List[Agent], mode: Any):
        self.id = str(uuid.uuid4())
        self.topic = topic
        self.agents = agents
        self.mode = mode
        self.meeting_history = []
        self.current_round = 1
        self.status = "进行中"  # 进行中、已结束
        self.start_time = datetime.now()
        self.end_time = None
        
    def add_message(self, agent_name: str, content: str):
        """添加消息到会议历史记录"""
        self.meeting_history.append({
            "agent": agent_name,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
    def conduct_round(self) -> Dict[str, Any]:
        """进行一轮讨论"""
        if self.status == "已结束":
            return {"status": "已结束", "message": "会议已结束"}
        
        # 确定发言顺序
        speaking_order = self.mode.determine_speaking_order(
            [{"name": agent.name, "role": agent.role_description} for agent in self.agents],
            self.current_round
        )
        
        # 每个智能体依次发言
        for agent_name in speaking_order:
            # 获取智能体
            agent = next((a for a in self.agents if a.name == agent_name), None)
            if not agent:
                continue
                
            # 获取智能体提示
            prompt = self.mode.get_agent_prompt(
                agent_name=agent.name,
                agent_role=agent.role_description,
                meeting_topic=self.topic,
                current_round=self.current_round
            )
            
            # 获取当前上下文
            context = self._get_current_context()
            
            # 生成回应
            response = agent.generate_response(prompt, context)
            
            # 添加到会议历史
            self.add_message(agent.name, response)
        
        # 检查是否应该结束会议
        if self.mode.should_end_meeting(self.current_round, self.meeting_history):
            self._end_meeting()
            return {"status": "已结束", "message": "会议已结束"}
        
        # 更新轮次
        self.current_round += 1
        
        return {
            "status": "进行中",
            "current_round": self.current_round - 1,
            "messages": self.meeting_history[-len(speaking_order):]
        }
    
    def _end_meeting(self):
        """结束会议"""
        if self.status == "已结束":
            return
            
        self.status = "已结束"
        self.end_time = datetime.now()
        
        # 生成会议总结
        summary = self.mode.summarize_meeting(self.topic, self.meeting_history)
        
        # 添加总结到会议历史
        self.add_message("system", summary)
    
    def _get_current_context(self) -> List[Dict[str, str]]:
        """获取当前会议上下文"""
        context = []
        
        # 添加系统消息
        context.append({
            "role": "system",
            "content": f"这是一个关于'{self.topic}'的多人会议。你是其中的一名参与者，请根据会议历史记录和你的角色提供回应。"
        })
        
        # 添加历史消息
        for entry in self.meeting_history:
            context.append({
                "role": "user" if entry["agent"] != "system" else "system",
                "content": f"[{entry['agent']}]: {entry['content']}"
            })
            
        return context
    
    def to_dict(self) -> Dict[str, Any]:
        """将会议转换为字典"""
        return {
            "id": self.id,
            "topic": self.topic,
            "agents": [
                {
                    "name": agent.name,
                    "role": agent.role_description,
                    "personality": agent.personality
                }
                for agent in self.agents
            ],
            "mode": self.mode.name,
            "meeting_history": self.meeting_history,
            "current_round": self.current_round,
            "status": self.status,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None
        }
    
    def get_context(self):
        """获取当前会议上下文的公共方法"""
        return self._get_current_context()
    
    def finish(self):
        """
        结束会议并生成摘要
        该方法用于外部调用，提供了一个公共接口来结束会议
        """
        # 确保会议已结束
        if self.status != "已结束":
            self._end_meeting()
        
        # 如果已经结束，不需要重复执行
        return self.mode.summarize_meeting(self.topic, self.meeting_history)
    
    def get_summary(self) -> str:
        """
        获取会议总结
        
        如果会议尚未结束，会先调用finish方法确保生成总结
        
        返回:
            str: 会议总结内容
        """
        # 如果会议尚未结束，先结束会议
        if self.status != "已结束":
            self.finish()
        
        # 从会议历史中查找最后一条系统消息作为总结
        for message in reversed(self.meeting_history):
            if message["agent"] == "system" and message["content"] and len(message["content"]) > 50:
                # 找到最后一条有意义的系统消息（总结通常较长）
                return message["content"]
        
        # 如果没有找到合适的总结，返回一个默认消息
        return f"关于'{self.topic}'的会议已结束，但未找到总结。"
    
    def get_meeting_history(self) -> List[Dict[str, Any]]:
        """
        获取会议历史记录
        
        返回:
            List[Dict[str, Any]]: 会议历史记录列表
        """
        return self.meeting_history 