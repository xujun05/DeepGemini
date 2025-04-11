from datetime import datetime
from typing import List, Dict, Any, Optional, Union
import uuid
import logging

from app.meeting.agents.agent import Agent
from app.meeting.agents.human_agent import HumanAgent
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
        self.history = []  # 统一使用history存储会议历史
        self.meeting_history = []  # 保持meeting_history兼容性
        self.status = "未开始"
        self.current_round = 1
        self.current_speaker_index = 0  # 添加当前发言者索引
        self.start_time = datetime.now()
        self.end_time = None
        self.group_info = None  # 用于存储讨论组信息
        
    def add_message(self, agent_name: str, content: str):
        """添加消息到会议历史记录"""
        message = {
            "agent": agent_name,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        self.history.append(message)
        self.meeting_history.append(message)  # 同时更新两个历史记录列表
        
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
    
    def conduct_round(self) -> Dict[str, Any]:
        """进行一轮会议讨论"""
        try:
            if self.status != "进行中":
                raise ValueError(f"无法进行讨论，会议状态为: {self.status}")
            
            # 获取当前发言者
            current_speaker = self.agents[self.current_speaker_index]
            logger.info(f"会议 {self.id} 进行第 {self.current_round} 轮，当前发言者: {current_speaker.name}")
            
            # 构建当前上下文 - 包含会议历史记录
            current_context = self._build_meeting_context()
            
            # 检查是否有人类参与者等待响应
            if hasattr(current_speaker, 'is_human') and current_speaker.is_human:
                # 处理人类参与者响应
                response = current_speaker.response(self.id, self.current_round, current_context)
            else:
                # 生成AI智能体响应
                mode_specific_prompt = self._get_mode_specific_prompt()
                
                # 确保智能体有conversation_history属性
                if not hasattr(current_speaker, 'conversation_history'):
                    current_speaker.conversation_history = []
                
                # 生成响应
                response = current_speaker.speak(
                    meeting_topic=self.topic,
                    meeting_mode=self.mode.name,
                    current_context=current_context,
                    mode_specific_prompt=mode_specific_prompt
                )
            
            # 处理响应
            return self.handle_agent_response(current_speaker, response)
            
        except Exception as e:
            logger.error(f"会议 {self.id} 进行轮次时出错: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"会议轮次进行失败: {str(e)}",
                "round": self.current_round,
                "speaker": self.agents[self.current_speaker_index].name if self.agents else "未知",
                "error": str(e)
            }

    def handle_agent_response(self, agent: Union[Agent, HumanAgent], response: str) -> Dict[str, Any]:
        """处理智能体响应并更新会议状态"""
        try:
            # 创建轮次记录
            round_record = {
                "round": self.current_round,
                "speaker": agent.name,
                "content": response,
                "timestamp": datetime.now().isoformat()
            }
            
            # 添加到历史记录
            self.history.append(round_record)
            
            # 更新智能体的对话历史
            if hasattr(agent, 'conversation_history'):
                # 确保conversation_history是一个列表
                if not isinstance(agent.conversation_history, list):
                    agent.conversation_history = []
                
                # 添加当前轮次的对话到历史记录
                current_context = self._build_meeting_context()
                agent.conversation_history.append({
                    "role": "user", 
                    "content": current_context
                })
                agent.conversation_history.append({
                    "role": "assistant", 
                    "content": response
                })
            
            # 移动到下一位发言者
            self._move_to_next_speaker()
            
            # 检查是否达到结束条件
            if self._check_end_conditions():
                self._end_meeting()
            
            return {
                "success": True,
                "message": "发言已记录",
                "meeting_id": self.id,
                "round": self.current_round - 1,  # 返回刚完成的轮次
                "speaker": agent.name,
                "content": response,
                "is_finished": self.status == "已结束",
                "next_speaker": self.agents[self.current_speaker_index].name if self.status == "进行中" else None
            }
        except Exception as e:
            logger.error(f"处理智能体响应时出错: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"处理响应失败: {str(e)}",
                "error": str(e)
            }

    def _check_end_conditions(self):
        """检查是否达到结束条件"""
        return self.current_round > self.max_rounds or self.mode.should_end_meeting(self.current_round - 1, self.history)

    def _build_meeting_context(self) -> List[Dict[str, str]]:
        """构建会议上下文 - 返回字典列表以便于在流式生成中正确处理"""
        context = []
        
        # 添加系统消息，说明会议主题和模式
        context.append({
            "role": "system", 
            "content": f"会议主题: {self.topic}\n会议模式: {self.mode.name}"
        })
        
        # 添加历史记录
        for entry in self.history:
            speaker = entry.get("speaker", "未知")
            content = entry.get("content", "")
            
            # 根据发言者确定角色
            role = "user" if speaker != "system" else "system"
            
            # 添加带有发言者信息的消息
            context.append({
                "role": role,
                "content": f"[{speaker}]: {content}"
            })
            
        return context

    def _get_mode_specific_prompt(self):
        """获取模式特定的提示"""
        if hasattr(self.mode, 'get_agent_prompt'):
            return self.mode.get_agent_prompt(
                agent_name=self.agents[self.current_speaker_index].name,
                agent_role=self.agents[self.current_speaker_index].role_description,
                meeting_topic=self.topic,
                current_round=self.current_round
            )
        return ""

    def _move_to_next_speaker(self):
        """移动到下一位发言者"""
        self.current_speaker_index = (self.current_speaker_index + 1) % len(self.agents)
        
        # 如果已经循环一轮，增加轮次计数
        if self.current_speaker_index == 0:
            self.current_round += 1
            logger.info(f"会议 {self.id} 进入第 {self.current_round} 轮")

    def add_human_message(self, agent_name, message):
        """添加来自特定人类角色的消息"""
        # 查找对应的人类智能体
        agent = next((a for a in self.agents if a.name == agent_name and hasattr(a, 'is_human') and a.is_human), None)
        if not agent:
            logger.warning(f"找不到人类角色 {agent_name}")
            return False
            
        # 设置响应或中断
        if agent.is_waiting_for_input():
            # 如果正在等待输入，直接设置响应
            agent.set_human_response(message)
        else:
            # 否则作为中断处理
            agent.interrupt(message)
            
        return True
        
    def get_human_roles(self):
        """获取所有人类角色"""
        return [
            {
                "name": agent.name,
                "id": agent.name,  # 使用名称作为ID
                "is_waiting": agent.is_waiting_for_input() if hasattr(agent, 'is_waiting_for_input') else False,
                "host_role": agent.host_role_name if hasattr(agent, 'host_role_name') else None
            }
            for agent in self.agents if hasattr(agent, 'is_human') and agent.is_human
        ]
        
    def get_waiting_human_roles(self):
        """获取正在等待输入的人类角色列表"""
        waiting_roles = []
        for agent in self.agents:
            if hasattr(agent, 'is_human') and agent.is_human and hasattr(agent, 'is_waiting_for_input'):
                if agent.is_waiting_for_input():
                    waiting_roles.append(agent.name)
        return waiting_roles

    def get_history(self) -> List[Dict[str, Any]]:
        """
        获取会议历史记录
        
        返回:
            List[Dict[str, Any]]: 会议历史记录列表
        """
        return self.history 