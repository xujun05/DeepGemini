from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from app.models.database import get_db
from app.adapters.meeting_adapter import MeetingAdapter

router = APIRouter(
    prefix="/v1/discussions",
    tags=["discussions"],
)

logger = logging.getLogger(__name__)

@router.post("/{group_id}/start", response_model=Dict[str, Any])
def start_discussion(
    group_id: int, 
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """启动一个新的讨论"""
    adapter = MeetingAdapter(db)
    
    try:
        topic = data.get("topic", "")
        if not topic:
            raise HTTPException(status_code=400, detail="讨论主题不能为空")
        
        meeting_id = adapter.start_meeting(group_id, topic)
        return {"meeting_id": meeting_id, "message": "讨论已启动"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"启动讨论失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动讨论失败: {str(e)}")

@router.get("/{group_id}/info", response_model=Dict[str, Any])
def get_discussion_group_info(
    group_id: int,
    db: Session = Depends(get_db)
):
    """获取讨论组信息"""
    adapter = MeetingAdapter(db)
    
    try:
        group = adapter._load_discussion_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail=f"讨论组ID {group_id} 不存在")
        
        return adapter._group_to_dict(group)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"获取讨论组信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取讨论组信息失败: {str(e)}") 