from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging

from app.models.database import get_db
from app.adapters.meeting_adapter import MeetingAdapter

router = APIRouter(
    prefix="/api/meeting",
    tags=["meeting"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# ===== 角色管理 =====

@router.post("/roles", response_model=Dict[str, Any])
def create_role(
    name: str = Body(...),
    description: str = Body(...),
    model_id: int = Body(...),
    personality: Optional[str] = Body(None),
    skills: Optional[List[str]] = Body(None),
    parameters: Optional[Dict[str, Any]] = Body(None),
    system_prompt: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    """创建新角色"""
    adapter = MeetingAdapter(db)
    return adapter.create_role(
        name=name,
        description=description,
        model_id=model_id,
        personality=personality,
        skills=skills,
        parameters=parameters,
        system_prompt=system_prompt
    )

@router.get("/roles", response_model=List[Dict[str, Any]])
def get_all_roles(db: Session = Depends(get_db)):
    """获取所有角色列表"""
    adapter = MeetingAdapter(db)
    return adapter.get_all_roles()

@router.get("/roles/{role_id}", response_model=Dict[str, Any])
def get_role(role_id: int, db: Session = Depends(get_db)):
    """获取角色详情"""
    adapter = MeetingAdapter(db)
    return adapter.get_role(role_id)

@router.put("/roles/{role_id}", response_model=Dict[str, Any])
def update_role(
    role_id: int,
    name: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    model_id: Optional[int] = Body(None),
    personality: Optional[str] = Body(None),
    skills: Optional[List[str]] = Body(None),
    parameters: Optional[Dict[str, Any]] = Body(None),
    system_prompt: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    """更新角色信息"""
    adapter = MeetingAdapter(db)
    return adapter.update_role(
        role_id=role_id,
        name=name,
        description=description,
        model_id=model_id,
        personality=personality,
        skills=skills,
        parameters=parameters,
        system_prompt=system_prompt
    )

@router.delete("/roles/{role_id}", response_model=Dict[str, Any])
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """删除角色"""
    adapter = MeetingAdapter(db)
    return adapter.delete_role(role_id)

# ===== 讨论组管理 =====

@router.post("/groups", response_model=Dict[str, Any])
def create_discussion_group(
    name: str = Body(...),
    description: str = Body(...),
    mode: str = Body(...),
    max_rounds: int = Body(3),
    role_ids: List[int] = Body(...),
    db: Session = Depends(get_db)
):
    """创建新讨论组"""
    adapter = MeetingAdapter(db)
    return adapter.create_discussion_group(
        name=name,
        description=description,
        mode=mode,
        max_rounds=max_rounds,
        role_ids=role_ids
    )

@router.get("/groups", response_model=List[Dict[str, Any]])
def get_all_discussion_groups(db: Session = Depends(get_db)):
    """获取所有讨论组列表"""
    adapter = MeetingAdapter(db)
    return adapter.get_all_discussion_groups()

@router.get("/groups/{group_id}", response_model=Dict[str, Any])
def get_discussion_group(group_id: int, db: Session = Depends(get_db)):
    """获取讨论组详情"""
    adapter = MeetingAdapter(db)
    return adapter.get_discussion_group(group_id)

@router.put("/groups/{group_id}", response_model=Dict[str, Any])
def update_discussion_group(
    group_id: int,
    name: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    mode: Optional[str] = Body(None),
    max_rounds: Optional[int] = Body(None),
    role_ids: Optional[List[int]] = Body(None),
    db: Session = Depends(get_db)
):
    """更新讨论组信息"""
    adapter = MeetingAdapter(db)
    return adapter.update_discussion_group(
        group_id=group_id,
        name=name,
        description=description,
        mode=mode,
        max_rounds=max_rounds,
        role_ids=role_ids
    )

@router.delete("/groups/{group_id}", response_model=Dict[str, Any])
def delete_discussion_group(group_id: int, db: Session = Depends(get_db)):
    """删除讨论组"""
    adapter = MeetingAdapter(db)
    return adapter.delete_discussion_group(group_id)

# ===== 讨论功能 =====

@router.post("/discussions", response_model=Dict[str, Any])
def start_discussion(
    group_id: int = Body(...),
    topic: str = Body(...),
    db: Session = Depends(get_db)
):
    """启动讨论组会议"""
    adapter = MeetingAdapter(db)
    return adapter.start_discussion(group_id, topic)

@router.post("/discussions/{meeting_id}/round", response_model=Dict[str, Any])
def conduct_discussion_round(meeting_id: str, db: Session = Depends(get_db)):
    """进行一轮讨论"""
    adapter = MeetingAdapter(db)
    return adapter.conduct_discussion_round(meeting_id)

@router.post("/discussions/{meeting_id}/end", response_model=Dict[str, Any])
def end_discussion(meeting_id: str, db: Session = Depends(get_db)):
    """结束讨论"""
    adapter = MeetingAdapter(db)
    return adapter.end_discussion(meeting_id) 