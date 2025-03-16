from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import logging
import asyncio
import json
import re
import time
import random

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
            description=group_data.get('description', ''),
            mode=group_data.get('mode', 'discussion'),
            max_rounds=group_data.get('max_rounds', 3),
            summary_model_id=group_data.get('summary_model_id'),
            summary_prompt=group_data.get('summary_prompt')
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
        if 'description' in group_data:
            group.description = group_data['description']
        if 'mode' in group_data:
            group.mode = group_data['mode']
        if 'max_rounds' in group_data:
            group.max_rounds = group_data['max_rounds']
        if 'summary_model_id' in group_data:
            group.summary_model_id = group_data['summary_model_id']
        if 'summary_prompt' in group_data:
            group.summary_prompt = group_data['summary_prompt']
        
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
            "topic": group.topic or "",
            "description": group.description or "",
            "mode": group.mode,
            "max_rounds": group.max_rounds,
            "summary_model_id": group.summary_model_id,
            "summary_prompt": group.summary_prompt or "",
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None,
            "roles": [
                {
                    "id": role.id,
                    "name": role.name
                }
                for role in group.roles
            ],
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
        result = await self.adapter.end_meeting(meeting_id)
        
        # 打印完整的讨论历史和总结
        self._print_full_discussion(result)
        
        logger.info(f"获取到讨论结果: summary_length={len(result.get('summary', ''))}")
        return result["summary"] or "讨论已完成，但未生成总结。"
    
    async def _stream_discussion_process(self, meeting_id: str):
        """流式讨论过程，实时返回每个角色的回答"""
        import time
        import json
        import asyncio
        import random
        
        conversation_id = f"chatcmpl-{int(time.time())}"
        last_processed_message_index = -1
        round_count = 0
        
        # 获取会议对象
        meeting = self.adapter.active_meetings.get(meeting_id)
        if not meeting:
            yield f"data: {{\"error\": \"会议ID {meeting_id} 不存在\"}}\n\n"
            return
        
        # 发送会话开始事件
        start_event = {
            "id": conversation_id,
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "discussion-group",
            "choices": [{
                "index": 0,
                "delta": {"role": "assistant", "content": ""},
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(start_event, ensure_ascii=False)}\n\n"
        
        # 发送会议主题与格式说明
        intro_event = {
            "id": f"{conversation_id}-intro",
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "discussion-group",
            "choices": [{
                "index": 0,
                "delta": {"content": f"# 讨论主题：{meeting.topic}\n\n"},
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(intro_event, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.3)
        
        # 循环处理每一轮讨论
        while True:
            # 发送美化的轮次标题
            round_title = {
                "id": f"{conversation_id}-round-{round_count+1}-title",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "discussion-group",
                "choices": [{
                    "index": 0,
                    "delta": {"content": f"\n## 第 {round_count+1} 轮讨论\n\n"},
                    "finish_reason": None
                }]
            }
            yield f"data: {json.dumps(round_title, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.3)
            
            logger.info(f"流式模式: 开始执行第{round_count+1}轮讨论")
            
            # 确定发言顺序
            speaking_order = meeting.mode.determine_speaking_order(
                [{"name": agent.name, "role": agent.role_description} for agent in meeting.agents],
                meeting.current_round
            )
            
            # 获取当前会议历史的索引位置
            current_history_index = len(meeting.meeting_history)
            
            # 每个智能体依次发言（不等待所有人完成）
            for agent_name in speaking_order:
                # 获取智能体
                agent = next((a for a in meeting.agents if a.name == agent_name), None)
                if not agent:
                    continue
                    
                # 发送发言人信息 - 使用格式化的标题
                speaker_info = {
                    "id": f"{conversation_id}-{agent_name}-start",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "discussion-group",
                    "choices": [{
                        "index": 0,
                        "delta": {"content": f"\n### {agent_name} 发言：\n\n"},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(speaker_info, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.2)
                
                # 获取智能体提示
                prompt = meeting.mode.get_agent_prompt(
                    agent_name=agent.name,
                    agent_role=agent.role_description,
                    meeting_topic=meeting.topic,
                    current_round=meeting.current_round
                )
                
                # 获取当前上下文
                context = meeting._get_current_context()
                
                # 实时流式生成并返回回应 - 优化缓冲处理提高流畅性
                buffer = ""
                thinking_dots_shown = False
                last_chunk_time = time.time()
                
                # 发送思考中提示
                thinking_event = {
                    "id": f"{conversation_id}-{agent_name}-thinking",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "discussion-group",
                    "choices": [{
                        "index": 0,
                        "delta": {"content": ""},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(thinking_event, ensure_ascii=False)}\n\n"
                
                # 使用累积缓冲区优化流式输出
                async for chunk in agent.generate_response_stream(prompt, context):
                    buffer += chunk
                    current_time = time.time()
                    
                    # 使用更小的缓冲区和更短的时间间隔，创造打字效果
                    # 每1-3个字符输出一次，或每0.1-0.2秒输出一次
                    if len(buffer) >= random.randint(1, 3) or (current_time - last_chunk_time) > random.uniform(0.1, 0.2):
                        content_chunk = {
                            "id": f"{conversation_id}-{agent_name}-chunk-{int(current_time*1000)}",
                            "object": "chat.completion.chunk",
                            "created": int(current_time),
                            "model": "discussion-group",
                            "choices": [{
                                "index": 0,
                                "delta": {"content": buffer},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(content_chunk, ensure_ascii=False)}\n\n"
                        buffer = ""
                        last_chunk_time = current_time
                        
                        # 添加极小的随机暂停以增强打字效果的自然感
                        # 这个暂停是异步的，不会阻塞其他处理
                        if random.random() < 0.3:  # 30%概率添加微小停顿
                            await asyncio.sleep(random.uniform(0.03, 0.08))
                
                # 发送剩余的缓冲区内容
                if buffer:
                    content_chunk = {
                        "id": f"{conversation_id}-{agent_name}-final",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "discussion-group",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": buffer},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(content_chunk, ensure_ascii=False)}\n\n"
                
                # 获取生成的完整回应
                response = agent.last_response
                
                # 添加到会议历史
                meeting.add_message(agent.name, response)
                
                # 添加轻微的随机延迟使发言更自然
                await asyncio.sleep(0.3 + random.uniform(0, 0.3))
            
            # 更新轮次
            round_count += 1
            meeting.current_round += 1
            
            # 检查是否应该结束会议
            if meeting.current_round > meeting.max_rounds or meeting.mode.should_end_meeting(
                round_count, meeting.meeting_history):
                # 发送会议结束信息 - 美化格式
                end_meeting_info = {
                    "id": f"{conversation_id}-meeting-end",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "discussion-group",
                    "choices": [{
                        "index": 0,
                        "delta": {"content": "\n\n## 会议结束\n\n*正在生成会议总结...*\n\n"},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(end_meeting_info, ensure_ascii=False)}\n\n"
                meeting.status = "已结束"
                
                # 修改会议总结为实时流式返回
                try:
                    logger.info(f"开始流式生成会议总结: meeting_id={meeting_id}")
                    
                    # 获取会议数据
                    meeting = self.adapter.active_meetings.get(meeting_id)
                    
                    # 获取讨论组信息
                    group_info = meeting.group_info
                    
                    # 获取自定义总结模型（如果有）
                    summary_model = None
                    api_key = None
                    api_base_url = None
                    extracted_model_params = {}  # 使用不同的变量名避免冲突
                    
                    if group_info and 'summary_model_id' in group_info and group_info['summary_model_id']:
                        model_id = group_info['summary_model_id']
                        logger.info(f"使用自定义总结模型: model_id={model_id}")
                        
                        # 从数据库获取模型配置
                        from app.models.database import Model as ModelConfiguration
                        summary_model = self.db.query(ModelConfiguration).filter(ModelConfiguration.id == model_id).first()
                        
                        if summary_model:
                            logger.info(f"找到总结模型: name={summary_model.name}")
                            # 获取API密钥和基础URL
                            api_key = getattr(summary_model, 'api_key', None)
                            api_url = getattr(summary_model, 'api_url', None)
                            
                            # 处理URL，从完整URL中提取基础部分
                            if api_url:
                                if "/v1/chat/completions" in api_url:
                                    api_base_url = api_url.split("/v1/chat/completions")[0]
                                else:
                                    api_base_url = api_url
                        
                            # 直接从模型对象中提取所有相关参数到字典
                            model_attributes = ['max_tokens', 'temperature', 'top_p', 'presence_penalty', 'frequency_penalty']
                            for attr in model_attributes:
                                if hasattr(summary_model, attr) and getattr(summary_model, attr) is not None:
                                    extracted_model_params[attr] = getattr(summary_model, attr)
                        
                            # 还要检查custom_parameters字段
                            if hasattr(summary_model, 'custom_parameters') and summary_model.custom_parameters:
                                # 如果是字符串，尝试解析为字典
                                custom_params = summary_model.custom_parameters
                                if isinstance(custom_params, str):
                                    try:
                                        custom_params_dict = json.loads(custom_params)
                                        extracted_model_params.update(custom_params_dict)
                                    except json.JSONDecodeError:
                                        logger.warning(f"无法解析模型custom_parameters: {custom_params}")
                                elif isinstance(custom_params, dict):
                                    extracted_model_params.update(custom_params)
                        
                            # 确保model_name参数正确传递
                            if hasattr(summary_model, 'model_name') and summary_model.model_name:
                                model_name = summary_model.model_name
                            
                            logger.info(f"提取到的模型参数: {extracted_model_params}")
                    
                    # 使用会议模式的默认提示模板或自定义提示
                    custom_prompt = None
                    if group_info and 'summary_prompt' in group_info and group_info['summary_prompt']:
                        custom_prompt = group_info['summary_prompt']
                        logger.info(f"使用自定义总结提示模板: length={len(custom_prompt)}")
                    
                    # 使用自定义模型和提示（如果有），否则使用默认
                    model_name = model_name if model_name else None
                    
                    # 使用会议模式的默认提示模板或自定义提示
                    prompt_template = custom_prompt if custom_prompt else meeting.mode.get_summary_prompt_template()
                    
                    logger.info(f"准备调用总结生成器，传递参数: {extracted_model_params}")
                    
                    # 使用提取的参数调用总结生成器
                    from app.meeting.utils.summary_generator import SummaryGenerator
                    
                    accumulated_text = ""
                    buffer = ""
                    last_chunk_time = time.time()
                    
                    async for chunk in SummaryGenerator.generate_summary_stream(
                        meeting_topic=meeting.topic,
                        meeting_history=meeting.meeting_history,
                        prompt_template=prompt_template,
                        model_name=model_name,
                        api_key=api_key, 
                        api_base_url=api_base_url,
                        model_params=extracted_model_params  # 使用提取的参数
                    ):
                        # 累积总结文本
                        accumulated_text += chunk
                        buffer += chunk
                        current_time = time.time()
                        
                        # 使用更小的缓冲区和更短的时间间隔，创造打字效果
                        if len(buffer) >= random.randint(1, 4) or (current_time - last_chunk_time) > random.uniform(0.08, 0.15):
                            summary_chunk = {
                                "id": f"{conversation_id}-summary-chunk-{int(current_time*1000)}",
                                "object": "chat.completion.chunk",
                                "created": int(current_time),
                                "model": "discussion-group",
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": buffer},
                                    "finish_reason": None
                                }]
                            }
                            yield f"data: {json.dumps(summary_chunk, ensure_ascii=False)}\n\n"
                            buffer = ""  # 清空缓冲区
                            last_chunk_time = current_time
                            
                            # 添加极小的随机暂停增强自然感
                            if random.random() < 0.2:  # 20%概率添加微小停顿
                                await asyncio.sleep(random.uniform(0.02, 0.05))
                    
                    # 将完整总结添加到会议记录
                    meeting.add_message("system", accumulated_text)
                    
                    # 发送总结完成标记 - 美化格式
                    summary_footer = {
                        "id": f"{conversation_id}-summary-footer",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "discussion-group",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": "\n\n---\n\n*会议已完成*"},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(summary_footer, ensure_ascii=False)}\n\n"
                    
                except Exception as e:
                    # 处理总结生成错误 - 美化错误显示格式
                    error_msg = f"生成会议总结时出错: {str(e)}"
                    logger.error(error_msg, exc_info=True)
                    error_chunk = {
                        "id": f"{conversation_id}-summary-error",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": "discussion-group",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": f"\n\n> **错误**: {error_msg}"},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
                
                # 会议总结完成，跳出循环
                break
            
            # 添加分隔符使轮次之间更清晰
            round_separator = {
                "id": f"{conversation_id}-round-{round_count}-separator",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "discussion-group",
                "choices": [{
                    "index": 0,
                    "delta": {"content": "\n\n---\n\n"},
                    "finish_reason": None
                }]
            }
            yield f"data: {json.dumps(round_separator, ensure_ascii=False)}\n\n"
            
            # 暂停一下再进行下一轮 - 适当的延迟使整体流程更自然
            await asyncio.sleep(0.7 + random.uniform(0, 0.5))
        
        # 发送完成标记
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