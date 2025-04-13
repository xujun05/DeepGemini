from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse

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
def create_discussion(
    topic: str = Body(...),
    group_id: int = Body(...),
    db: Session = Depends(get_db)
):
    """创建新讨论"""
    try:
        adapter = MeetingAdapter(db)
        
        # 输出所有活跃会议的ID，帮助调试
        logger.info(f"创建前活跃会议IDs: {list(adapter.active_meetings.keys())}")
        
        # 创建会议
        meeting_id = adapter.start_meeting(group_id, topic)
        
        # 确认创建成功
        logger.info(f"创建后活跃会议IDs: {list(adapter.active_meetings.keys())}")
        
        # 创建带有X-Meeting-Id头的响应对象
        response = JSONResponse(
            content={
                "success": True,
                "message": "讨论已创建",
                "meeting_id": meeting_id,
                "topic": topic
            }
        )
        
        # 添加会议ID到响应头
        response.headers["X-Meeting-Id"] = meeting_id
        
        return response
    except Exception as e:
        logger.error(f"创建讨论失败: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"创建讨论失败: {str(e)}"
            }
        )

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
        # 获取当前轮次所有角色的发言顺序
        speaking_order = meeting.mode.determine_speaking_order(
            [{"name": agent.name, "role": agent.role_description} for agent in meeting.agents],
            meeting.current_round
        )
        
        # 记录当前轮次和参与者
        logger.info(f"当前轮次: {meeting.current_round}, 发言顺序: {speaking_order}")
        
        # 记录开始时的轮次和发言者索引
        start_round = meeting.current_round
        start_speaker_index = meeting.current_speaker_index
        
        # 准备收集本轮所有发言结果
        results = []
        completed_speakers = 0
        round_completed = False
        
        # 持续执行直到完成当前轮次（所有角色都发言完毕或轮次增加）
        while not round_completed and completed_speakers < len(meeting.agents):
            # 执行单个发言者的发言
            result = adapter.conduct_discussion_round(meeting_id)
            results.append(result)
            completed_speakers += 1
            
            logger.info(f"发言者 {completed_speakers}/{len(meeting.agents)} 结果: {result}")
            
            # 如果需要等待人类输入，则中断循环
            if result.get("waiting_for_human", False):
                logger.info(f"等待人类角色 {result.get('speaker', '未知')} 的输入，暂停轮次")
                return result
            
            # 如果轮次已经变化，表示完成了一轮
            if meeting.current_round > start_round:
                round_completed = True
                logger.info(f"轮次已增加: {start_round} -> {meeting.current_round}，认为当前轮次已完成")
            
            # 如果会议状态变为"已结束"，也中断循环
            if meeting.status == "已结束" or result.get("status") == "已结束":
                round_completed = True
                logger.info("会议已结束")
        
        # 返回最终结果
        final_result = {
            "meeting_id": meeting_id,
            "current_round": meeting.current_round,
            "status": meeting.status,
            "success": True,
            "message": "当前轮次所有角色已完成发言" if round_completed else "已处理部分角色发言",
            "results": results  # 包含每个角色的发言结果
        }
        
        logger.info(f"讨论轮次完成: {final_result}")
        return final_result
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
    logger.info(f"获取讨论回合，活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        logger.error(f"会议ID {meeting_id} 不存在，当前活跃会议：{list(adapter.active_meetings.keys())}")
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}")
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
    logger.info(f"提交人类输入，活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        logger.error(f"会议ID {meeting_id} 不存在，当前活跃会议：{list(adapter.active_meetings.keys())}")
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}")
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 查找对应的人类智能体
    human_agent = None
    for agent in meeting.agents:
        if hasattr(agent, 'is_human') and agent.is_human and agent.name == agent_name:
            human_agent = agent
            break
    
    if not human_agent:
        logger.error(f"找不到人类智能体 {agent_name}，会议ID={meeting_id}")
        raise HTTPException(status_code=404, detail=f"找不到人类智能体 {agent_name}")
    
    # 检查是否正在等待该人类角色的输入
    if not human_agent.is_waiting_for_input():
        logger.info(f"当前不需要 {agent_name} 的输入，会议ID={meeting_id}")
        # 尽管如此，我们还是接受这个输入
    
    # 添加人类消息
    success = meeting.add_human_message(agent_name, message)
    if not success:
        logger.error(f"无法为 {agent_name} 添加消息，会议ID={meeting_id}")
        raise HTTPException(status_code=400, detail=f"无法为 {agent_name} 添加消息")
    
    # 重置等待状态
    if hasattr(human_agent, 'is_waiting_input'):
        human_agent.is_waiting_input = False
        if hasattr(human_agent, 'input_start_time'):
            human_agent.input_start_time = None
        logger.info(f"已重置人类智能体 {agent_name} 的等待状态")
    
    # 如果会议有等待人类输入的标记，清除它
    if hasattr(meeting, 'waiting_for_human_input') and meeting.waiting_for_human_input == agent_name:
        meeting.waiting_for_human_input = None
        logger.info(f"已清除会议的等待人类输入标记")
    
    # 确保会议状态是"进行中"
    if meeting.status == "等待人类输入" or meeting.status == "未开始":
        meeting.status = "进行中"
        logger.info(f"已将会议状态从'{meeting.status}'更改为'进行中'")
    
    # 输出会议状态
    logger.info(f"人类输入已添加: 会议ID={meeting_id}, 角色={agent_name}, 消息长度={len(message)}")
    
    # 尝试继续会议进程
    try:
        # 这里我们不立即执行下一轮，而是在客户端请求时执行
        # 但我们需要确保会议状态正确
        logger.info(f"人类输入已处理，会议准备继续进行: 会议ID={meeting_id}, 当前状态={meeting.status}")
    except Exception as e:
        logger.error(f"继续会议失败: {str(e)}")
        # 即使出现错误，我们仍然返回成功，因为消息已经添加
    
    return {
        "success": True,
        "message": f"{agent_name} 的消息已提交，会议将继续进行",
        "meeting_id": meeting_id,
        "status": meeting.status,
        "current_round": meeting.current_round
    }

@router.get("/discussions/{meeting_id}/human_roles", response_model=List[Dict[str, Any]])
def get_human_roles(meeting_id: str, db: Session = Depends(get_db)):
    """获取会议中的人类角色列表"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"获取人类角色，活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        logger.error(f"会议ID {meeting_id} 不存在，当前活跃会议：{list(adapter.active_meetings.keys())}")
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}")
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 输出会议对象类型，帮助调试
    logger.info(f"会议对象类型: {type(meeting)}")
    
    # 获取人类角色列表
    human_roles = meeting.get_human_roles()
    logger.info(f"找到 {len(human_roles)} 个人类角色: {[role.get('name') for role in human_roles]}")
    return human_roles

@router.get("/discussions/{meeting_id}/messages", response_model=Dict[str, Any])
def get_meeting_messages(meeting_id: str, format: str = "standard", db: Session = Depends(get_db)):
    """获取会议消息历史"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"获取会议消息，活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
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
    waiting_for_human = []
    
    # 获取人类角色信息
    human_roles = meeting.get_human_roles()
    
    # 检查是否有人类角色正在等待输入
    is_waiting_for_human = False
    for agent in meeting.agents:
        if hasattr(agent, 'is_human') and agent.is_human and agent.is_waiting_for_input():
            waiting_for_agent = agent.name
            is_waiting_for_human = True
            # 查找对应的人类角色详细信息
            for role in human_roles:
                if role['name'] == agent.name:
                    waiting_for_human.append(role)
                    break
            # 如果没有找到角色信息，添加基本信息
            if not waiting_for_human or waiting_for_human[-1]['name'] != agent.name:
                waiting_for_human.append({
                    'name': agent.name,
                    'id': getattr(agent, 'id', 0),
                    'is_waiting': True
                })
    
    # 检查下一个发言者是否为人类角色
    if meeting.status == "进行中" and meeting.current_speaker_index < len(meeting.agents):
        next_speaker = meeting.agents[meeting.current_speaker_index]
        if hasattr(next_speaker, 'is_human') and next_speaker.is_human:
            is_waiting_for_human = True
            waiting_for_agent = next_speaker.name
            
            # 确保这个人类角色也在waiting_for_human列表中
            agent_in_list = False
            for role in waiting_for_human:
                if role.get('name') == next_speaker.name:
                    agent_in_list = True
                    break
            
            if not agent_in_list:
                waiting_for_human.append({
                    'name': next_speaker.name,
                    'id': getattr(next_speaker, 'id', 0),
                    'is_waiting': True
                })
    
    # 格式化消息供前端使用
    formatted_messages = []
    for msg in history:
        formatted_messages.append({
            "role": "user" if msg.get("agent") != "system" else "system",
            "content": msg.get("content", ""),
            "agent_name": msg.get("agent", "系统"),
            "timestamp": msg.get("timestamp", "")
        })
    
    # 如果有人类角色等待输入，设置状态为waiting_for_human
    status = meeting.status
    if is_waiting_for_human:
        status = "waiting_for_human"
    
    # 整理讨论的轮次信息
    rounds = []
    for round_idx, round_data in enumerate(meeting.rounds if hasattr(meeting, 'rounds') else []):
        if round_data and isinstance(round_data, dict) and round_data.get('messages'):
            rounds.append({
                'round_number': round_idx + 1,
                'messages': [
                    {
                        "agent_name": msg.get("agent", "系统"),
                        "content": msg.get("content", ""),
                        "timestamp": msg.get("timestamp", "")
                    } for msg in round_data.get('messages', [])
                ]
            })
    
    # 记录结果信息
    result = {
        "status": status,
        "waiting_for_human": waiting_for_human,
        "waiting_for_agent": waiting_for_agent,
        "messages": formatted_messages,
        "current_round": meeting.current_round,
        "max_rounds": meeting.max_rounds,
        "topic": meeting.topic,
        "rounds": rounds if rounds else [{"round_number": 1, "messages": []}]
    }
    
    logger.info(f"返回会议消息，状态:{status}, 当前轮次:{meeting.current_round}, 消息数:{len(formatted_messages)}, 等待人类输入:{is_waiting_for_human}")
    
    return result

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
        
        # 如果结果表示等待人类输入，直接返回
        if result.get("waiting_for_human", False):
            waiting_info = {
                "id": f"{conversation_id}-waiting",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "meeting-stream",
                "choices": [{
                    "index": 0,
                    "delta": {"content": f"\n### 等待人类角色 {result.get('speaker', '未知')} 的输入...\n\n"},
                    "finish_reason": None
                }]
            }
            yield f"data: {json.dumps(waiting_info)}\n\n".encode('utf-8')
            
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
            return
        
        # 如果成功，生成内容
        if result.get("success") and result.get("speaker"):
            speaker = result.get("speaker")
            content = result.get("content", "")
            
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
            
            # 流式发送内容
            if content:
                # 将内容分成小块流式发送，模拟打字效果
                chunk_size = 3  # 每次发送的字符数
                for i in range(0, len(content), chunk_size):
                    chunk = content[i:i+chunk_size]
                    content_chunk = {
                        "id": f"{conversation_id}-{speaker}-chunk-{i}",
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
                    # 添加延迟，模拟真实打字速度，但不要太慢
                    await asyncio.sleep(0.05)
        
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

@router.get("/discussions/{meeting_id}", response_model=Dict[str, Any])
def get_discussion_info(meeting_id: str, db: Session = Depends(get_db)):
    """获取会议基本信息"""
    adapter = MeetingAdapter(db)
    
    # 输出所有活跃会议的ID，帮助调试
    logger.info(f"获取会议基本信息，活跃会议IDs: {list(adapter.active_meetings.keys())}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        logger.error(f"会议ID {meeting_id} 不存在，当前活跃会议：{list(adapter.active_meetings.keys())}")
        raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}")
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 简化的会议状态信息
    return {
        "id": meeting_id,
        "topic": meeting.topic,
        "status": meeting.status,
        "current_round": meeting.current_round,
        "max_rounds": meeting.max_rounds,
        "start_time": meeting_data.get("start_time").isoformat() if meeting_data.get("start_time") else None,
        "group_id": meeting_data.get("group_id")
    }

@router.get("/discussions/{meeting_id}/status", response_model=Dict[str, Any])
async def get_meeting_status_and_summary(meeting_id: str, db: Session = Depends(get_db)):
    """获取会议状态和总结"""
    adapter = MeetingAdapter(db)
    
    logger.info(f"获取会议状态和总结，会议ID: {meeting_id}")
    
    # 检查会议是否存在
    meeting_data = adapter.active_meetings.get(meeting_id)
    if not meeting_data:
        logger.warning(f"找不到会议ID: {meeting_id}，尝试结束会议以获取总结")
        try:
            # 尝试调用end_meeting以获取总结
            result = await adapter.end_meeting(meeting_id)
            if result and not result.get("error"):
                logger.info(f"成功获取到会议总结，长度: {len(result.get('summary', ''))}")
                return {
                    "status": "已结束",
                    "summary": result.get("summary", ""),
                    "topic": result.get("topic", ""),
                    "meeting_id": meeting_id
                }
            else:
                logger.error(f"会议总结获取失败: {result.get('error', '未知错误')}")
                raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在或无法获取总结")
        except Exception as e:
            logger.error(f"获取总结时出错: {str(e)}", exc_info=True)
            raise HTTPException(status_code=404, detail=f"会议ID {meeting_id} 不存在")
    
    # 从会议数据中获取会议对象
    meeting = meeting_data.get("meeting")
    if not meeting:
        logger.error(f"会议数据格式错误: meeting_id={meeting_id}")
        raise HTTPException(status_code=500, detail=f"会议数据格式错误")
    
    # 获取总结
    summary = ""
    if meeting.status == "已结束" or meeting.current_round > meeting.max_rounds:
        # 如果会议已结束，尝试获取现有总结
        existing_summary = meeting.get_summary() if hasattr(meeting, 'get_summary') else None
        
        # 如果没有找到有效的总结，尝试生成一个
        if not existing_summary or len(existing_summary) < 100 or "未找到总结" in existing_summary:
            logger.info(f"会议已结束但未找到有效总结，生成总结...")
            try:
                summary = meeting.finish()
                logger.info(f"已生成会议总结，长度: {len(summary)}")
            except Exception as e:
                logger.error(f"生成总结时出错: {str(e)}", exc_info=True)
                summary = "无法生成总结，请稍后再试。"
        else:
            summary = existing_summary
            logger.info(f"使用现有总结，长度: {len(summary)}")
    else:
        # 会议未结束，返回当前状态
        logger.info(f"会议未结束，仅返回当前状态: status={meeting.status}, round={meeting.current_round}")
    
    # 返回会议状态和总结
    return {
        "status": meeting.status,
        "current_round": meeting.current_round,
        "max_rounds": meeting.max_rounds,
        "topic": meeting.topic,
        "summary": summary,
        "meeting_id": meeting_id
    } 