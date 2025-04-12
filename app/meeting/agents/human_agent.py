from typing import Dict, List, Optional, Any, AsyncGenerator
import logging
import asyncio
import time
from app.meeting.agents.agent import Agent
from datetime import datetime

# 设置日志
logger = logging.getLogger(__name__)

class HumanAgent(Agent):
    """人类智能体，表示会议中的人类参与者"""
    
    def __init__(self, name: str, role_description: str, personality: Optional[str] = None, skills: Optional[List[str]] = None,
                 model_params: Dict[str, Any] = None, base_url: str = None, api_key: str = None):
        """
        初始化人类智能体
        
        参数:
            name: 人类角色名称
            role_description: 人类角色描述
            personality: 人格特点描述
            skills: 技能列表
            model_params: 模型参数
            base_url: 基础URL
            api_key: API密钥
        """
        super().__init__(name, role_description, personality, skills, model_params, base_url, api_key)
        self.is_human = True
        self.human_responses = {}  # 存储人类的响应，格式为 {round_id: response}
        self.current_round = 0
        self.conversation_history = []  # 确保有对话历史属性
        self.pending_response = None  # 存储等待中的人类响应
        self.is_waiting_response = False  # 标记是否正在等待响应
        self.is_interrupted = False  # 标记是否被打断
        self.host_role_name = None  # 寄生的角色名称
        self.response_queue = asyncio.Queue()
        self.stream_lock = asyncio.Lock()
        self.is_waiting_input = False  # 是否等待人类输入
        self.pending_message = None  # 等待发送的消息
        self.input_timeout = 600  # 默认等待人类输入的超时时间（秒）
        self.input_start_time = None  # 记录开始等待人类输入的时间
    
    def wait_for_input(self):
        """设置为等待人类输入状态，并记录开始时间"""
        self.is_waiting_input = True
        self.input_start_time = time.time()
        logger.info(f"人类智能体 {self.name} 等待输入")
        # 通知系统会议暂停，等待人类输入
        return True
    
    def is_waiting_for_input(self):
        """检查是否正在等待人类输入"""
        # 返回实际的等待状态值
        return self.is_waiting_input
    
    def add_message(self, content: str):
        """添加人类消息"""
        self.pending_message = content
        # 将消息存入human_responses字典，以当前轮次为键
        self.human_responses[self.current_round] = content
        # 重置等待状态
        self.is_waiting_input = False
        self.input_start_time = None
        # 记录为最后响应
        self.last_response = content
        logger.info(f"人类智能体 {self.name} 收到消息: {content[:50]}..., 当前轮次: {self.current_round}")
        return True
    
    def get_input_wait_duration(self):
        """获取已等待人类输入的时间（秒）"""
        if not self.is_waiting_input or not self.input_start_time:
            return 0
        return time.time() - self.input_start_time
    
    def has_input_timeout(self):
        """检查是否已超过等待人类输入的超时时间"""
        wait_duration = self.get_input_wait_duration()
        return wait_duration > self.input_timeout if wait_duration > 0 else False
    
    def generate_response(self, prompt: str, context: List[Dict[str, Any]] = None) -> str:
        """
        生成响应 - 对于人类智能体，返回预先输入的消息或等待输入
        
        参数:
            prompt: 提示词
            context: 上下文消息历史
            
        返回:
            消息内容或等待人类输入的提示
        """
        # 如果有待发送的消息，返回它
        if self.pending_message:
            message = self.pending_message
            self.pending_message = None
            return message
        
        # 否则设置为等待输入状态并暂停会议
        self.wait_for_input()
        # 特殊标志，表示需要等待人类输入
        return f"[WAITING_FOR_HUMAN_INPUT:{self.name}]"
    
    async def generate_response_stream(self, prompt: str, context: List[Dict[str, Any]] = None):
        """流式生成响应 - 对于人类智能体，返回等待人类输入的特殊标记"""
        # 检查是否已有待处理的消息
        if self.pending_message:
            message = self.pending_message
            self.pending_message = None
            yield message
            return
        
        # 设置等待人类输入状态
        self.wait_for_input()
        # 返回特殊标记，表示需要等待人类输入
        yield f"[WAITING_FOR_HUMAN_INPUT:{self.name}]"
    
    async def add_response_chunk(self, chunk: str) -> None:
        """添加响应块到流中"""
        await self.response_queue.put(chunk)
    
    async def finish_response(self) -> None:
        """标记响应完成"""
        await self.response_queue.put("[END]")
        self.is_waiting_response = False
    
    def set_human_response(self, response: str) -> None:
        """设置人类用户的完整响应"""
        logger.info(f"收到人类角色 {self.name} 的响应: {response[:50]}...")
        self.pending_response = response
        self.last_response = response
        self.is_waiting_response = False
        self.is_waiting_input = False
        self.input_start_time = None
    
    async def interrupt(self, message: str) -> None:
        """中断当前会议，插入人类消息"""
        async with self.stream_lock:
            logger.info(f"人类角色 {self.name} 打断会议: {message[:50]}...")
            self.pending_response = message
            self.is_interrupted = True
            self.is_waiting_response = False
            self.is_waiting_input = False
            self.input_start_time = None
            # 清空现有队列
            while not self.response_queue.empty():
                try:
                    self.response_queue.get_nowait()
                except asyncio.QueueEmpty:
                    break
            # 添加中断消息
            await self.add_response_chunk(message)
            await self.finish_response()
    
    def clear_interrupt(self) -> None:
        """清除中断状态"""
        self.is_interrupted = False
    
    def is_interrupting(self) -> bool:
        """检查是否正在进行中断"""
        return self.is_interrupted
    
    def get_current_round(self) -> int:
        """获取当前轮次"""
        return self.current_round
    
    def set_current_round(self, round_id: int) -> None:
        """设置当前轮次"""
        self.current_round = round_id
    
    def response(self, meeting_id: str, round_id: int, context: str) -> str:
        """返回人类参与者的响应，如果没有输入则暂停会议"""
        try:
            # 更新当前轮次
            self.current_round = round_id
            
            # 如果已经有人类的回应，直接返回
            if round_id in self.human_responses and self.human_responses[round_id]:
                response = self.human_responses[round_id]
                
                # 更新对话历史
                if hasattr(self, 'conversation_history'):
                    self.conversation_history.append({"role": "user", "content": context})
                    self.conversation_history.append({"role": "assistant", "content": response})
                
                return response
            
            # 没有回应，设置等待状态
            self.wait_for_input()
            
            # 返回特殊格式的等待消息
            return f"[WAITING_FOR_HUMAN_INPUT:{self.name}]"
        except Exception as e:
            logger.error(f"人类智能体响应出错: {str(e)}", exc_info=True)
            return f"[错误] 无法获取 {self.name} 的响应。错误: {str(e)}"
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典表示"""
        return {
            "name": self.name,
            "role_description": self.role_description,
            "personality": self.personality,
            "skills": self.skills,
            "is_human": True,
            "is_waiting_input": self.is_waiting_input,
            "input_wait_duration": self.get_input_wait_duration() if self.is_waiting_input else 0
        } 