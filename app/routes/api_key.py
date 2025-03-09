from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from typing import List, Optional
from dotenv import load_dotenv
import json
from app.utils.logger import logger

router = APIRouter()

class ApiKey(BaseModel):
    api_key: str
    description: Optional[str] = None

class ApiKeyInDB(ApiKey):
    id: int

def update_env_api_keys(api_keys_list: List[ApiKeyInDB]):
    """更新 .env 文件中的 API 密钥"""
    env_path = '.env'
    with open(env_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # 将 API 密钥列表转换为 JSON 格式
    api_keys_data = [
        {
            "key": key.api_key,
            "description": key.description or "",
            "id": key.id
        }
        for key in api_keys_list
    ]
    api_keys_json = json.dumps(api_keys_data)

    with open(env_path, 'w', encoding='utf-8') as file:
        for line in lines:
            if line.startswith('ALLOW_API_KEY='):
                file.write(f'ALLOW_API_KEY={api_keys_json}\n')
            else:
                file.write(line)

    # 重新加载环境变量并直接更新 os.environ
    load_dotenv(override=True)
    # 直接修改环境变量
    os.environ['ALLOW_API_KEY'] = api_keys_json
    logger.info(f"已更新 API 密钥环境变量: {api_keys_json}")

# 存储 API 密钥的列表
api_keys: List[ApiKeyInDB] = []
current_id = 1

# 初始化时从环境变量加载默认 API 密钥
try:
    default_keys_json = os.getenv('ALLOW_API_KEY', '[]')
    default_keys_data = json.loads(default_keys_json)
    for key_data in default_keys_data:
        api_keys.append(ApiKeyInDB(
            id=key_data["id"],
            api_key=key_data["key"],
            description=key_data["description"]
        ))
        current_id = max(current_id, key_data["id"] + 1)
except json.JSONDecodeError:
    logger.warning("无法解析 API 密钥 JSON，使用空列表初始化")
except Exception as e:
    logger.error(f"加载 API 密钥时出错: {str(e)}")

@router.get("/api_keys")
async def get_api_keys():
    return api_keys

@router.post("/api_keys")
async def create_api_key(api_key: ApiKey):
    global current_id
    current_id += 1
    new_key = ApiKeyInDB(
        id=current_id,
        api_key=api_key.api_key,
        description=api_key.description
    )
    api_keys.append(new_key)
    # 更新 .env 文件
    update_env_api_keys(api_keys)
    return new_key

@router.delete("/api_keys/{key_id}")
async def delete_api_key(key_id: int):
    key_index = next((index for (index, key) in enumerate(api_keys) if key.id == key_id), None)
    if key_index is None:
        raise HTTPException(status_code=404, detail="API key not found")
    api_keys.pop(key_index)
    # 更新 .env 文件
    update_env_api_keys(api_keys)
    return {"message": "API key deleted"} 