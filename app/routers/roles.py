from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.models.database import get_db
from app.processors.role_processor import RoleProcessor

router = APIRouter(
    prefix="/v1/roles",
    tags=["roles"],
)

logger = logging.getLogger(__name__)

@router.get("", response_model=List[Dict[str, Any]])
def get_roles(db: Session = Depends(get_db)):
    """获取所有角色"""
    processor = RoleProcessor(db)
    try:
        return processor.get_roles()
    except Exception as e:
        logger.error(f"获取角色失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取角色失败: {str(e)}")

@router.get("/{role_id}", response_model=Dict[str, Any])
def get_role(role_id: int, db: Session = Depends(get_db)):
    """获取特定角色"""
    processor = RoleProcessor(db)
    try:
        role = processor.get_role(role_id)
        if not role:
            raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
        return role
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取角色 {role_id} 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取角色失败: {str(e)}")

@router.post("", response_model=Dict[str, Any])
def create_role(role_data: Dict[str, Any], db: Session = Depends(get_db)):
    """创建新角色"""
    processor = RoleProcessor(db)
    try:
        return processor.create_role(role_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"创建角色失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建角色失败: {str(e)}")

@router.put("/{role_id}", response_model=Dict[str, Any])
def update_role(role_id: int, role_data: Dict[str, Any], db: Session = Depends(get_db)):
    """更新角色"""
    processor = RoleProcessor(db)
    try:
        role = processor.update_role(role_id, role_data)
        if not role:
            raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
        return role
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新角色 {role_id} 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新角色失败: {str(e)}")

@router.delete("/{role_id}", response_model=Dict[str, str])
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """删除角色"""
    processor = RoleProcessor(db)
    try:
        success = processor.delete_role(role_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"角色ID {role_id} 不存在")
        return {"message": "角色已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除角色 {role_id} 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除角色失败: {str(e)}") 