from app.processors.role_processor import RoleProcessor
from app.processors.discussion_processor import DiscussionProcessor

@app.post("/api/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """处理聊天请求"""
    try:
        model_id = request.model_id
        
        # 处理角色请求
        if isinstance(model_id, str) and model_id.startswith("role_"):
            role_id = int(model_id.replace("role_", ""))
            processor = RoleProcessor(db, role_id)
            return await processor.process_request(request.prompt, stream=False)
        
        # 处理讨论组请求
        elif isinstance(model_id, str) and model_id.startswith("group_"):
            group_id = int(model_id.replace("group_", ""))
            processor = DiscussionProcessor(db, group_id)
            return await processor.process_request(request.prompt, stream=False)
        
        # 处理常规模型请求
        else:
            # 现有的处理逻辑
            pass
    except Exception as e:
        logger.error(f"处理聊天请求失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    """处理流式聊天请求"""
    try:
        model_id = request.model_id
        
        # 处理角色请求
        if isinstance(model_id, str) and model_id.startswith("role_"):
            role_id = int(model_id.replace("role_", ""))
            processor = RoleProcessor(db, role_id)
            return StreamingResponse(
                processor.process_request(request.prompt, stream=True),
                media_type="text/event-stream"
            )
        
        # 处理讨论组请求
        elif isinstance(model_id, str) and model_id.startswith("group_"):
            group_id = int(model_id.replace("group_", ""))
            processor = DiscussionProcessor(db, group_id)
            return StreamingResponse(
                processor.process_request(request.prompt, stream=True),
                media_type="text/event-stream"
            )
        
        # 处理常规模型请求
        else:
            # 现有的处理逻辑
            pass
    except Exception as e:
        logger.error(f"处理流式聊天请求失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 