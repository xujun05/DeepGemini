import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Dict

from app.utils.logger import logger
from app.utils.auth import verify_api_key

from app.models.database import get_db, init_db, Model as DBModel, Configuration as DBConfiguration
from app.models.schemas import Model, ModelCreate, Configuration, ConfigurationCreate
from app.models.collaboration import ModelCollaboration

# 加载环境变量
load_dotenv()

app = FastAPI(title="DeepGemini API")

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# CORS设置
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*")
allow_origins_list = ALLOW_ORIGINS.split(",") if ALLOW_ORIGINS else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Model routes
@app.get("/v1/models")
async def get_models(db: Session = Depends(get_db)):
    """Return models in OpenAI format"""
    configurations = db.query(DBConfiguration).all()
    return {
        "object": "list",
        "data": [
            {
                "id": config.name,
                "object": "model",
                "created": 0,  # We don't track creation time currently
                "owned_by": ""  # We don't track ownership currently
            }
            for config in configurations
        ]
    }

@app.get("/v1/model_configs", response_model=List[Model])
async def get_model_configs(db: Session = Depends(get_db)):
    """Return the original model configurations"""
    return db.query(DBModel).all()

@app.post("/v1/models", response_model=Model)
async def create_model(model: ModelCreate, db: Session = Depends(get_db)):
    db_model = DBModel(**model.dict())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

@app.put("/v1/models/{model_id}", response_model=Model)
async def update_model(model_id: int, model: ModelCreate, db: Session = Depends(get_db)):
    db_model = db.query(DBModel).filter(DBModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    for key, value in model.dict().items():
        setattr(db_model, key, value)
    
    db.commit()
    db.refresh(db_model)
    return db_model

@app.delete("/v1/models/{model_id}")
async def delete_model(model_id: int, db: Session = Depends(get_db)):
    db_model = db.query(DBModel).filter(DBModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    db.delete(db_model)
    db.commit()
    return {"status": "success"}

# Configuration routes
@app.get("/v1/configurations", response_model=List[Configuration])
async def get_configurations(db: Session = Depends(get_db)):
    return db.query(DBConfiguration).all()

@app.post("/v1/configurations", response_model=Configuration)
async def create_configuration(config: ConfigurationCreate, db: Session = Depends(get_db)):
    db_config = DBConfiguration(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@app.put("/v1/configurations/{config_id}", response_model=Configuration)
async def update_configuration(config_id: int, config: ConfigurationCreate, db: Session = Depends(get_db)):
    db_config = db.query(DBConfiguration).filter(DBConfiguration.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # 更新所有字段，包括系统提示词
    update_data = config.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_config, key, value)
    
    try:
        db.commit()
        db.refresh(db_config)
        logger.info(f"配置已更新: {db_config.name}")
        logger.debug(f"系统提示词 - 推理: {db_config.reasoning_system_prompt}, 执行: {db_config.execution_system_prompt}")
        return db_config
    except Exception as e:
        db.rollback()
        logger.error(f"更新配置时发生错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/v1/configurations/{config_id}")
async def delete_configuration(config_id: int, db: Session = Depends(get_db)):
    db_config = db.query(DBConfiguration).filter(DBConfiguration.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    db.delete(db_config)
    db.commit()
    return {"status": "success"}

# Chat completion endpoint with configuration support
@app.post("/v1/chat/completions", dependencies=[Depends(verify_api_key)])
async def chat_completions(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        body = await request.json()
        messages = body.get("messages", [])
        model = body.get("model")
        
        logger.info(f"收到聊天请求，模型: {model}")
        logger.debug(f"消息内容: {messages}")
        
        if not model:
            raise HTTPException(status_code=400, detail="Model is required")
        
        # 查找匹配的活跃配置
        config = db.query(DBConfiguration).filter(
            DBConfiguration.name == model,
            DBConfiguration.is_active == True
        ).first()
        
        if not config:
            logger.error(f"未找到模型 {model} 的活跃配置")
            raise HTTPException(status_code=404, detail=f"No active configuration found for model {model}")
        
        logger.info(f"找到配置: {config.name}, 推理模型ID: {config.reasoning_model_id}, 执行模型ID: {config.execution_model_id}")
        
        # 获取推理模型和执行模型的详细信息
        reasoning_model = db.query(DBModel).filter(DBModel.id == config.reasoning_model_id).first()
        execution_model = db.query(DBModel).filter(DBModel.id == config.execution_model_id).first()
        
        if not reasoning_model or not execution_model:
            logger.error("未找到一个或多个模型配置")
            raise HTTPException(status_code=404, detail="One or more models not found")
        
        logger.info(f"推理模型: {reasoning_model.name} ({reasoning_model.provider})")
        logger.info(f"执行模型: {execution_model.name} ({execution_model.provider})")
        
        # 创建模型配置字典
        reasoning_config = {
            'provider': reasoning_model.provider,
            'api_key': reasoning_model.api_key,
            'api_url': reasoning_model.api_url,
            'max_tokens': reasoning_model.max_tokens,
            'model_name': reasoning_model.model_name,
            'temperature': float(reasoning_model.temperature),
            'top_p': float(reasoning_model.top_p)
        }

        execution_config = {
            'provider': execution_model.provider,
            'api_key': execution_model.api_key,
            'api_url': execution_model.api_url,
            'max_tokens': execution_model.max_tokens,
            'model_name': execution_model.model_name,
            'temperature': float(execution_model.temperature),
            'top_p': float(execution_model.top_p)
        }

        logger.debug(f"推理模型配置: {reasoning_config}")
        logger.debug(f"执行模型配置: {execution_config}")

        # 创建协作处理器
        processor = ModelCollaboration(
            reasoning_model_config=reasoning_config,
            execution_model_config=execution_config,
            is_origin_reasoning=True,
            reasoning_system_prompt=config.reasoning_system_prompt,
            execution_system_prompt=config.execution_system_prompt
        )
        
        # 获取流式参数
        stream = body.get("stream", True)
        logger.info(f"流式输出: {stream}")
        
        # 构建模型参数
        model_arg = (
            float(reasoning_model.temperature),
            float(reasoning_model.top_p),
            float(reasoning_model.max_tokens),
            float(reasoning_model.presence_penalty),
            float(reasoning_model.frequency_penalty)
        )
        
        logger.debug(f"模型参数: {model_arg}")
        
        # 处理请求
        if stream:
            logger.info("开始流式处理")
            return StreamingResponse(
                processor.chat_completions_with_stream(
                    messages=messages,
                    model_arg=model_arg
                ),
                media_type="text/event-stream"
            )
        else:
            logger.info("开始非流式处理")
            response = await processor.chat_completions_without_stream(
                messages=messages,
                model_arg=model_arg
            )
            return response
            
    except Exception as e:
        logger.error(f"处理请求时发生错误: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to DeepGemini API"}