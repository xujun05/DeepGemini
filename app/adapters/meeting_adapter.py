from typing import List, Dict, Any, Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
import logging
import json
import os

from app.models.database import Model as ModelConfiguration, Role, DiscussionGroup
from app.meeting.meeting import Meeting as MeetingSession
from app.meeting.agents.agent import Agent as MeetingAgent
from app.meeting.meeting_modes.discussion import DiscussionMode
from app.meeting.meeting_modes.brainstorming import BrainstormingMode
from app.meeting.meeting_modes.debate import DebateMode
from app.meeting.meeting_modes.role_playing import RolePlayingMode
from app.meeting.meeting_modes.swot_analysis import SWOTAnalysisMode
from app.meeting.meeting_modes.six_thinking_hats import SixThinkingHatsMode
from app.meeting.utils.summary_generator import SummaryGenerator
from app.meeting.meeting_modes.base_mode import BaseMeetingMode

logger = logging.getLogger(__name__)

class MeetingAdapter:
    """
    适配器类，用于将DeepGemini的模型系统与会议系统整合
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.mode_classes = {
            "discussion": DiscussionMode,
            "brainstorming": BrainstormingMode,
            "debate": DebateMode,
            "role_playing": RolePlayingMode,
            "swot_analysis": SWOTAnalysisMode,
            "six_thinking_hats": SixThinkingHatsMode
        }
        self.active_meetings = {}  # 存储活跃的会议会话
    
    # ===== 角色管理功能 =====
    
    def create_role(self, name: str, description: str, model_id: int, 
                   personality: str = None, skills: List[str] = None,
                   parameters: Dict[str, Any] = None, 
                   system_prompt: str = None) -> Dict[str, Any]:
        """创建新角色"""
        try:
            # 检查模型是否存在
            model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == model_id).first()
            if not model:
                raise HTTPException(status_code=404, detail=f"模型ID {model_id} 不存在")
            
            # 创建新角色
            new_role = Role(
                name=name,
                description=description,
                model_id=model_id,
                personality=personality,
                skills=skills or [],
                parameters=parameters or {},
                system_prompt=system_prompt,
                created_at=datetime.now()
            )
            
            self.db.add(new_role)
            self.db.commit()
            self.db.refresh(new_role)
            
            return {
                "id": new_role.id,
                "name": new_role.name,
                "description": new_role.description,
                "model_id": new_role.model_id,
                "model_name": model.name,
                "personality": new_role.personality,
                "skills": new_role.skills,
                "parameters": new_role.parameters,
                "system_prompt": new_role.system_prompt,
                "created_at": new_role.created_at.isoformat()
            }
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建角色失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"创建角色失败: {str(e)}")
    
    def get_all_roles(self) -> List[Dict[str, Any]]:
        """获取所有角色列表"""
        try:
            roles = self.db.query(Role).order_by(Role.created_at.desc()).all()
            
            result = []
            for role in roles:
                model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == role.model_id).first()
                
                role_data = {
                    "id": role.id,
                    "name": role.name,
                    "description": role.description,
                    "model_id": role.model_id,
                    "model_name": model.name if model else None,
                    "personality": role.personality,
                    "skills": role.skills,
                    "created_at": role.created_at.isoformat()
                }
                
                result.append(role_data)
            
            return result
        except Exception as e:
            logger.error(f"获取角色列表失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"获取角色列表失败: {str(e)}")
    
    def get_role(self, role_id: int) -> Dict[str, Any]:
        """获取角色详情"""
        try:
            role = self.db.query(Role).filter(Role.id == role_id).first()
            
            if not role:
                raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
            
            model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == role.model_id).first()
            
            return {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "model_id": role.model_id,
                "model_name": model.name if model else None,
                "personality": role.personality,
                "skills": role.skills,
                "parameters": role.parameters,
                "system_prompt": role.system_prompt,
                "created_at": role.created_at.isoformat(),
                "updated_at": role.updated_at.isoformat() if role.updated_at else None
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取角色详情失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"获取角色详情失败: {str(e)}")
    
    def update_role(self, role_id: int, name: str = None, description: str = None,
                   model_id: int = None, personality: str = None, 
                   skills: List[str] = None, parameters: Dict[str, Any] = None,
                   system_prompt: str = None) -> Dict[str, Any]:
        """更新角色信息"""
        try:
            role = self.db.query(Role).filter(Role.id == role_id).first()
            
            if not role:
                raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
            
            # 更新角色信息
            if name is not None:
                role.name = name
            if description is not None:
                role.description = description
            if model_id is not None:
                # 检查模型是否存在
                model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == model_id).first()
                if not model:
                    raise HTTPException(status_code=404, detail=f"模型ID {model_id} 不存在")
                role.model_id = model_id
            if personality is not None:
                role.personality = personality
            if skills is not None:
                role.skills = skills
            if parameters is not None:
                role.parameters = parameters
            if system_prompt is not None:
                role.system_prompt = system_prompt
            
            role.updated_at = datetime.now()
            self.db.commit()
            self.db.refresh(role)
            
            model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == role.model_id).first()
            
            return {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "model_id": role.model_id,
                "model_name": model.name if model else None,
                "personality": role.personality,
                "skills": role.skills,
                "parameters": role.parameters,
                "system_prompt": role.system_prompt,
                "created_at": role.created_at.isoformat(),
                "updated_at": role.updated_at.isoformat()
            }
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新角色失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"更新角色失败: {str(e)}")
    
    def delete_role(self, role_id: int) -> Dict[str, Any]:
        """删除角色"""
        try:
            role = self.db.query(Role).filter(Role.id == role_id).first()
            
            if not role:
                raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
            
            # 检查角色是否被讨论组使用
            if role.discussion_groups:
                group_names = [group.name for group in role.discussion_groups]
                raise HTTPException(status_code=400, 
                                  detail=f"无法删除角色，该角色正在被以下讨论组使用: {', '.join(group_names)}")
            
            self.db.delete(role)
            self.db.commit()
            
            return {"message": f"角色 '{role.name}' 已成功删除"}
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除角色失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"删除角色失败: {str(e)}")
    
    # ===== 讨论组管理功能 =====
    
    def create_discussion_group(self, name: str, description: str, mode: str,
                               role_ids: List[int], max_rounds: int = None) -> Dict[str, Any]:
        """创建新讨论组"""
        try:
            # 检查会议模式是否有效
            if mode not in self.mode_classes:
                raise HTTPException(status_code=400, detail=f"无效的会议模式: {mode}")
            
            # 检查角色是否存在
            roles = []
            for role_id in role_ids:
                role = self.db.query(Role).filter(Role.id == role_id).first()
                if not role:
                    raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
                roles.append(role)
            
            # 创建新讨论组
            new_group = DiscussionGroup(
                name=name,
                description=description,
                mode=mode,
                max_rounds=max_rounds or 3,
                created_at=datetime.now()
            )
            
            # 添加角色
            for role in roles:
                new_group.roles.append(role)
            
            self.db.add(new_group)
            self.db.commit()
            self.db.refresh(new_group)
            
            return {
                "id": new_group.id,
                "name": new_group.name,
                "description": new_group.description,
                "mode": new_group.mode,
                "max_rounds": new_group.max_rounds,
                "created_at": new_group.created_at.isoformat(),
                "roles": [{"id": role.id, "name": role.name} for role in new_group.roles]
            }
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建讨论组失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"创建讨论组失败: {str(e)}")
    
    def get_all_discussion_groups(self) -> List[Dict[str, Any]]:
        """获取所有讨论组列表"""
        try:
            groups = self.db.query(DiscussionGroup).order_by(DiscussionGroup.created_at.desc()).all()
            
            result = []
            for group in groups:
                group_data = {
                    "id": group.id,
                    "name": group.name,
                    "description": group.description,
                    "mode": group.mode,
                    "max_rounds": group.max_rounds,
                    "created_at": group.created_at.isoformat(),
                    "role_count": len(group.roles)
                }
                
                result.append(group_data)
            
            return result
        except Exception as e:
            logger.error(f"获取讨论组列表失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"获取讨论组列表失败: {str(e)}")
    
    def get_discussion_group(self, group_id: int) -> Dict[str, Any]:
        """获取讨论组详情"""
        try:
            group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
            
            if not group:
                raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
            
            # 构建讨论组详情
            group_data = {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "mode": group.mode,
                "max_rounds": group.max_rounds,
                "created_at": group.created_at.isoformat(),
                "updated_at": group.updated_at.isoformat() if group.updated_at else None,
                "roles": []
            }
            
            # 获取角色详情
            for role in group.roles:
                model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == role.model_id).first()
                
                role_data = {
                    "id": role.id,
                    "name": role.name,
                    "description": role.description,
                    "model_id": role.model_id,
                    "model_name": model.name if model else None,
                    "personality": role.personality,
                    "skills": role.skills
                }
                
                group_data["roles"].append(role_data)
            
            return group_data
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取讨论组详情失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"获取讨论组详情失败: {str(e)}")
    
    def update_discussion_group(self, group_id: int, name: str = None, 
                               description: str = None, mode: str = None, 
                               role_ids: List[int] = None,
                               max_rounds: int = None) -> Dict[str, Any]:
        """更新讨论组信息"""
        try:
            group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
            
            if not group:
                raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
            
            # 更新讨论组信息
            if name is not None:
                group.name = name
            if description is not None:
                group.description = description
            if mode is not None:
                # 检查会议模式是否有效
                if mode not in self.mode_classes:
                    raise HTTPException(status_code=400, detail=f"无效的会议模式: {mode}")
                group.mode = mode
            if max_rounds is not None:
                group.max_rounds = max_rounds
            
            # 更新角色列表
            if role_ids is not None:
                # 检查角色是否存在
                roles = []
                for role_id in role_ids:
                    role = self.db.query(Role).filter(Role.id == role_id).first()
                    if not role:
                        raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
                    roles.append(role)
                
                # 清除现有角色
                group.roles = []
                
                # 添加新角色
                for role in roles:
                    group.roles.append(role)
            
            group.updated_at = datetime.now()
            self.db.commit()
            self.db.refresh(group)
            
            return {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "mode": group.mode,
                "max_rounds": group.max_rounds,
                "created_at": group.created_at.isoformat(),
                "updated_at": group.updated_at.isoformat(),
                "roles": [{"id": role.id, "name": role.name} for role in group.roles]
            }
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新讨论组失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"更新讨论组失败: {str(e)}")
    
    def delete_discussion_group(self, group_id: int) -> Dict[str, Any]:
        """删除讨论组"""
        try:
            group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
            
            if not group:
                raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
            
            self.db.delete(group)
            self.db.commit()
            
            return {"message": f"讨论组 '{group.name}' 已成功删除"}
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除讨论组失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"删除讨论组失败: {str(e)}")
    
    # ===== 会议功能 =====
    
    def start_meeting(self, group_id: int, topic: str) -> str:
        """启动会议"""
        try:
            # 查询讨论组
            group = self._load_discussion_group(group_id)
            
            # 获取讨论组相关信息 
            mode_name = group.mode
            max_rounds = group.max_rounds  # 使用数据库中的最大轮数

            # mode_name为six_thinking_hats时，max_rounds为6
            if mode_name == "six_thinking_hats":
                max_rounds = 6
            elif mode_name == "swot_analysis":
                max_rounds = 4
                
            # 创建会议模式
            mode_class = self.mode_classes.get(mode_name)
            if not mode_class:
                raise ValueError(f"不支持的会议模式: {mode_name}")
            
            meeting_mode = mode_class()
            
            # 创建会议ID
            meeting_id = str(uuid.uuid4())
            
            # 获取角色列表并创建智能体
            if not group.roles:
                raise ValueError("讨论组中没有角色")
            
            agents = []
            # 为每个角色创建智能体
            for role in group.roles:
                logger.info(f"处理角色: id={role.id}, name={role.name}")
                
                # 获取模型配置
                model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == role.model_id).first()
                if not model:
                    logger.error(f"角色模型配置不存在: role_id={role.id}, model_id={role.model_id}")
                    raise ValueError(f"角色 {role.name} 的模型配置不存在")
                
                logger.info(f"使用模型: id={model.id}, name={model.name}")
                
                # 获取模型API设置 - 修正属性名和URL处理
                api_url = getattr(model, 'api_url', None)
                api_key = getattr(model, 'api_key', None)
                
                # 处理URL，从完整URL中提取基础部分
                base_url = None
                if api_url:
                    # 如果URL包含/v1/chat/completions，则去掉这部分
                    if "/v1/chat/completions" in api_url:
                        base_url = api_url.split("/v1/chat/completions")[0]
                    else:
                        base_url = api_url
                
                logger.info(f"模型API设置: api_url={api_url or '未设置'}, 提取base_url={base_url or '未设置'}, api_key={'已设置' if api_key else '未设置'}")
                
                # 如果模型没有设置API基础URL，使用默认值
                if not base_url:
                    base_url = "http://localhost:8000"
                    logger.info(f"使用默认API基础URL: {base_url}")
                
                # 创建智能体
                agent = MeetingAgent(
                    name=role.name,
                    role_description=role.description,
                    personality=role.personality,
                    skills=role.skills,
                    model_params={
                        "model_name": model.name,
                        "base_url": base_url,  # 使用base_url而不是api_base
                        "api_key": api_key,
                        **role.parameters
                    }
                )
                agents.append(agent)
                logger.info(f"已创建智能体: {role.name} (使用模型: {model.name}, API基础URL: {base_url})")
            
            # 创建会议实例，确保传递所有必要参数
            meeting = MeetingSession(
                id=meeting_id,
                topic=topic,
                mode=meeting_mode,
                max_rounds=max_rounds
            )
            
            # 设置会议智能体
            meeting.agents = agents
            
            # 将会议组信息保存到会议对象
            meeting.group_info = self._group_to_dict(group)
            
            # 加入会议历史
            self.active_meetings[meeting_id] = meeting
            
            return meeting_id
        except Exception as e:
            logger.error(f"启动会议失败: {str(e)}", exc_info=True)
            raise
    
    def get_discussion_status(self, meeting_id: str) -> Dict[str, Any]:
        """获取讨论状态"""
        try:
            if meeting_id not in self.active_meetings:
                raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在或已结束")
            
            meeting_data = self.active_meetings[meeting_id]
            meeting = meeting_data["meeting"]
            
            return {
                "meeting_id": meeting_id,
                "topic": meeting.topic,
                "mode": meeting.mode.name,
                "group_id": meeting_data["group_id"],
                "status": meeting.status,
                "current_round": meeting.current_round,
                "start_time": meeting_data["start_time"].isoformat(),
                "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
                "history": meeting.meeting_history
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取讨论状态失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"获取讨论状态失败: {str(e)}")
    
    def conduct_discussion_round(self, meeting_id: str) -> Dict[str, Any]:
        """进行一轮讨论"""
        try:
            logger.info(f"开始执行讨论轮次: meeting_id={meeting_id}")
            
            meeting = self.active_meetings.get(meeting_id)
            if not meeting:
                logger.error(f"找不到会议: meeting_id={meeting_id}")
                raise ValueError(f"会议ID {meeting_id} 不存在")
            
            logger.info(f"找到会议: id={meeting_id}, 状态={meeting.status}, 当前轮次={meeting.current_round}")
            
            # 进行一轮讨论
            logger.info(f"开始执行一轮讨论")
            meeting.conduct_round()
            logger.info(f"讨论轮次完成: id={meeting_id}, 新状态={meeting.status}, 新轮次={meeting.current_round}")
            
            result = {
                "meeting_id": meeting_id,
                "current_round": meeting.current_round,
                "status": meeting.status
            }
            logger.info(f"返回讨论轮次结果: {result}")
            return result
        except Exception as e:
            logger.error(f"进行讨论轮次失败: {str(e)}", exc_info=True)
            raise
    
    async def end_meeting(self, meeting_id: str):
        """结束会议并生成总结"""
        # 获取会议
        meeting = self.active_meetings.get(meeting_id)
        if not meeting:
            raise ValueError(f"会议ID {meeting_id} 不存在")
        
        # 获取讨论组信息
        group = meeting.group_info
        
        # 获取自定义总结模型（如果有）
        summary_model = None
        api_key = None
        api_base_url = None
        
        if group and 'summary_model_id' in group and group['summary_model_id']:
            model_id = group['summary_model_id']
            summary_model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == model_id).first()
            
            if summary_model:
                # 获取API密钥和基础URL
                api_key = getattr(summary_model, 'api_key', None)
                api_url = getattr(summary_model, 'api_url', None)
                
                # 处理URL，从完整URL中提取基础部分
                if api_url:
                    if "/v1/chat/completions" in api_url:
                        api_base_url = api_url.split("/v1/chat/completions")[0]
                    else:
                        api_base_url = api_url
        
        # 获取自定义提示模板（如果有）
        custom_prompt = None
        if group and 'summary_prompt' in group and group['summary_prompt']:
            custom_prompt = group['summary_prompt']
        
        # 生成总结
        meeting_topic = meeting.topic
        meeting_history = meeting.meeting_history
        
        # 使用自定义模型和提示（如果有），否则使用默认
        if summary_model:
            model_name = summary_model.name
        else:
            model_name = None  # 使用默认值
        
        if custom_prompt:
            prompt_template = custom_prompt
        else:
            # 使用会议模式的默认提示模板
            prompt_template = meeting.mode.get_summary_prompt_template()
        
        # 调用总结生成器，传递API信息
        summary = SummaryGenerator.generate_summary(
            meeting_topic=meeting_topic,
            meeting_history=meeting_history,
            prompt_template=prompt_template,
            model_name=model_name,
            api_key=api_key,
            api_base_url=api_base_url
        )
        
        # 添加总结到会议历史
        meeting.add_message("system", summary)
        
        # 更新会议状态
        meeting.status = "已结束"
        meeting.end_time = datetime.now()
        
        # 确保返回的数据包含summary字段
        result = meeting.to_dict()
        if "summary" not in result:
            result["summary"] = summary
        
        return result

    def _load_discussion_group(self, group_id: int):
        """加载讨论组信息"""
        group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
        if not group:
            logger.error(f"讨论组不存在: group_id={group_id}")
            raise ValueError(f"讨论组ID {group_id} 不存在")
        
        logger.info(f"找到讨论组: {group.name}, 角色数量: {len(group.roles)}")
        return group

    def _group_to_dict(self, group) -> Dict[str, Any]:
        """将讨论组对象转换为字典"""
        group_data = {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "mode": group.mode,
            "max_rounds": group.max_rounds,
            "summary_model_id": getattr(group, "summary_model_id", None),
            "summary_prompt": getattr(group, "summary_prompt", None),
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None,
            "roles": []
        }
        
        # 添加角色信息
        for role in group.roles:
            role_data = {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "model_id": role.model_id
            }
            group_data["roles"].append(role_data)
        
        return group_data

    def create_meeting(self, meeting_id: str, group_id: int, topic: str, mode: str = None) -> Dict[str, Any]:
        """创建新会议"""
        try:
            # 加载讨论组
            group = self._load_discussion_group(group_id)
            
            # 确定会议模式
            if not mode:
                mode = group.mode if hasattr(group, 'mode') and group.mode else "discussion"
            
            # 获取讨论组的最大轮数
            group_max_rounds = group.max_rounds if hasattr(group, 'max_rounds') and group.max_rounds else 3
            
            # 创建会议模式
            meeting_mode = self._create_meeting_mode(mode, group_max_rounds)
            
            # 创建会议
            meeting = MeetingSession(
                id=meeting_id,
                topic=topic,
                mode=meeting_mode,
                max_rounds=group_max_rounds  # 从讨论组获取最大轮数
            )
            
            # 存储讨论组信息
            meeting.group_info = self._group_to_dict(group)
            
            return meeting.to_dict()
        except Exception as e:
            logger.error(f"创建会议失败: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"创建会议失败: {str(e)}")

    def _create_meeting_mode(self, mode_name: str, max_rounds: int = 3) -> BaseMeetingMode:
        """创建会议模式"""
        # 映射模式名称到类
        mode_classes = {
            "discussion": DiscussionMode,
            "brainstorming": BrainstormingMode,
            "debate": DebateMode,
            "role_playing": RolePlayingMode,
            "six_thinking_hats": SixThinkingHatsMode,
            "swot_analysis": SWOTAnalysisMode
        }
        
        # 获取模式类
        mode_class = mode_classes.get(mode_name.lower(), DiscussionMode)
        
        # 创建模式实例，传入最大轮数
        return mode_class(max_rounds=max_rounds) 