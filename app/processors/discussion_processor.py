from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import logging
import asyncio
import json

from app.models.database import DiscussionGroup, Role
from app.adapters.meeting_adapter import MeetingAdapter

logger = logging.getLogger(__name__)

class DiscussionProcessor:
    """讨论组处理器，用于管理讨论组数据"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_groups(self) -> List[Dict[str, Any]]:
        """获取所有讨论组"""
        groups = self.db.query(DiscussionGroup).all()
        return [self._group_to_dict(group) for group in groups]
    
    def get_group(self, group_id: int) -> Optional[Dict[str, Any]]:
        """获取特定讨论组"""
        group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
        if not group:
            return None
        return self._group_to_dict(group)
    
    def create_group(self, group_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新讨论组"""
        # 获取角色ID列表
        role_ids = group_data.get('role_ids', [])
        
        # 创建讨论组
        group = DiscussionGroup(
            name=group_data.get('name'),
            topic=group_data.get('topic', ''),
            mode=group_data.get('mode', 'discussion')
        )
        
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        
        # 添加角色关联
        if role_ids:
            roles = self.db.query(Role).filter(Role.id.in_(role_ids)).all()
            for role in roles:
                group.roles.append(role)
            
            self.db.commit()
            self.db.refresh(group)
        
        return self._group_to_dict(group)
    
    def update_group(self, group_id: int, group_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新讨论组"""
        group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
        if not group:
            return None
        
        # 更新讨论组属性
        if 'name' in group_data:
            group.name = group_data['name']
        if 'topic' in group_data:
            group.topic = group_data['topic']
        if 'mode' in group_data:
            group.mode = group_data['mode']
        
        # 更新角色关联
        if 'role_ids' in group_data:
            # 清除现有角色
            group.roles = []
            
            # 添加新角色
            role_ids = group_data['role_ids']
            roles = self.db.query(Role).filter(Role.id.in_(role_ids)).all()
            for role in roles:
                group.roles.append(role)
        
        self.db.commit()
        self.db.refresh(group)
        
        return self._group_to_dict(group)
    
    def delete_group(self, group_id: int) -> bool:
        """删除讨论组"""
        group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
        if not group:
            return False
        
        # 清除角色关联
        group.roles = []
        
        self.db.delete(group)
        self.db.commit()
        
        return True
    
    def _group_to_dict(self, group: DiscussionGroup) -> Dict[str, Any]:
        """将讨论组对象转换为字典"""
        return {
            "id": group.id,
            "name": group.name,
            "topic": group.topic,
            "mode": group.mode,
            "roles": [{"id": role.id, "name": role.name} for role in group.roles],
            "role_ids": [role.id for role in group.roles]
        }
    
    def _load_group(self, group_id: int) -> DiscussionGroup:
        """加载讨论组信息"""
        group = self.db.query(DiscussionGroup).filter(DiscussionGroup.id == group_id).first()
        if not group:
            raise ValueError(f"讨论组ID {group_id} 不存在")
        return group
    
    async def process_request(self, prompt: str, stream: bool = False) -> Any:
        """处理请求"""
        try:
            logger.info(f"开始处理讨论组请求: group_id={self.group_id}, prompt='{prompt[:50]}...'")
            
            # 确保self.group_id和self.adapter存在
            if not hasattr(self, 'group_id') or not hasattr(self, 'adapter'):
                logger.error("未设置group_id或adapter")
                raise ValueError("未设置group_id或adapter")
            
            # 启动讨论
            logger.info(f"开始启动讨论: group_id={self.group_id}")
            meeting_id = self.adapter.start_meeting(self.group_id, prompt)
            logger.info(f"讨论已启动: meeting_id={meeting_id}")
            
            if stream:
                # 流式处理模式 - 使用返回能够迭代的生成器
                logger.info("使用流式响应模式")
                return self._get_stream_response(meeting_id)
            else:
                # 非流式模式 - 等待全部完成后一次性返回
                logger.info("使用非流式响应模式")
                return await self._complete_discussion_process(meeting_id)
        except Exception as e:
            logger.error(f"处理讨论组请求失败: {str(e)}", exc_info=True)
            raise
    
    def _get_stream_response(self, meeting_id: str):
        """
        返回适用于StreamingResponse的生成器
        这是一个同步方法，返回一个可以迭代的生成器
        """
        # 非异步函数中返回一个同步生成器
        async def process_meeting():
            # 内部处理会议并生成数据
            generator = self._stream_discussion_process(meeting_id)
            async for chunk in generator:
                yield chunk
        
        # 创建一个类似于生成器的对象，但它能被FastAPI的StreamingResponse正确处理
        class AsyncIteratorWrapper:
            def __init__(self, coro):
                self.coro = coro
                self._iterator = None
            
            def __aiter__(self):
                return self
            
            async def __anext__(self):
                if self._iterator is None:
                    self._iterator = self.coro.__aiter__()
                try:
                    return await self._iterator.__anext__()
                except StopAsyncIteration:
                    raise
        
        # 返回一个可迭代对象
        return AsyncIteratorWrapper(process_meeting())
    
    async def _complete_discussion_process(self, meeting_id: str) -> str:
        """完整讨论过程，一次性返回结果"""
        round_count = 0
        # 进行讨论直到结束
        while True:
            logger.info(f"开始执行第{round_count+1}轮讨论: meeting_id={meeting_id}")
            round_data = self.adapter.conduct_discussion_round(meeting_id)
            logger.info(f"第{round_count+1}轮讨论完成: {round_data}")
            
            # 每轮结束后打印当前轮次的对话内容
            self._print_latest_round_content(meeting_id)
            
            round_count += 1
            if round_data["status"] == "已结束":
                logger.info(f"讨论已结束: meeting_id={meeting_id}")
                break
            
            logger.info(f"等待下一轮讨论...")
            await asyncio.sleep(0.5)
        
        # 结束讨论并获取结果
        logger.info(f"获取讨论结果: meeting_id={meeting_id}")
        result = self.adapter.end_discussion(meeting_id)
        
        # 打印完整的讨论历史和总结
        self._print_full_discussion(result)
        
        logger.info(f"获取到讨论结果: summary_length={len(result.get('summary', ''))}")
        return result["summary"] or "讨论已完成，但未生成总结。"
    
    async def _stream_discussion_process(self, meeting_id: str):
        """流式讨论过程，实时返回每个角色的回答"""
        import time
        import json
        
        conversation_id = f"meeting-{int(time.time())}"
        last_processed_message_index = -1
        round_count = 0
        
        # 发送会话开始事件
        start_event = {
            "id": conversation_id,
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "discussion-group",
            "choices": [{
                "index": 0,
                "delta": {"role": "system", "content": f"讨论开始: {meeting_id}"},
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(start_event, ensure_ascii=False)}\n\n"
        
        # 循环处理每一轮讨论
        while True:
            # 执行一轮讨论
            logger.info(f"流式模式: 开始执行第{round_count+1}轮讨论")
            round_data = self.adapter.conduct_discussion_round(meeting_id)
            
            # 获取会议对象
            meeting = self.adapter.active_meetings.get(meeting_id)
            if not meeting:
                break
                
            # 获取新消息
            all_messages = meeting.meeting_history
            agent_messages = [msg for msg in all_messages if msg["agent"] != "system"]
            
            # 流式发送新消息
            for i, msg in enumerate(agent_messages):
                if i > last_processed_message_index:
                    # 发送轮次信息
                    round_info = {
                        "id": f"{conversation_id}-round-{round_count+1}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "discussion-group",
                        "choices": [{
                            "index": 0,
                            "delta": {"role": "system", "content": f"--- 第 {round_count+1} 轮讨论 ---"},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(round_info, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.2)
                    
                    # 发送发言人信息
                    speaker_info = {
                        "id": f"{conversation_id}-{i}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "discussion-group",
                        "choices": [{
                            "index": 0,
                            "delta": {"role": "assistant", "content": f"[{msg['agent']}]: "},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(speaker_info, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.2)
                    
                    # 确保内容是字符串类型
                    content = str(msg.get("content", ""))
                    
                    # 流式发送内容
                    chunk_size = 5  # 每个块的字符数
                    for j in range(0, len(content), chunk_size):
                        chunk = content[j:j+chunk_size]
                        content_chunk = {
                            "id": f"{conversation_id}-{i}-{j}",
                            "object": "chat.completion.chunk",
                            "created": int(time.time()),
                            "model": "discussion-group",
                            "choices": [{
                                "index": 0,
                                "delta": {"content": chunk},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(content_chunk, ensure_ascii=False)}\n\n"
                        await asyncio.sleep(0.05)
                    
                    # 发送消息结束标记
                    end_message = {
                        "id": f"{conversation_id}-{i}-end",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "discussion-group",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": "\n\n"},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(end_message, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.2)
                    
                    last_processed_message_index = i
            
            # 判断讨论是否结束
            round_count += 1
            if round_data["status"] == "已结束":
                logger.info(f"流式模式: 讨论已结束")
                break
                
            # 等待下一轮
            await asyncio.sleep(0.5)
        
        # 获取总结
        logger.info(f"流式模式: 获取讨论总结")
        result = self.adapter.end_discussion(meeting_id)
        summary = str(result.get("summary", "讨论已完成，但未生成总结。"))
        
        # 发送总结信息
        summary_info = {
            "id": f"{conversation_id}-summary",
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "discussion-group",
            "choices": [{
                "index": 0,
                "delta": {"role": "system", "content": "--- 讨论总结 ---\n\n"},
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(summary_info, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.3)
        
        # 流式发送总结内容
        chunk_size = 10  # 总结的块大小可以大一些
        for j in range(0, len(summary), chunk_size):
            chunk = summary[j:j+chunk_size]
            summary_chunk = {
                "id": f"{conversation_id}-summary-{j}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "discussion-group",
                "choices": [{
                    "index": 0,
                    "delta": {"content": chunk},
                    "finish_reason": None
                }]
            }
            yield f"data: {json.dumps(summary_chunk, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.05)
        
        # 发送会话结束事件
        end_event = {
            "id": f"{conversation_id}-end",
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "discussion-group",
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop"
            }]
        }
        yield f"data: {json.dumps(end_event, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
    
    def _print_latest_round_content(self, meeting_id: str):
        """打印最新一轮的对话内容"""
        try:
            meeting = self.adapter.active_meetings.get(meeting_id)
            if not meeting:
                return
            
            # 获取当前轮次
            current_round = meeting.current_round
            
            print(f"\n{'='*80}")
            print(f"第 {current_round-1} 轮讨论内容:")
            print(f"{'='*80}")
            
            # 只显示最近的2条消息（通常是本轮的发言）
            history = meeting.meeting_history
            recent_messages = [msg for msg in history if msg["agent"] != "system"][-2:]
            
            for msg in recent_messages:
                print(f"\n[{msg['agent']}]:")
                print(f"{msg['content']}")
            
            print(f"\n{'='*80}\n")
        except Exception as e:
            logger.error(f"打印最新一轮内容时出错: {str(e)}")

    def _print_full_discussion(self, result: Dict[str, Any]):
        """打印完整的讨论历史和总结"""
        try:
            history = result.get("history", [])
            summary = result.get("summary", "无总结")
            
            print(f"\n{'='*80}")
            print(f"完整讨论内容:")
            print(f"{'='*80}")
            
            for msg in history:
                if msg["agent"] != "system":
                    print(f"\n[{msg['agent']}]:")
                    print(f"{msg['content']}")
            
            print(f"\n{'='*80}")
            print(f"讨论总结:")
            print(f"{'='*80}")
            print(f"\n{summary}")
            print(f"\n{'='*80}\n")
        except Exception as e:
            logger.error(f"打印完整讨论内容时出错: {str(e)}") 