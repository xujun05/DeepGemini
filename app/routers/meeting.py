from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
from fastapi.responses import StreamingResponse

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
    return {"meeting_id": adapter.start_meeting(group_id, topic), "message": "讨论已启动"}

@router.post("/discussions/{meeting_id}/round", response_model=Dict[str, Any])
def conduct_discussion_round(meeting_id: str, db: Session = Depends(get_db)):
    """进行一轮讨论"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"进行讨论轮次: meeting_id={meeting_id}")
    logger.info(f"活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        # 检查会议是否刚刚创建
        if meeting_id:
            adapter.active_meetings = {} # 尝试清空并重新加载
            
        logger.error(f"讨论轮次失败: 找不到会议ID {meeting_id}，当前活跃会议IDs: {list(adapter.active_meetings.keys())}")
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 输出会议数据结构信息
    logger.info(f"获取到会议数据: 类型={type(meeting_data)}, 键={list(meeting_data.keys())}")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}, 会议数据={meeting_data}")
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 记录会议对象类型，帮助调试
    logger.info(f"会议对象类型: {type(meeting)}, 状态: {meeting.status}, 轮次: {meeting.current_round}")
    
    # 调用讨论轮次
    try:
        result = adapter.conduct_discussion_round(meeting_id)
        logger.info(f"讨论轮次结果: {result}")
        return result
    except Exception as e:
        logger.error(f"执行讨论轮次时发生错误: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"执行讨论轮次失败: {str(e)}")

@router.get("/discussions/{meeting_id}/round", response_model=Dict[str, Any])
def get_discussion_round(
    meeting_id: str,
    db: Session = Depends(get_db)
):
    """获取讨论回合状态"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 记录会议对象类型，帮助调试
    logger.info(f"会议对象类型: {type(meeting)}")
    
    # 获取会议状态
    status = adapter.get_discussion_status(meeting_id)
    
    # 获取等待人类输入的角色
    waiting_roles = meeting.get_waiting_human_roles()
    
    return {
        "round": status.get("round", 1),
        "status": status.get("status", "进行中"),
        "waiting_for_human_input": waiting_roles
    }

@router.post("/discussions/{meeting_id}/end", response_model=Dict[str, Any])
async def end_discussion(meeting_id: str, db: Session = Depends(get_db)):
    """结束讨论会议"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    if meeting_id not in adapter.active_meetings:
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 结束会议
    result = await adapter.end_meeting(meeting_id)
    return result

# ===== 人类角色功能 =====

@router.post("/discussions/{meeting_id}/human_input", response_model=Dict[str, Any])
def submit_human_input(
    meeting_id: str,
    agent_name: str = Body(...),
    message: str = Body(...),
    db: Session = Depends(get_db)
):
    """提交人类角色的输入"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 添加人类消息
    success = meeting.add_human_message(agent_name, message)
    if not success:
        raise HTTPException(status_code=400, detail=f"无法为 {agent_name} 添加消息")
    
    # 输出会议状态
    logger.info(f"人类输入已添加: 会议ID={meeting_id}, 角色={agent_name}, 消息长度={len(message)}")
    
    return {
        "success": True,
        "message": f"{agent_name} 的消息已提交",
        "meeting_id": meeting_id
    }

@router.get("/discussions/{meeting_id}/human_roles", response_model=List[Dict[str, Any]])
def get_human_roles(meeting_id: str, db: Session = Depends(get_db)):
    """获取会议中的人类角色列表"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 输出会议对象类型，帮助调试
    logger.info(f"会议对象类型: {type(meeting)}")
    
    # 获取人类角色列表
    return meeting.get_human_roles()

@router.get("/discussions/{meeting_id}/messages", response_model=Dict[str, Any])
def get_meeting_messages(meeting_id: str, format: str = "standard", db: Session = Depends(get_db)):
    """获取会议消息历史"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        logger.error(f"找不到会议ID: {meeting_id}，当前活跃会议: {list(adapter.active_meetings.keys())}")
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}")
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 输出会议对象类型
    logger.info(f"会议对象类型: {type(meeting)}")
    
    # 获取消息历史
    history = meeting.get_meeting_history()
    
    # 添加角色等待状态
    waiting_for_agent = None
    for agent in meeting.agents:
        if hasattr(agent, 'is_human') and agent.is_human and agent.is_waiting_for_input():
            waiting_for_agent = agent.name
            break
    
    # 格式化消息供前端使用
    formatted_messages = []
    for msg in history:
        formatted_messages.append({
            "role": "user" if msg.get("agent") != "system" else "system",
            "content": msg.get("content", ""),
            "agent_name": msg.get("agent", "系统"),
            "timestamp": msg.get("timestamp", "")
        })
    
    return {
        "status": meeting.status,
        "waiting_for_human_input": waiting_for_agent is not None,
        "waiting_for_agent": waiting_for_agent,
        "messages": formatted_messages,
        "current_round": meeting.current_round,
        "max_rounds": meeting.max_rounds
    }

@router.get("/discussions/active", response_model=Dict[str, Any])
def get_active_meetings(db: Session = Depends(get_db)):
    """获取所有活跃会议列表"""
    adapter = MeetingAdapter(db)
    
    # 收集有关活跃会议的信息
    meetings_info = {}
    for meeting_id, meeting_data in adapter.active_meetings.items():
        meeting = meeting_data.get("meeting")
        if meeting:
            meetings_info[meeting_id] = {
                "topic": meeting.topic,
                "status": meeting.status,
                "current_round": meeting.current_round,
                "start_time": meeting_data.get("start_time").isoformat() if meeting_data.get("start_time") else None,
                "group_id": meeting_data.get("group_id")
            }
        else:
            meetings_info[meeting_id] = {"error": "会议对象不存在"}
    
    logger.info(f"当前活跃会议数量: {len(adapter.active_meetings)}, IDs: {list(adapter.active_meetings.keys())}")
    
    return {
        "count": len(adapter.active_meetings),
        "meetings": meetings_info
    }

@router.get("/discussions/{meeting_id}/stream", response_model=None)
async def stream_meeting_messages(meeting_id: str, db: Session = Depends(get_db)):
    """流式获取会议消息，用于实时显示"""
    adapter = MeetingAdapter(db)
    
    # 确保会议存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 开始流式响应
    return StreamingResponse(
        generate_meeting_stream(meeting, adapter, meeting_id),
        media_type="text/event-stream"
    )

async def generate_meeting_stream(meeting, adapter, meeting_id: str):
    """生成会议消息的流式响应"""
    import json
    import asyncio
    import time
    
    # 生成唯一会话ID
    conversation_id = f"chatcmpl-{hex(int(time.time() * 1000))[2:]}"
    created_time = int(time.time())
    
    # 发送会话开始事件
    start_event = {
        "id": conversation_id,
        "object": "chat.completion.chunk",
        "created": created_time,
        "model": "meeting-stream",
        "choices": [{
            "index": 0,
            "delta": {"role": "assistant"},
            "finish_reason": None
        }]
    }
    yield f"data: {json.dumps(start_event)}\n\n".encode('utf-8')
    
    # 发送会议主题
    intro_event = {
        "id": f"{conversation_id}-intro",
        "object": "chat.completion.chunk",
        "created": created_time,
        "model": "meeting-stream",
        "choices": [{
            "index": 0,
            "delta": {"content": f"# 会议主题：{meeting.topic}\n\n"},
            "finish_reason": None
        }]
    }
    yield f"data: {json.dumps(intro_event)}\n\n".encode('utf-8')
    await asyncio.sleep(0.2)
    
    # 调用会议轮次API生成响应
    try:
        # 获取当前轮次状态
        result = adapter.conduct_discussion_round(meeting_id)
        
        # 如果成功，返回内容
        if result.get("success") and isinstance(result["success"], dict):
            content = result["success"].get("content")
            speaker = result["success"].get("speaker")
            
            if content and speaker:
                # 发送发言者信息
                speaker_info = {
                    "id": f"{conversation_id}-{speaker}",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "meeting-stream",
                    "choices": [{
                        "index": 0,
                        "delta": {"content": f"\n### {speaker} 发言：\n\n"},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(speaker_info)}\n\n".encode('utf-8')
                await asyncio.sleep(0.2)
                
                # 如果内容是嵌套的JSON格式，提取实际文本
                if isinstance(content, dict) and content.get("choices"):
                    # 找到当前发言的智能体
                    current_agent = None
                    for agent in meeting.agents:
                        if agent.name == speaker:
                            current_agent = agent
                            break
                    
                    if current_agent:
                        # 构建当前上下文
                        context = meeting._build_meeting_context()
                        prompt = meeting.mode.get_agent_prompt(
                            agent_name=current_agent.name,
                            agent_role=current_agent.role_description,
                            meeting_topic=meeting.topic,
                            current_round=meeting.current_round
                        )
                        
                        # 直接使用智能体的流式生成方法
                        async for chunk in current_agent.generate_response_stream(prompt, context):
                            content_chunk = {
                                "id": f"{conversation_id}-{speaker}-chunk",
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),
                                "model": "meeting-stream",
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": chunk},
                                    "finish_reason": None
                                }]
                            }
                            yield f"data: {json.dumps(content_chunk)}\n\n".encode('utf-8')
                    else:
                        # 回退到标准方式
                        message_content = content["choices"][0]["message"]["content"]
                        content_chunk = {
                            "id": f"{conversation_id}-{speaker}-content",
                            "object": "chat.completion.chunk",
                            "created": int(time.time()),
                            "model": "meeting-stream",
                            "choices": [{
                                "index": 0,
                                "delta": {"content": message_content},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(content_chunk)}\n\n".encode('utf-8')
                else:
                    # 直接返回内容
                    content_chunk = {
                        "id": f"{conversation_id}-{speaker}-content",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "meeting-stream",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": str(content)},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(content_chunk)}\n\n".encode('utf-8')
        
        # 发送完成事件
        done_event = {
            "id": f"{conversation_id}-done",
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "meeting-stream",
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop"
            }]
        }
        yield f"data: {json.dumps(done_event)}\n\n".encode('utf-8')
        yield f"data: [DONE]\n\n".encode('utf-8')
                
    except Exception as e:
        logger.error(f"流式生成会议响应时出错: {str(e)}", exc_info=True)
        # 发送错误消息
        error_event = {
            "id": f"{conversation_id}-error",
            "object": "chat.completion.chunk", 
            "created": int(time.time()),
            "model": "meeting-stream",
            "choices": [{
                "index": 0,
                "delta": {"content": f"\n\n[错误: {str(e)}]"},
                "finish_reason": "error"
            }]
        }
        yield f"data: {json.dumps(error_event)}\n\n".encode('utf-8')
        yield f"data: [DONE]\n\n".encode('utf-8')

@router.post("/discussions/stream", response_model=None)
async def start_and_stream_discussion(
    group_id: int = Body(...),
    topic: str = Body(...),
    db: Session = Depends(get_db)
):
    """启动讨论并立即以流式方式返回响应"""
    adapter = MeetingAdapter(db)
    
    try:
        # 启动讨论组会议
        meeting_id = adapter.start_meeting(group_id, topic)
        
        # 获取会议对象
        meeting_data = adapter.active_meetings.get(meeting_id)
        if not meeting_data:
            raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
        
        meeting = meeting_data.get("meeting")
        if not meeting:
            raise HTTPException(status_code=500, detail=f"会议数据格式错误")
        
        # 开始流式响应
        return StreamingResponse(
            generate_meeting_stream(meeting, adapter, meeting_id),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"启动并流式输出讨论时出错: {str(e)}", exc_info=True)
        
        async def error_stream():
            error_data = {
                "id": f"error-{int(time.time())}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "meeting-stream",
                "choices": [{
                    "index": 0,
                    "delta": {"content": f"\n\n[错误: {str(e)}]"},
                    "finish_reason": "error"
                }]
            }
            yield f"data: {json.dumps(error_data)}\n\n".encode('utf-8')
            yield f"data: [DONE]\n\n".encode('utf-8')
        
        return StreamingResponse(error_stream(), media_type="text/event-stream") 