from fastapi import HTTPException, Header, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from jwt import InvalidTokenError, encode, decode  # 从 PyJWT 导入
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from app.utils.logger import logger
from typing import Optional
import json

# 加载 .env 文件
logger.info(f"当前工作目录: {os.getcwd()}")
logger.info("尝试加载.env文件...")
load_dotenv(override=True)  # 添加override=True强制覆盖已存在的环境变量

# 获取环境变量
try:
    api_keys_json = os.getenv('ALLOW_API_KEY', '[]')
    # 移除可能的多余空格和换行符
    api_keys_json = api_keys_json.strip()
    api_keys_data = json.loads(api_keys_json)
    # 确保 api_keys_data 是列表
    if isinstance(api_keys_data, list):
        ALLOW_API_KEYS = [key_data["key"] for key_data in api_keys_data if isinstance(key_data, dict) and "key" in key_data]
    else:
        logger.error("API 密钥数据格式错误，应为 JSON 数组")
        ALLOW_API_KEYS = []
except json.JSONDecodeError:
    logger.warning("无法解析 API 密钥 JSON，使用空列表初始化")
    ALLOW_API_KEYS = []
except Exception as e:
    logger.error(f"加载 API 密钥时出错: {str(e)}")
    ALLOW_API_KEYS = []

logger.info(f"已加载 {len(ALLOW_API_KEYS)} 个 API 密钥")

if not ALLOW_API_KEYS:
    logger.warning("没有设置有效的 API 密钥，系统可能无法正常工作")

# 打印API密钥的前4位用于调试
for key in ALLOW_API_KEYS:
    logger.info(f"已加载 API 密钥，前缀为: {key[:8] if len(key) >= 8 else key}")

# 安全配置
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 小时

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# 定义 API 密钥头部
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def update_admin_credentials(username: str, password: str):
    """更新 .env 文件中的管理员凭据"""
    env_path = '.env'
    with open(env_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    with open(env_path, 'w', encoding='utf-8') as file:
        for line in lines:
            if line.startswith('ADMIN_USERNAME='):
                file.write(f'ADMIN_USERNAME={username}\n')
            elif line.startswith('ADMIN_PASSWORD='):
                file.write(f'ADMIN_PASSWORD={password}\n')
            else:
                file.write(line)

    # 重新加载环境变量
    load_dotenv(override=True)
    return {"message": "Credentials updated successfully"}

def get_api_key_header(api_key_header: str = Depends(api_key_header)):
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 移除 "Bearer " 前缀（如果有）
    if api_key_header.startswith("Bearer "):
        api_key_header = api_key_header[7:]
    
    return api_key_header

def verify_api_key(api_key: str = Depends(get_api_key_header)):
    """验证 API 密钥"""
    # 每次都从环境变量获取最新的 API 密钥列表
    try:
        api_keys_json = os.getenv('ALLOW_API_KEY', '[]')
        api_keys_data = json.loads(api_keys_json)
        available_keys = [key_data["key"] for key_data in api_keys_data]
        
        logger.info(f"正在验证 API 密钥: {api_key[:8]}...")
        logger.info(f"可用的 API 密钥: {[k[:8] for k in available_keys]}")
        
        if api_key not in available_keys:
            logger.warning(f"无效的API密钥: {api_key[:8]}...")
            raise HTTPException(
                status_code=401,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return api_key
    except json.JSONDecodeError as e:
        logger.error(f"解析 API 密钥 JSON 时出错: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error: Invalid API key format",
        )
    except Exception as e:
        logger.error(f"验证 API 密钥时发生未知错误: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error",
        )
