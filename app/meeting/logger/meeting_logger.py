import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

class MeetingLogger:
    """会议日志管理类，负责存储和检索会议记录"""
    
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = log_dir
        # 确保日志目录存在
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
    
    def save_meeting_log(self, meeting_data: Dict[str, Any]) -> str:
        """保存会议日志"""
        meeting_id = meeting_data.get("meeting_id")
        if not meeting_id:
            meeting_id = datetime.now().strftime("%Y%m%d%H%M%S")
            meeting_data["meeting_id"] = meeting_id
        
        # 构建文件名和路径
        filename = f"{meeting_id}.json"
        filepath = os.path.join(self.log_dir, filename)
        
        # 保存为JSON文件
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(meeting_data, f, ensure_ascii=False, indent=2)
        
        return meeting_id
    
    def get_meeting_log(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        """根据会议ID获取会议日志"""
        filepath = os.path.join(self.log_dir, f"{meeting_id}.json")
        
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, "r", encoding="utf-8") as f:
            meeting_data = json.load(f)
        
        return meeting_data
    
    def get_all_meetings(self) -> List[Dict[str, Any]]:
        """获取所有会议的摘要信息"""
        meetings = []
        
        # 遍历日志目录中的所有JSON文件
        for filename in os.listdir(self.log_dir):
            if not filename.endswith(".json"):
                continue
            
            filepath = os.path.join(self.log_dir, filename)
            
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    meeting_data = json.load(f)
                
                # 提取摘要信息
                meetings.append({
                    "meeting_id": meeting_data.get("meeting_id"),
                    "topic": meeting_data.get("topic"),
                    "mode": meeting_data.get("mode"),
                    "start_time": meeting_data.get("start_time"),
                    "end_time": meeting_data.get("end_time"),
                    "status": meeting_data.get("status"),
                    "agent_count": len(meeting_data.get("agents", []))
                })
            except Exception as e:
                print(f"读取文件 {filename} 时出错: {e}")
        
        # 按开始时间排序，最新的会议排在前面
        meetings.sort(key=lambda x: x.get("start_time", ""), reverse=True)
        
        return meetings
    
    def search_meetings(self, keyword: str) -> List[Dict[str, Any]]:
        """搜索会议记录"""
        all_meetings = self.get_all_meetings()
        
        # 过滤包含关键字的会议
        filtered_meetings = []
        for meeting in all_meetings:
            if (keyword.lower() in meeting.get("topic", "").lower() or
                keyword.lower() in meeting.get("mode", "").lower()):
                filtered_meetings.append(meeting)
        
        return filtered_meetings 