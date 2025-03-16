from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
import logging

from app.meeting.agents.agent import Agent
from app.meeting.meeting_modes.base_mode import BaseMeetingMode

logger = logging.getLogger(__name__)

class Meeting:
    """会议类，用于管理多智能体会议"""
    
    def __init__(self, id: str, topic: str, mode: BaseMeetingMode, max_rounds: int = 3):
        """
        初始化会议实例
        
        参数:
            id: 会议ID
            topic: 会议主题
            mode: 会议模式
            max_rounds: 最大讨论轮数
        """
        self.id = id
        self.topic = topic
        self.mode = mode
        
        # 确保最大轮数一致 - 优先使用传入的值，但也更新模式的值
        self.max_rounds = max_rounds
        self.mode.set_max_rounds(max_rounds)
        
        self.agents = []
        self.meeting_history = []
        self.status = "未开始"
        self.current_round = 1
        self.start_time = datetime.now()
        self.end_time = None
        self.group_info = None  # 用于存储讨论组信息
        
    def add_message(self, agent_name: str, content: str):
        """添加消息到会议历史记录"""
        self.meeting_history.append({
            "agent": agent_name,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
    async def conduct_round_stream(self):
        """进行一轮讨论，支持流式输出"""
        # 检查讨论是否已经完成
        if self.current_round > self.max_rounds:
            self.status = "已结束"
            return []
        
        if self.status == "已结束":
            return {"status": "已结束", "message": "会议已结束"}
        
        # 确定发言顺序
        speaking_order = self.mode.determine_speaking_order(
            [{"name": agent.name, "role": agent.role_description} for agent in self.agents],
            self.current_round
        )
        
        # 返回发言顺序和当前轮次，供外部处理
        return {
            "status": "进行中",
            "current_round": self.current_round,
            "speaking_order": speaking_order
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
        """将会议对象转换为字典"""
        summary = self.get_summary()  # 获取会议总结
        
        return {
            "id": self.id,
            "topic": self.topic,
            "mode": self.mode.name,
            "status": self.status,
            "current_round": self.current_round,
            "max_rounds": self.max_rounds,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "history": self.meeting_history,
            "summary": summary  # 确保总结字段被包含
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