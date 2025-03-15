from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
import time

from agents.agent import Agent
from meeting_modes.base_mode import BaseMeetingMode

class Meeting:
    """会议主类，负责管理整个会议流程"""
    
    def __init__(
        self,
        topic: str,
        mode: BaseMeetingMode,
        agents: List[Agent],
        meeting_id: Optional[str] = None
    ):
        self.topic = topic
        self.mode = mode
        self.agents = agents
        self.meeting_id = meeting_id or str(uuid.uuid4())
        self.start_time = None
        self.end_time = None
        self.meeting_history = []  # 会议历史记录
        self.current_round = 0
        self.status = "未开始"  # 状态：未开始、进行中、已结束
    
    def start(self):
        """开始会议"""
        if self.status != "未开始":
            raise ValueError(f"会议已经{self.status}，无法再次开始")
        
        self.start_time = datetime.now()
        self.status = "进行中"
        self.current_round = 1
        
        # 记录会议开始的日志
        self._log_event("system", f"会议'{self.topic}'开始，模式：{self.mode.name}")
        
        # 记录参会智能体
        agent_names = [agent.name for agent in self.agents]
        self._log_event("system", f"参会智能体: {', '.join(agent_names)}")
    
    def conduct_round(self):
        """进行一轮会议"""
        if self.status != "进行中":
            raise ValueError(f"会议状态为{self.status}，无法进行")
        
        # 确定发言顺序
        speaking_order = self.mode.determine_speaking_order(
            [{
                "name": agent.name,
                "role": agent.role_description
            } for agent in self.agents],
            self.current_round
        )
        
        # 每个智能体轮流发言
        for agent_name in speaking_order:
            # 获取当前智能体
            agent = next((a for a in self.agents if a.name == agent_name), None)
            if not agent:
                continue
            
            # 获取当前会议上下文
            current_context = self._get_current_context()
            
            # 获取特定会议模式的提示
            mode_specific_prompt = self.mode.get_agent_prompt(
                agent.name, 
                agent.role_description,
                self.topic,
                self.current_round
            )
            
            # 记录开始思考的时间点
            self._log_event("system", f"{agent.name} 开始思考...", self.current_round)
            
            # 智能体发言
            response = agent.speak(
                meeting_topic=self.topic,
                meeting_mode=self.mode.name,
                current_context=current_context,
                mode_specific_prompt=mode_specific_prompt
            )
            
            # 记录发言到会议历史
            self._log_event(agent.name, response)
            
            # 更新所有其他智能体的会话历史
            for other_agent in self.agents:
                if other_agent.name != agent.name:
                    other_agent.update_history(self.meeting_history[-1:])
            
            # 适当暂停，确保发言被处理
            time.sleep(10)  # 暂停1秒
        
        # 更新轮次
        self.current_round += 1
        
        # 检查会议是否应该结束
        if self.mode.should_end_meeting(self.current_round - 1, self.meeting_history):
            self.end()
    
    def end(self):
        """结束会议"""
        if self.status != "进行中":
            return
        
        self.end_time = datetime.now()
        self.status = "已结束"
        
        # 生成会议总结
        summary = self.mode.summarize_meeting(self.topic, self.meeting_history)
        self._log_event("system", f"会议总结:\n{summary}")
        
        # 记录会议结束日志
        duration = self.end_time - self.start_time
        self._log_event("system", f"会议结束，持续时间: {duration}")
    
    def _log_event(self, agent: str, content: str, round_num=None):
        """记录会议事件"""
        # 如果没有指定轮次，则使用当前轮次
        if round_num is None:
            round_num = self.current_round
        
        self.meeting_history.append({
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "content": content,
            "round": round_num
        })
    
    def _get_current_context(self) -> str:
        """获取当前会议上下文，用于提供给智能体"""
        # 获取最近10条记录或全部记录（如果少于10条）
        recent_history = self.meeting_history[-10:] if len(self.meeting_history) > 10 else self.meeting_history
        
        context = f"会议主题: {self.topic}\n当前轮次: {self.current_round}\n\n最近的讨论内容:\n"
        for entry in recent_history:
            context += f"[{entry['agent']}]: {entry['content']}\n\n"
        
        return context
    
    def to_dict(self) -> Dict[str, Any]:
        """将会议信息转换为字典，用于保存日志"""
        return {
            "meeting_id": self.meeting_id,
            "topic": self.topic,
            "mode": self.mode.name,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "agents": [{"name": agent.name, "role": agent.role_description} for agent in self.agents],
            "history": self.meeting_history,
            "status": self.status
        }
    
    def get_current_context(self):
        """获取当前会议上下文的公共方法"""
        return self._get_current_context() 