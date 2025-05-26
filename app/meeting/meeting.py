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
        self.rounds = []  # 存储每轮讨论的消息
        self.status = "未开始"
        self.current_round = 1
        self.current_speaker_index = 0  # 添加当前发言者索引
        self.start_time = datetime.now()
        self.end_time = None
        self.group_info = None  # 用于存储讨论组信息
        self._skip_auto_summary = False  # 标志是否跳过自动生成总结
        
    def add_message(self, agent_name: str, content: str):
        """添加消息到会议历史记录"""
        message = {
            "agent": agent_name,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        self.history.append(message)
        self.meeting_history.append(message)  # 同时更新两个历史记录列表
        
    def start_meeting(self):
        """开始会议"""
        if self.status != "未开始":
            logger.warning(f"会议状态已经是 {self.status}，不需要再次开始")
            return False
            
        self.status = "进行中"
        logger.info(f"会议 {self.id} 已开始，主题: {self.topic}")
        
        # 添加会议开始的记录
        self.add_message("system", f"会议已开始，主题: {self.topic}")
        
        return True
        
    async def conduct_round_stream(self):
        """进行一轮讨论，支持流式输出"""
        # 检查讨论是否已经完成
        if self.current_round >= self.max_rounds + 1:
            self.status = "已结束"
            self.end_time = datetime.now()
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
        
        # 检查是否设置了跳过自动生成总结的标志
        if hasattr(self, '_skip_auto_summary') and self._skip_auto_summary:
            logger.info(f"会议 {self.id} 设置了_skip_auto_summary标志，跳过自动生成总结")
            return
        
        # 使用讨论组的自定义总结模型和提示进行总结
        from app.meeting.utils.summary_generator import SummaryGenerator
        import logging
        
        logger = logging.getLogger(__name__)
        
        # 检查是否有讨论组信息和总结模型配置
        custom_prompt = None
        model_id = None
        api_key = None
        api_base_url = None
        model_name = None
        
        if self.group_info:
            # 获取自定义提示模板（如果有）
            if 'summary_prompt' in self.group_info and self.group_info['summary_prompt']:
                custom_prompt = self.group_info['summary_prompt']
                logger.info(f"使用讨论组自定义总结提示模板: length={len(custom_prompt)}")
            
            # 获取自定义总结模型（如果有）
            if 'summary_model_id' in self.group_info and self.group_info['summary_model_id']:
                model_id = self.group_info['summary_model_id']
                logger.info(f"使用讨论组自定义总结模型: model_id={model_id}")
                
                try:
                    # 这里简化处理，实际使用时应从adapter获取model信息
                    # 这里是为了保证即使无法获取model详情，也能使用默认模型生成总结
                    from app.models.database import get_db, Model
                    from sqlalchemy.orm import Session
                    
                    # 获取数据库会话
                    db = next(get_db())
                    
                    # 查询模型配置
                    summary_model = db.query(Model).filter(Model.id == model_id).first()
                    
                    if summary_model:
                        logger.info(f"找到总结模型: {summary_model.name}")
                        model_name = summary_model.name
                        
                        # 获取API密钥和基础URL
                        api_key = getattr(summary_model, 'api_key', None)
                        api_url = getattr(summary_model, 'api_url', None)
                        
                        # 处理URL，从完整URL中提取基础部分
                        if api_url:
                            if "/v1/chat/completions" in api_url:
                                api_base_url = api_url.split("/v1/chat/completions")[0]
                            else:
                                api_base_url = api_url
                except Exception as e:
                    logger.error(f"获取总结模型信息失败: {str(e)}，将使用默认模型", exc_info=True)
        
        # 使用模式的默认提示模板或自定义提示
        prompt_template = custom_prompt if custom_prompt else self.mode.get_summary_prompt_template()
        
        # 生成总结
        summary = SummaryGenerator.generate_summary(
            meeting_topic=self.topic,
            meeting_history=self.meeting_history,
            prompt_template=prompt_template,
            model_name=model_name,
            api_key=api_key,
            api_base_url=api_base_url
        )
        
        # 添加总结到会议历史
        self.add_message("system", summary)
        
        logger.info(f"会议 {self.id} 已结束，使用{'自定义' if custom_prompt else '默认'}提示模板和{'自定义' if model_name else '默认'}模型生成总结")
    
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
        # 检查是否设置了跳过自动生成总结的标志
        if hasattr(self, '_skip_auto_summary') and self._skip_auto_summary:
            logger.info(f"会议 {self.id} 设置了_skip_auto_summary标志，跳过自动生成总结")
            # 确保会议已结束
            if self.status != "已结束":
                self.status = "已结束"
                self.end_time = datetime.now()
            
            # 尝试查找已有的总结，如果有则返回
            for message in reversed(self.meeting_history):
                if message["agent"] == "system" and message["content"] and len(message["content"]) > 50:
                    logger.info(f"找到已有总结，长度: {len(message['content'])}")
                    return message["content"]
            
            # 如果没有找到总结，返回默认消息
            return f"关于'{self.topic}'的会议已结束，总结将由外部处理。"
        
        # 先检查是否已有总结
        existing_summary = None
        for message in reversed(self.meeting_history):
            if message["agent"] == "system" and message["content"] and len(message["content"]) > 50:
                # 找到最后一条有意义的系统消息（总结通常较长）
                existing_summary = message["content"]
                break
                
        # 如果已有有效的总结，直接返回
        if existing_summary and len(existing_summary) > 100 and "未找到总结" not in existing_summary:
            logger.info(f"会议 {self.id} 已有有效总结，长度: {len(existing_summary)}，避免重复生成")
            return existing_summary
        
        # 确保会议已结束
        if self.status != "已结束":
            self._end_meeting()
            return self.get_summary()  # 直接调用get_summary获取总结，因为_end_meeting已经生成了
        
        # 如果会议已结束但没有总结，则使用与_end_meeting相同的逻辑重新生成总结
        from app.meeting.utils.summary_generator import SummaryGenerator
        
        # 检查是否有讨论组信息和总结模型配置
        custom_prompt = None
        model_id = None
        api_key = None
        api_base_url = None
        model_name = None
        
        if self.group_info:
            # 获取自定义提示模板（如果有）
            if 'summary_prompt' in self.group_info and self.group_info['summary_prompt']:
                custom_prompt = self.group_info['summary_prompt']
                logger.info(f"使用讨论组自定义总结提示模板: length={len(custom_prompt)}")
            
            # 获取自定义总结模型（如果有）
            if 'summary_model_id' in self.group_info and self.group_info['summary_model_id']:
                model_id = self.group_info['summary_model_id']
                logger.info(f"使用讨论组自定义总结模型: model_id={model_id}")
                
                try:
                    # 这里简化处理，实际使用时应从adapter获取model信息
                    # 这里是为了保证即使无法获取model详情，也能使用默认模型生成总结
                    from app.models.database import get_db, Model
                    from sqlalchemy.orm import Session
                    
                    # 获取数据库会话
                    db = next(get_db())
                    
                    # 查询模型配置
                    summary_model = db.query(Model).filter(Model.id == model_id).first()
                    
                    if summary_model:
                        logger.info(f"找到总结模型: {summary_model.name}")
                        model_name = summary_model.name
                        
                        # 获取API密钥和基础URL
                        api_key = getattr(summary_model, 'api_key', None)
                        api_url = getattr(summary_model, 'api_url', None)
                        
                        # 处理URL，从完整URL中提取基础部分
                        if api_url:
                            if "/v1/chat/completions" in api_url:
                                api_base_url = api_url.split("/v1/chat/completions")[0]
                            else:
                                api_base_url = api_url
                except Exception as e:
                    logger.error(f"获取总结模型信息失败: {str(e)}，将使用默认模型", exc_info=True)
        
        # 使用模式的默认提示模板或自定义提示
        prompt_template = custom_prompt if custom_prompt else self.mode.get_summary_prompt_template()
        
        # 生成总结
        summary = SummaryGenerator.generate_summary(
            meeting_topic=self.topic,
            meeting_history=self.meeting_history,
            prompt_template=prompt_template,
            model_name=model_name,
            api_key=api_key,
            api_base_url=api_base_url
        )
        
        # 将总结添加到会议历史中
        self.add_message("system", summary)
        
        logger.info(f"会议 {self.id} 已生成总结，长度: {len(summary)}")
        return summary
    
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
    
    def get_meeting_history(self):
        """获取会议历史记录"""
        return self.meeting_history
    
    def get_human_roles(self):
        """获取会议中的人类角色列表"""
        human_roles = []
        for agent in self.agents:
            if hasattr(agent, 'is_human') and agent.is_human:
                human_roles.append({
                    "name": agent.name,
                    "role": agent.role_description,
                    "is_waiting": agent.is_waiting_for_input()
                })
        return human_roles
    
    def get_waiting_human_roles(self):
        """获取当前等待输入的人类角色列表"""
        waiting_roles = []
        for agent in self.agents:
            if hasattr(agent, 'is_human') and agent.is_human and agent.is_waiting_for_input():
                waiting_roles.append({
                    "name": agent.name,
                    "role": agent.role_description
                })
        return waiting_roles
    
    def add_human_message(self, agent_name, message):
        """添加人类角色的消息"""
        # 查找人类智能体
        for agent in self.agents:
            if agent.name == agent_name and hasattr(agent, 'is_human') and agent.is_human:
                # 添加消息
                agent.add_message(message)
                
                # 添加到会议历史
                self.add_message(agent_name, message)
                
                # 重置等待状态
                if hasattr(agent, 'is_waiting_input'):
                    agent.is_waiting_input = False
                    if hasattr(agent, 'input_start_time'):
                        agent.input_start_time = None
                
                # 清除会议等待状态
                if hasattr(self, 'waiting_for_human_input'):
                    self.waiting_for_human_input = None
                
                # 确保会议状态为"进行中"
                if self.status == "等待人类输入":
                    self.status = "进行中"
                    logger.info(f"会议状态从'等待人类输入'更改为'进行中'，会议ID={self.id}")
                
                # 如果此人类角色是当前发言者，处理其回应并移动到下一位发言者
                if self.current_speaker_index < len(self.agents) and self.agents[self.current_speaker_index].name == agent_name:
                    # 处理响应并移动到下一个发言者
                    logger.info(f"人类 {agent_name} 是当前发言者，处理其响应并移到下一位")
                    self.handle_agent_response(agent, message)
                else:
                    # 如果需要，记录来自非当前发言者的人类输入
                    logger.info(f"收到非当前发言者 {agent_name} 的输入，会议ID={self.id}")
                    
                    # 尝试更新轮次和发言顺序，确保会议可以继续
                    # 查找该人类角色在发言序列中的位置
                    for i, spk in enumerate(self.agents):
                        if spk.name == agent_name:
                            logger.info(f"将当前发言位置从 {self.current_speaker_index} 更新为 {(i+1)%len(self.agents)}")
                            # 将当前发言位置设置为该人类角色的下一位
                            self.current_speaker_index = (i + 1) % len(self.agents)
                            # 如果轮次完成，增加轮次计数
                            if self.current_speaker_index == 0:
                                self.current_round += 1
                                logger.info(f"人类发言后完成一轮，会议 {self.id} 进入第 {self.current_round} 轮")
                            break
                
                # 确保会议状态保持在"进行中"
                self.status = "进行中"
                logger.info(f"已成功处理人类角色 {agent_name} 的输入，会议ID={self.id}，当前轮次={self.current_round}, 当前发言索引={self.current_speaker_index}")
                return True
        
        # 如果没有找到对应的人类角色
        logger.warning(f"未找到人类角色: {agent_name}，会议ID={self.id}")
        return False
    
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
            
            # 检查是否有人类参与者
            if hasattr(current_speaker, 'is_human') and current_speaker.is_human:
                # 设置人类参与者等待输入状态
                current_speaker.wait_for_input()
                logger.info(f"等待人类角色 {current_speaker.name} 的输入")
                
                # 对于人类参与者，返回等待状态
                return {
                    "success": True,
                    "message": "等待人类输入",
                    "meeting_id": self.id,
                    "round": self.current_round,
                    "speaker": current_speaker.name,
                    "content": f"等待 {current_speaker.name} 的输入...",
                    "is_finished": False,
                    "next_speaker": current_speaker.name,  # 下一个发言者仍是当前人类
                    "waiting_for_human": True
                }
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
            
            # 检查是否达到结束条件 - 但要确保当前轮次是真正完成的
            if self._check_end_conditions() and self.current_round > self.max_rounds:
                logger.info(f"会议 {self.id} 达到结束条件，自动结束会议")
                self._end_meeting()
            
            # 特别检查：如果当前轮次大于最大轮次（说明所有轮次已完成），主动结束会议
            if self.current_round > self.max_rounds:
                logger.info(f"会议 {self.id} 已完成所有轮次 ({self.max_rounds} 轮)，自动结束会议")
                if self.status != "已结束":
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

    def _check_end_conditions(self) -> bool:
        """检查会议是否应该结束"""
        # 只有当当前轮次大于最大轮次时，才结束会议
        # 这确保到达最大轮次时，依然完成最后一轮发言
        if self.current_round > self.max_rounds:
            logger.info(f"会议 {self.id} 当前轮次 {self.current_round} 大于最大轮次 {self.max_rounds}，应结束会议")
            return True
            
        # 检查模式特定的结束条件（如果有）
        if hasattr(self.mode, 'should_end_meeting') and callable(getattr(self.mode, 'should_end_meeting')):
            if self.mode.should_end_meeting(self.current_round - 1, self.history):
                logger.info(f"会议 {self.id} 满足模式特定的结束条件，应结束会议")
                return True
                
        return False

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
        prev_index = self.current_speaker_index
        self.current_speaker_index = (self.current_speaker_index + 1) % len(self.agents)
        
        # 注释掉自动增加轮次的逻辑，现在由discussion_processor管理轮次
        # 如果已经循环一轮，增加轮次计数
        # if self.current_speaker_index == 0:
        #     self.current_round += 1
        #     logger.info(f"会议 {self.id} 进入第 {self.current_round} 轮")
        
        logger.info(f"会议 {self.id} 发言者从 {prev_index} 移动到 {self.current_speaker_index}")
        
        # 如果回到第一个发言者，记录但不增加轮次
        if self.current_speaker_index == 0:
            logger.info(f"会议 {self.id} 已循环完成一轮发言，等待由讨论处理器管理轮次增加")

    def get_history(self) -> List[Dict[str, Any]]:
        """
        获取会议历史记录
        
        返回:
            List[Dict[str, Any]]: 会议历史记录列表
        """
        return self.history
    
    def _check_consensus_reached(self) -> bool:
        """
        Checks if a consensus has been reached among AI participants.
        Consensus is determined by analyzing the last round of statements from all AI agents.
        """
        # Filter for active, non-human AI agents
        ai_agents = [agent for agent in self.agents if not (hasattr(agent, 'is_human') and agent.is_human)]

        if len(ai_agents) < 2:
            # Consensus is typically meaningful with 2 or more AI participants.
            return False

        if self.current_round <= 1 and len(ai_agents) > 0: # Only check after the first round for AI agents
            return False

        # Get the names of all AI agents
        ai_agent_names = [agent.name for agent in ai_agents]

        # Collect the last messages from each AI agent in the most recent round of discussion
        # We need to find messages from the current_round - 1 if current_speaker_index is 0,
        # or current_round if current_speaker_index > 0, to ensure we are looking at the completed last round.
        
        # Determine which round to check based on current_speaker_index
        # If current_speaker_index is 0, it means a full round has just completed (round number already incremented).
        # So, we look at messages from `self.current_round - 1`.
        # Otherwise, the current round is still in progress, so we look at `self.current_round`.
        # However, consensus should be checked on a *completed* round of发言.
        # The logic in discussion_processor.py updates self.current_round *after* a full round of AI speech.
        # So, we should look for messages from `self.current_round -1` if it's > 0.
        # If `self.current_round` is 1, it means no full round has completed yet.
        
        round_to_check = self.current_round -1
        if round_to_check == 0: # No full round completed by AIs yet.
            return False

        last_ai_messages = {}
        # Iterate backwards through history to find the latest message from each AI in the target round
        for message in reversed(self.history):
            agent_name = message.get("agent")
            message_round = message.get("round") # Assuming messages are tagged with their round

            if agent_name in ai_agent_names and message_round == round_to_check:
                if agent_name not in last_ai_messages:
                    last_ai_messages[agent_name] = message.get("content", "").lower()
            
            # If we've found messages for all AIs, we can stop
            if len(last_ai_messages) == len(ai_agent_names):
                break
        
        # If not all AI agents spoke in the last round, consensus cannot be determined
        if len(last_ai_messages) < len(ai_agent_names):
            logger.info(f"Consensus check: Not all AI agents spoke in round {round_to_check}. Found {len(last_ai_messages)} messages out of {len(ai_agent_names)} AIs.")
            return False

        # Define keywords that indicate agreement or similar conclusions
        agreement_keywords = [
            "agree", "consensus", "same conclusion", "similar view", "support this",
            "concur", "affirm", "likewise", "joint understanding", "shared perspective",
            "no objections", "settled on this", "we're aligned", "that's correct", "i'm with you"
        ]
        
        # Check if all last AI messages contain at least one agreement keyword
        # This is a simplified check; more sophisticated NLP could be used.
        all_agree = True
        for agent_name, msg_content in last_ai_messages.items():
            if not any(keyword in msg_content for keyword in agreement_keywords):
                all_agree = False
                logger.info(f"Consensus check: Agent {agent_name}'s message in round {round_to_check} did not indicate agreement. Message: '{msg_content[:100]}...'")
                break
        
        if all_agree:
            logger.info(f"Consensus reached among AI agents in round {round_to_check}.")
            return True
            
        return False