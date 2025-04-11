from typing import Dict, List, Optional, Any, AsyncGenerator
import logging
import asyncio
import time
from app.meeting.agents.agent import Agent

# 设置日志
logger = logging.getLogger("HumanAgent")

class HumanAgent(Agent):
    """人类智能体，表示会议中的人类参与者"""
    
    def __init__(self, name: str, role_description: str, personality: str = "", 
                 skills: List[str] = None, model_params: Dict[str, Any] = None,
                 base_url: str = None, api_key: str = None):
        """初始化人类智能体"""
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
        
    def generate_response(self, prompt: str, context: List[Dict[str, str]] = None) -> str:
        """生成回应 - 对于人类用户，返回一个占位符，实际响应将在用户提交后更新"""
        logger.info(f"人类角色 {self.name} 需要回应，等待用户输入")
        self.is_waiting_response = True
        
        # 检查是否已有待处理的响应
        if self.pending_response:
            response = self.pending_response
            self.pending_response = None
            self.is_waiting_response = False
            return response
            
        # 否则返回一个占位符，表示正在等待
        return f"[等待 {self.name} 的输入...]"
    
    async def generate_response_stream(self, prompt: str, context: Optional[List[Dict[str, Any]]] = None) -> AsyncGenerator[str, None]:
        """流式生成响应 - 对于人类用户，实时流式返回输入的内容"""
        self.is_waiting_response = True
        logger.info(f"等待人类角色 {self.name} 的响应")
        
        try:
            # 如果有待处理的响应，立即返回
            if self.pending_response:
                response = self.pending_response
                self.pending_response = None
                self.last_response = response
                self.is_waiting_response = False
                yield response
                return
            
            # 返回等待消息
            yield f"[等待 {self.name} 的输入...]"
            
            # 等待响应
            while self.is_waiting_response:
                try:
                    # 等待新的响应块，设置超时以避免永久阻塞
                    chunk = await asyncio.wait_for(self.response_queue.get(), timeout=0.5)
                    if chunk == "[END]":
                        self.is_waiting_response = False
                        break
                    yield chunk
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"处理人类响应时出错: {str(e)}")
                    break
            
        except Exception as e:
            logger.error(f"生成人类响应流时出错: {str(e)}")
            yield f"[错误] 处理人类响应时出错: {str(e)}"
        finally:
            self.is_waiting_response = False
    
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
    
    async def interrupt(self, message: str) -> None:
        """中断当前会议，插入人类消息"""
        async with self.stream_lock:
            logger.info(f"人类角色 {self.name} 打断会议: {message[:50]}...")
            self.pending_response = message
            self.is_interrupted = True
            self.is_waiting_response = False
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
    
    def is_waiting_for_input(self) -> bool:
        """检查是否正在等待人类输入"""
        return self.is_waiting_response
    
    def get_current_round(self) -> int:
        """获取当前轮次"""
        return self.current_round
    
    def set_current_round(self, round_id: int) -> None:
        """设置当前轮次"""
        self.current_round = round_id
    
    def response(self, meeting_id: str, round_id: int, context: str) -> str:
        """返回人类参与者的响应"""
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
            
            # 如果没有回应，返回等待消息
            return f"正在等待 {self.name} 的回应..."
        except Exception as e:
            logger.error(f"人类智能体响应出错: {str(e)}", exc_info=True)
            return f"[错误] 无法获取 {self.name} 的响应。错误: {str(e)}" 