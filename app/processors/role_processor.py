from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import logging
import json
import time

from app.models.database import Role, Model
from app.meeting.agents.agent import Agent

logger = logging.getLogger(__name__)

class RoleProcessor:
    """角色处理器，用于管理角色数据"""
    
    def __init__(self, db: Session, role_id: Optional[int] = None):
        """
        初始化角色处理器
        
        参数:
            db: 数据库会话
            role_id: 可选的角色ID，用于单角色对话
        """
        self.db = db
        self.role_id = role_id
        self.model_adapter = None
    
    # 设置模型适配器方法    
    def set_model_adapter(self, adapter):
        """设置模型适配器"""
        self.model_adapter = adapter
    
    def get_roles(self) -> List[Dict[str, Any]]:
        """获取所有角色"""
        roles = self.db.query(Role).all()
        return [self._role_to_dict(role) for role in roles]
    
    def get_role(self, role_id: int) -> Optional[Dict[str, Any]]:
        """获取特定角色"""
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return None
        return self._role_to_dict(role)
    
    def create_role(self, role_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新角色"""
        # 检查是否为人类角色
        is_human = role_data.get('is_human', False)
        
        # 查找对应的模型
        if not is_human:
            # 非人类角色需要检查model_id
            model = self.db.query(Model).filter(Model.id == role_data.get('model_id')).first()
            if not model:
                raise ValueError(f"Model with ID {role_data.get('model_id')} not found")
        else:
            # 对于人类角色，如果没有指定model_id，使用默认值1
            if not role_data.get('model_id'):
                # 获取第一个可用模型作为默认值
                default_model = self.db.query(Model).first()
                if default_model:
                    role_data['model_id'] = default_model.id
                else:
                    # 如果没有任何模型，创建一个虚拟ID
                    role_data['model_id'] = 1
        
        # 创建角色
        role = Role(
            name=role_data.get('name'),
            description=role_data.get('description', ''),
            personality=role_data.get('personality', ''),
            skills=role_data.get('skills', []),
            system_prompt=role_data.get('system_prompt', ''),
            model_id=role_data.get('model_id'),
            parameters=role_data.get('parameters', {}),
            is_human=role_data.get('is_human', False),
            host_role_id=role_data.get('host_role_id')
        )
        
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        
        return self._role_to_dict(role)
    
    def update_role(self, role_id: int, role_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新角色"""
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return None
        
        # 更新角色属性
        if 'name' in role_data:
            role.name = role_data['name']
        if 'description' in role_data:
            role.description = role_data['description']
        if 'personality' in role_data:
            role.personality = role_data['personality']
        if 'skills' in role_data:
            role.skills = role_data['skills']
        if 'system_prompt' in role_data:
            role.system_prompt = role_data['system_prompt']
        if 'model_id' in role_data:
            role.model_id = role_data['model_id']
        if 'parameters' in role_data:
            role.parameters = role_data['parameters']
        if 'is_human' in role_data:
            role.is_human = role_data['is_human']
        if 'host_role_id' in role_data:
            role.host_role_id = role_data['host_role_id']
        
        self.db.commit()
        self.db.refresh(role)
        
        return self._role_to_dict(role)
    
    def delete_role(self, role_id: int) -> bool:
        """删除角色"""
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return False
        
        self.db.delete(role)
        self.db.commit()
        
        return True
    
    def _role_to_dict(self, role: Role) -> Dict[str, Any]:
        """将角色对象转换为字典"""
        model = self.db.query(Model).filter(Model.id == role.model_id).first()
        
        # 获取寄生的角色信息（如果有）
        host_role = None
        if role.host_role_id:
            host_role = self.db.query(Role).filter(Role.id == role.host_role_id).first()
        
        return {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "personality": role.personality,
            "skills": role.skills,
            "system_prompt": role.system_prompt,
            "model_id": role.model_id,
            "model_name": model.name if model else None,
            "parameters": role.parameters,
            "is_human": role.is_human,
            "host_role_id": role.host_role_id,
            "host_role_name": host_role.name if host_role else None
        }
    
    def _load_role(self, role_id: int) -> Role:
        """加载角色信息"""
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise ValueError(f"角色ID {role_id} 不存在")
        return role
    
    def _load_model(self, role: Role) -> Model:
        """加载模型信息"""
        model = self.db.query(Model).filter(Model.id == role.model_id).first()
        if not model:
            raise ValueError(f"模型ID {role.model_id} 不存在")
        return model
    
    def _create_agent(self, role: Role) -> Agent:
        """创建智能体实例"""
        # 构建模型参数
        model_params = role.parameters or {}
        model_params["model_name"] = self._load_model(role).model_name
        
        # 创建智能体
        agent = Agent(
            name=role.name,
            role_description=role.description or "",
            personality=role.personality or "",
            skills=role.skills or [],
            model_params=model_params,
            base_url=self._load_model(role).api_url,
            api_key=self._load_model(role).api_key
        )
        
        return agent
    
    async def process_request(self, messages: List[Dict[str, Any]], stream: bool = False) -> Any:
        """处理请求"""
        try:
            # 如果是单角色对话模式
            if self.role_id:
                role = self.db.query(Role).filter(Role.id == self.role_id).first()
                if not role:
                    raise ValueError(f"角色ID {self.role_id} 不存在")
                    
                logger.info(f"处理单角色对话请求: role_id={self.role_id}, role_name={role.name}")
                # 后续处理单角色对话的逻辑...
                return await self._process_single_role_chat(role, messages, stream)
            else:
                pass
        except Exception as e:
            logger.error(f"处理角色请求失败: {str(e)}", exc_info=True)
            raise
    
    def _create_system_prompt(self, role: Role) -> str:
        """创建系统提示"""
        return f"""你是名为{role.name}的智能体。
角色描述: {role.description or ''}
性格特点: {role.personality or ''}
专业技能: {', '.join(role.skills or [])}

请根据你的角色特点和专业知识回答用户的问题。
"""
    
    def _process_normal_request(self, prompt: str, system_prompt: str) -> str:
        """处理普通请求"""
        # 设置系统提示
        agent = self._create_agent(self._load_role(prompt))
        agent.system_prompt = system_prompt
        
        # 处理请求
        response = agent.generate_response(prompt)
        return response
    
    async def _process_stream_request(self, prompt: str, system_prompt: str):
        """处理流式请求"""
        # 设置系统提示
        agent = self._create_agent(self._load_role(prompt))
        agent.system_prompt = system_prompt
        
        # 处理请求
        async for chunk in agent.generate_response_stream(prompt):
            yield chunk 

    async def _process_single_role_chat(self, role: Role, messages: List[Dict[str, Any]], stream: bool = False) -> Any:
        """
        处理单个角色的聊天对话
        
        参数:
            role: 角色对象
            messages: 聊天消息历史（可能是字典列表或字符串）
            stream: 是否使用流式响应
        
        返回:
            聊天响应或流式生成器
        """
        logger.info(f"处理单角色聊天: 角色={role.name}, 消息类型={type(messages)}")
        
        # 创建智能体
        agent = self._create_agent(role)
        
        # 设置系统提示
        system_prompt = role.system_prompt or self._create_role_system_prompt(role)
        agent.system_prompt = system_prompt
        
        # 处理不同类型的消息输入
        chat_messages = []
        
        # 单个字符串消息处理
        if isinstance(messages, str):
            logger.info("收到单个字符串消息，转换为标准格式")
            chat_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": messages}
            ]
        
        # 列表但元素是字符串
        elif isinstance(messages, list) and messages and isinstance(messages[0], str):
            logger.info("收到字符串列表，转换为标准格式")
            chat_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                chat_messages.append({"role": "user", "content": msg})
        
        # 标准格式消息列表
        elif isinstance(messages, list):
            for msg in messages:
                if isinstance(msg, dict):
                    # 标准格式消息
                    role_type = msg.get("role", "user")
                    content = msg.get("content", "")
                    
                    if not content:
                        continue
                    
                    chat_messages.append({
                        "role": role_type,
                        "content": content
                    })
                elif isinstance(msg, str):
                    # 字符串消息
                    chat_messages.append({
                        "role": "user",
                        "content": msg
                    })
        
        # 确保有至少一条消息
        if not chat_messages:
            logger.warning(f"没有有效的消息内容，使用默认问候")
            chat_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "你好"}
            ]
        
        logger.info(f"处理消息: 数量={len(chat_messages)}")
        
        # 处理请求
        if stream:
            logger.info("使用流式响应模式")
            return self._get_stream_chat_response(agent, chat_messages)  # 直接返回异步生成器，不使用await
        else:
            logger.info("使用非流式响应模式")
            return await self._get_normal_chat_response(agent, chat_messages)

    def _create_role_system_prompt(self, role: Role) -> str:
        """为角色创建系统提示"""
        return f"""你是名为{role.name}的智能体。
角色描述: {role.description or ''}
性格特点: {role.personality or ''}
专业技能: {', '.join(role.skills or [])}

请根据你的角色特点和专业知识回答用户的问题。
"""

    async def _get_normal_chat_response(self, agent: Agent, messages: List[Dict[str, Any]]) -> str:
        """获取普通聊天响应"""
        # 处理请求
        response = agent.generate_chat_response(messages)
        return response

    async def _get_stream_chat_response(self, agent: Agent, messages: List[Dict[str, Any]]):
        """获取流式聊天响应"""
        logger.info(f"开始流式响应生成，消息数量: {len(messages)}")
        
        # 生成一个唯一的响应ID
        chat_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
        created_time = int(time.time())
        model_name = agent.model_params.get("model_name", "unknown-model")
        
        # 发送角色信息
        first_chunk = True
        
        try:
            # 发送角色部分（仅一次）
            if first_chunk:
                role_data = {
                    "id": chat_id,
                    "object": "chat.completion.chunk",
                    "created": created_time,
                    "model": model_name,
                    "choices": [{
                        "index": 0,
                        "delta": {
                            "role": "assistant"
                        },
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(role_data)}\n\n".encode('utf-8')
                first_chunk = False
            
            # 流式发送内容
            async for chunk in agent.generate_chat_response_stream(messages):
                if chunk:
                    content_data = {
                        "id": chat_id,
                        "object": "chat.completion.chunk",
                        "created": created_time,
                        "model": model_name,
                        "choices": [{
                            "index": 0,
                            "delta": {
                                "content": chunk
                            },
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(content_data)}\n\n".encode('utf-8')
            
            # 发送完成信息
            finish_data = {
                "id": chat_id,
                "object": "chat.completion.chunk",
                "created": created_time,
                "model": model_name,
                "choices": [{
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop"
                }]
            }
            yield f"data: {json.dumps(finish_data)}\n\n".encode('utf-8')
            
            # 发送结束标记
            yield b"data: [DONE]\n\n"
            
            logger.info("流式响应完成")
        except Exception as e:
            logger.error(f"流式响应生成错误: {str(e)}", exc_info=True)
            raise 