from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
import json
import traceback
from fastapi.responses import StreamingResponse

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
    # 验证必要字段
    required_fields = ["name", "mode", "role_ids"]
    for field in required_fields:
        if field not in group_data:
            raise HTTPException(status_code=400, detail=f"缺少必要字段: {field}")
    
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

@router.post("/stream/{group_id}")
async def stream_discussion_process(group_id: int, request: Request, db: Session = Depends(get_db)):
    """开始流式讨论过程"""
    processor = DiscussionProcessor(db)
    
    try:
        # 开始会议
        meeting_id = processor.start_meeting(group_id)
        
        # 返回流式响应
        return StreamingResponse(
            processor._stream_discussion_process(meeting_id),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"启动流式讨论过程时出错: {str(e)}", exc_info=True)
        
        # 创建错误流
        async def error_stream():
            error_data = {
                "error": str(e),
                "detail": traceback.format_exc()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
            
        return StreamingResponse(error_stream(), media_type="text/event-stream") 