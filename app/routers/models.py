from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging

from app.models.database import get_db, Model, Role, DiscussionGroup
from app.models.schemas import Model as ModelSchema, ModelCreate
from app.processors.role_processor import RoleProcessor
from app.processors.discussion_processor import DiscussionProcessor

router = APIRouter(
    prefix="/models",
    tags=["models"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

@router.get("/", response_model=List[Dict[str, Any]])
def get_all_models(db: Session = Depends(get_db)):
    """获取所有模型，包括角色和讨论组"""
    # 获取常规模型
    models = db.query(Model).all()
    result = []
    
    for model in models:
        result.append({
            "id": model.id,
            "name": model.name,
            "type": model.type,
            "provider": model.provider,
            "model_type": "model"  # 标记为常规模型
        })
    
    # 获取角色
    roles = db.query(Role).all()
    for role in roles:
        result.append({
            "id": f"role_{role.id}",  # 添加前缀以区分
            "name": f"角色: {role.name}",
            "type": "both",  # 角色可以用于推理和执行
            "provider": "deepgemini",
            "model_type": "role"  # 标记为角色
        })
    
    # 获取讨论组
    groups = db.query(DiscussionGroup).all()
    for group in groups:
        result.append({
            "id": f"group_{group.id}",  # 添加前缀以区分
            "name": f"讨论组: {group.name}",
            "type": "both",  # 讨论组可以用于推理和执行
            "provider": "deepgemini",
            "model_type": "discussion_group"  # 标记为讨论组
        })
    
    return result

# 其他现有的模型路由... 