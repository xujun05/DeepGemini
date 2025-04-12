import traceback
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import json

from app.models.database import get_db
from app.adapters.meeting_adapter import MeetingAdapter
from app.processors.discussion_processor import DiscussionProcessor

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

@router.get("/stream/{meeting_id}")
async def continue_stream_discussion(meeting_id: str, db: Session = Depends(get_db)):
    """继续进行流式讨论过程（从当前状态继续）"""
    processor = DiscussionProcessor(db)
    processor.adapter = MeetingAdapter(db)
    # 设置当前会议ID
    processor.current_meeting_id = meeting_id
    
    try:
        logger.info(f"继续会议流程: meeting_id={meeting_id}")
        
        # 返回流式响应，直接使用处理器的_stream_discussion_process方法
        return StreamingResponse(
            processor._stream_discussion_process(meeting_id),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"继续流式讨论过程时出错: {str(e)}", exc_info=True)
        
        # 创建错误流
        async def error_stream():
            error_data = {
                "error": str(e),
                "detail": traceback.format_exc()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
            
        return StreamingResponse(error_stream(), media_type="text/event-stream")

@router.post("/{meeting_id}/human_input", response_model=Dict[str, Any])
def submit_human_input(
    meeting_id: str,
    agent_name: str = Body(...),
    message: str = Body(...),
    db: Session = Depends(get_db)
):
    """提交人类角色的输入 - 直接使用discussion_processor处理"""
    # 使用DiscussionProcessor处理人类输入
    processor = DiscussionProcessor(db)
    
    try:
        # 设置当前会议ID
        processor.current_meeting_id = meeting_id
        
        # 如果需要兼容性，初始化adapter
        if not processor.adapter:
            processor.adapter = MeetingAdapter(db)
            
        # 使用processor的方法处理人类输入
        result = processor.process_human_input(meeting_id, agent_name, message)
        return result
    except ValueError as e:
        # 处理常见错误，如会议不存在或人类智能体不存在
        logger.error(f"处理人类输入失败: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # 处理其他错误
        logger.error(f"处理人类输入时出错: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"处理人类输入失败: {str(e)}")

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