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