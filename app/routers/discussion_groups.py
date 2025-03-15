from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.models.database import get_db
from app.processors.discussion_processor import DiscussionProcessor

router = APIRouter(
    prefix="/v1/discussion_groups",
    tags=["discussion_groups"],
)

logger = logging.getLogger(__name__)

@router.get("", response_model=List[Dict[str, Any]])
def get_discussion_groups(db: Session = Depends(get_db)):
    """获取所有讨论组"""
    processor = DiscussionProcessor(db)
    try:
        return processor.get_groups()
    except Exception as e:
        logger.error(f"获取讨论组失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取讨论组失败: {str(e)}")

@router.get("/{group_id}", response_model=Dict[str, Any])
def get_discussion_group(group_id: int, db: Session = Depends(get_db)):
    """获取特定讨论组"""
    processor = DiscussionProcessor(db)
    try:
        group = processor.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
        return group
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取讨论组 {group_id} 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取讨论组失败: {str(e)}")

@router.post("", response_model=Dict[str, Any])
def create_discussion_group(group_data: Dict[str, Any], db: Session = Depends(get_db)):
    """创建新讨论组"""
    processor = DiscussionProcessor(db)
    try:
        return processor.create_group(group_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"创建讨论组失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建讨论组失败: {str(e)}")

@router.put("/{group_id}", response_model=Dict[str, Any])
def update_discussion_group(group_id: int, group_data: Dict[str, Any], db: Session = Depends(get_db)):
    """更新讨论组"""
    processor = DiscussionProcessor(db)
    try:
        group = processor.update_group(group_id, group_data)
        if not group:
            raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
        return group
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新讨论组 {group_id} 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新讨论组失败: {str(e)}")

@router.delete("/{group_id}", response_model=Dict[str, str])
def delete_discussion_group(group_id: int, db: Session = Depends(get_db)):
    """删除讨论组"""
    processor = DiscussionProcessor(db)
    try:
        success = processor.delete_group(group_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
        return {"message": "讨论组已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除讨论组 {group_id} 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除讨论组失败: {str(e)}") 