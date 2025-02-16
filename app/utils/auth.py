from fastapi import HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
    ALLOW_API_KEYS = [key_data["key"] for key_data in api_keys_data]
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
    logger.info(f"Loaded API key starting with: {key[:4] if len(key) >= 4 else key}")

# 安全配置
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 小时

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

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

async def verify_api_key(authorization: Optional[str] = Header(None)) -> None:
    """验证API密钥

    Args:
        authorization (Optional[str], optional): Authorization header中的API密钥. Defaults to Header(None).

    Raises:
        HTTPException: 当Authorization header缺失或API密钥无效时抛出401错误
    """
    if authorization is None:
        logger.warning("请求缺少Authorization header")
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )
    
    api_key = authorization.replace("Bearer ", "").strip()
    if api_key not in ALLOW_API_KEYS:
        logger.warning(f"无效的API密钥: {api_key}")
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    
    logger.info("API密钥验证通过")
