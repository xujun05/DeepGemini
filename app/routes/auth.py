from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
from app.utils.auth import create_access_token, verify_token, update_admin_credentials
from typing import Optional

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class CredentialsUpdate(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None

@router.post("/login")
async def login(request: LoginRequest):
    # 验证用户名和密码
    if (request.username == os.getenv("ADMIN_USERNAME") and 
        request.password == os.getenv("ADMIN_PASSWORD")):
        access_token = create_access_token(data={"sub": request.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Incorrect username or password")

@router.post("/update-credentials")
async def update_credentials(
    request: CredentialsUpdate,
    username: str = Depends(verify_token)
):
    # 验证当前密码
    if request.current_password != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    # 更新凭据
    new_username = request.new_username or os.getenv("ADMIN_USERNAME")
    new_password = request.new_password or os.getenv("ADMIN_PASSWORD")
    
    try:
        update_admin_credentials(new_username, new_password)
        return {"message": "Credentials updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 