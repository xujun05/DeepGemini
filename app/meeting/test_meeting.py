"""
多智能体会议系统测试脚本
不依赖UI界面，直接使用底层API执行会议
"""

import os
import time
import random
from datetime import datetime
from dotenv import load_dotenv
import argparse
import json
import traceback

# 导入必要的组件
from utils.summary_generator import SummaryGenerator
from agents.agent import Agent
from agents.agent_factory import AgentFactory
from meeting.meeting import Meeting
from meeting_modes.brainstorming import BrainstormingMode
from meeting_modes.debate import DebateMode
from meeting_modes.discussion import DiscussionMode
from meeting_modes.role_playing import RolePlayingMode
from meeting_modes.swot_analysis import SWOTAnalysisMode
from meeting_modes.six_thinking_hats import SixThinkingHatsMode


def setup_environment():
    """设置环境变量"""
    # 加载.env文件中的环境变量
    load_dotenv()
    
    # 检查是否有API密钥
    if not os.environ.get("OPENAI_API_KEY"):
        api_key = input("请输入OpenAI/Gemini API密钥: ")
        os.environ["OPENAI_API_KEY"] = api_key


def create_agents(model_name, temperature=0.7, num_agents=3):
    """创建智能体"""
    print("\n创建智能体...")
    
    # 创建智能体工厂
    agent_factory = AgentFactory()
    
    # 获取主要API密钥
    main_api_key = os.environ.get("OPENAI_API_KEY")
    
    # 可选: 配置多个API密钥
    api_keys = {
        "openai": os.environ.get("OPENAI_API_KEY"),
        "gemini": os.environ.get("GEMINI_API_KEY", main_api_key),
        "claude": os.environ.get("CLAUDE_API_KEY", main_api_key)
    }
    
    # 可选: 配置多个base_url
    base_urls = {
        "openai": "https://gemini.52yyds.top/v1",
        "gemini": "https://generativelanguage.googleapis.com/v1/",
        "claude": "https://api.anthropic.com/v1"
    }
    
    # 创建智能体角色列表
    agent_roles = [
        {
            "name": "技术专家",
            "role": "首席技术官",
            "personality": "分析性思维，注重细节，喜欢探讨技术可行性",
            "skills": ["技术评估", "系统架构", "风险分析"],
            "model_params": {
                "model_name": "gemini-2.0-pro-exp-02-05",  # 技术专家用Gemini
                "temperature": 0.5,
                "max_tokens": 1000,
                "top_p": 0.9
            },
            "base_url": base_urls["openai"],
            "api_key": api_keys["openai"]
        },
        {
            "name": "创意总监",
            "role": "创意部门负责人",
            "personality": "富有想象力，思维开放，喜欢创新",
            "skills": ["创意思考", "设计思维", "用户体验"],
            "model_params": {
                "model_name": "gemini-2.0-pro-exp-02-05",  # 创意总监用GPT-4
                "temperature": 0.9,
                "max_tokens": 1200,
                "top_p": 0.95
            },
            "base_url": base_urls["openai"],
            "api_key": api_keys["openai"]
        },
        {
            "name": "项目经理",
            "role": "项目管理专家",
            "personality": "条理清晰，注重效率，善于协调",
            "skills": ["项目规划", "资源分配", "风险管理"],
            "model_params": {
                "model_name": model_name,
                "temperature": 0.6,  # 项目经理用中低温度，更有条理
                "max_tokens": 900,
                "top_p": 0.85
            }
        },
        {
            "name": "财务顾问",
            "role": "财务总监",
            "personality": "谨慎务实，关注成本效益，重视可持续发展",
            "skills": ["成本分析", "预算规划", "投资回报评估"],
            "model_params": {
                "model_name": model_name,
                "temperature": 0.4,  # 财务顾问用低温度，更谨慎精确
                "max_tokens": 800,
                "top_p": 0.8
            }
        },
        {
            "name": "营销专家",
            "role": "市场部主管",
            "personality": "外向活跃，善于表达，关注市场趋势",
            "skills": ["市场分析", "品牌策略", "受众洞察"],
            "model_params": {
                "model_name": model_name,
                "temperature": 0.8,  # 营销专家用高温度，更有创意和表现力
                "max_tokens": 1100,
                "top_p": 0.9
            }
        }
    ]
    
    # 选择指定数量的智能体
    selected_agents = agent_roles[:num_agents]
    
    # 创建智能体列表
    agents = []
    for agent_data in selected_agents:
        # 创建智能体
        agent = agent_factory.create(
            name=agent_data["name"],
            role=agent_data["role"],
            personality=agent_data["personality"],
            skills=agent_data["skills"],
            model_params=agent_data["model_params"],
            base_url=agent_data.get("base_url"),
            api_key=agent_data.get("api_key")
        )
        agents.append(agent)
        print(f"已创建智能体: {agent.name} ({agent.role_description}), " +
              f"模型: {agent_data['model_params']['model_name']}, " +
              f"温度: {agent_data['model_params']['temperature']}")
    
    return agents


def create_meeting_mode(mode_name):
    """创建会议模式"""
    print(f"\n创建会议模式: {mode_name}")
    
    mode_map = {
        "brainstorming": BrainstormingMode(),
        "debate": DebateMode(),
        "discussion": DiscussionMode(),
        "role_playing": RolePlayingMode(),
        "swot_analysis": SWOTAnalysisMode(),
        "six_thinking_hats": SixThinkingHatsMode()
    }
    
    if mode_name not in mode_map:
        raise ValueError(f"不支持的会议模式: {mode_name}")
    
    return mode_map[mode_name]


def run_meeting(topic, mode, agents, max_rounds=None):
    """运行会议"""
    print(f"\n开始会议: {topic}")
    print(f"会议模式: {mode.name}")
    print(f"参会智能体: {', '.join([agent.name for agent in agents])}")
    
    # 创建会议
    meeting = Meeting(
        topic=topic,
        mode=mode,
        agents=agents
    )
    
    # 开始会议
    meeting.start()
    print(f"\n会议开始时间: {meeting.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 设置最大轮数（如果有指定）
    if max_rounds is not None:
        mode.max_rounds = max_rounds
    
    # 进行会议，直到结束，确保智能体依次发言
    current_round = 1
    while meeting.status == "进行中":
        print(f"\n==== 第{current_round}轮 ====")
        
        # 获取发言顺序
        speaking_order = meeting.mode.determine_speaking_order(
            [{"name": agent.name} for agent in meeting.agents], 
            current_round
        )
        
        # 记录当前轮次
        meeting._log_event("system", f"第{current_round}轮开始")
        
        # 每个智能体依次发言
        for agent_name in speaking_order:
            # 找到对应的智能体
            agent = next((a for a in meeting.agents if a.name == agent_name), None)
            if agent:
                print(f"\n[正在等待 {agent.name} 思考...]")
                
                # 获取当前会议上下文
                context = meeting._get_current_context()
                
                # 获取会议模式特定的提示
                mode_prompt = meeting.mode.get_agent_prompt(
                    agent_name=agent.name,
                    agent_role=agent.role_description,
                    meeting_topic=meeting.topic,
                    current_round=current_round
                )
                
                # 智能体发言
                try:
                    start_time = time.time()
                    response = agent.speak(
                        meeting_topic=meeting.topic,
                        meeting_mode=meeting.mode.name,
                        current_context=context,
                        mode_specific_prompt=mode_prompt
                    )
                    # 记录发言
                    meeting._log_event(agent.name, response, current_round)
                    
                    # 打印智能体发言和用时
                    elapsed = time.time() - start_time
                    print(f"[{agent.name}] ({elapsed:.2f}秒):")
                    print(f"{response}\n")
                    print("-" * 80)
                    
                    # 更新其他智能体的会话历史
                    for other_agent in meeting.agents:
                        if other_agent.name != agent.name:
                            other_agent.update_history(meeting.meeting_history[-1:])
                            
                    # 增加间隔时间，降低API调用频率
                    wait_time = random.uniform(3, 5)  # 3-5秒随机等待
                    print(f"等待 {wait_time:.1f} 秒后继续...")
                    time.sleep(wait_time)
                except Exception as e:
                    error_msg = f"智能体 {agent.name} 发言失败: {str(e)}"
                    print(f"\n错误: {error_msg}")
                    # 记录详细错误信息以便调试
                    print(f"详细错误: {traceback.format_exc()}")
                    meeting._log_event("system", error_msg, current_round)
                    # 在错误后等待更长时间，避免连续失败
                    time.sleep(10)
        
        # 更新轮次计数
        meeting.current_round += 1
        current_round += 1
        
        # 检查是否需要结束会议
        if max_rounds and current_round > max_rounds:
            print("\n已达到指定的最大轮数，结束会议")
            break
            
        if meeting.mode.should_end_meeting(current_round - 1, meeting.meeting_history):
            print("\n根据会议模式规则，会议应该结束")
            break
    
    # 结束会议
    meeting.end()
    print(f"\n会议结束时间: {meeting.end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 生成并显示会议总结
    if meeting.status == "已结束":
        print("\n==== 会议总结 ====")
        # 使用总结生成器的进度显示
        print("正在生成会议总结，请稍候...")
        summary = SummaryGenerator.generate_summary(
            meeting_topic=meeting.topic,
            meeting_history=meeting.meeting_history,
            summary_prompt_template=mode.get_summary_prompt_template()
        )
        print(summary)
    
    # 保存会议记录
    save_meeting_record(meeting)
    
    return meeting


def save_meeting_record(meeting):
    """保存会议记录到文件"""
    # 创建会议记录目录
    os.makedirs("meeting_records", exist_ok=True)
    
    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    topic_slug = meeting.topic.replace(" ", "_").lower()[:30]
    filename = f"meeting_records/{timestamp}_{topic_slug}.json"
    
    # 准备会议数据
    meeting_data = {
        "id": meeting.meeting_id,
        "topic": meeting.topic,
        "mode": meeting.mode.name,
        "start_time": meeting.start_time.isoformat() if meeting.start_time else None,
        "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
        "agents": [
            {
                "name": agent.name,
                "role": agent.role_description,
                "personality": agent.personality,
                "skills": agent.skills
            }
            for agent in meeting.agents
        ],
        "history": meeting.meeting_history
    }
    
    # 保存到文件
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(meeting_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n会议记录已保存到: {filename}")


def main():
    """主函数"""
    # 命令行参数解析
    parser = argparse.ArgumentParser(description="多智能体会议系统测试脚本")
    parser.add_argument("--topic", type=str, default="如何提高团队协作效率", 
                        help="会议主题")
    parser.add_argument("--mode", type=str, default="brainstorming", 
                        choices=["brainstorming", "debate", "discussion", "role_playing", "swot_analysis", "six_thinking_hats"],
                        help="会议模式")
    parser.add_argument("--model", type=str, default="gemini-2.0-pro-exp-02-05", 
                        help="使用的模型名称")
    parser.add_argument("--agents", type=int, default=3, 
                        help="参会智能体数量")
    parser.add_argument("--temperature", type=float, default=0.7, 
                        help="模型温度参数")
    parser.add_argument("--rounds", type=int, default=None, 
                        help="指定会议轮数，不指定则按照模式规则自动决定")
    parser.add_argument("--openai-key", type=str, default=None, 
                        help="OpenAI API密钥")
    parser.add_argument("--gemini-key", type=str, default=None, 
                        help="Gemini API密钥")
    parser.add_argument("--claude-key", type=str, default=None, 
                        help="Claude API密钥")
    parser.add_argument("--openai-model", type=str, default="gpt-4-turbo", 
                        help="OpenAI模型名称")
    parser.add_argument("--gemini-model", type=str, default="gemini-1.5-pro", 
                        help="Gemini模型名称")
    parser.add_argument("--claude-model", type=str, default="claude-3-opus-20240229", 
                        help="Claude模型名称")
    
    args = parser.parse_args()
    
    # 设置环境变量
    print("设置环境变量...")
    os.environ["OPENAI_MODEL_NAME"] = args.model
    
    # 设置API密钥
    if args.openai_key:
        os.environ["OPENAI_API_KEY"] = args.openai_key
    if args.gemini_key:
        os.environ["GEMINI_API_KEY"] = args.gemini_key
    if args.claude_key:
        os.environ["CLAUDE_API_KEY"] = args.claude_key
    
    setup_environment()
    
    # 创建智能体
    agents = create_agents(
        model_name=args.model,
        temperature=args.temperature,
        num_agents=args.agents
    )
    
    # 创建会议模式
    mode = create_meeting_mode(args.mode)
    
    # 运行会议
    meeting = run_meeting(
        topic=args.topic,
        mode=mode,
        agents=agents,
        max_rounds=args.rounds
    )
    
    print("\n会议测试完成!")


if __name__ == "__main__":
    main() 