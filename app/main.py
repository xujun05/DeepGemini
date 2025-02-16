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

from app.models.database import get_db, init_db, Model as DBModel, Configuration as DBConfiguration, ConfigurationStep
from app.models.schemas import Model, ModelCreate, Configuration, ConfigurationCreate
from app.models import ModelCollaboration, MultiStepModelCollaboration

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
    try:
        # 从 model.dict() 中只获取数据库模型中存在的字段
        model_data = {
            'name': model.name,
            'type': model.type,
            'provider': model.provider,
            'api_key': model.api_key,
            'api_url': model.api_url,
            'model_name': model.model_name,
            'temperature': model.temperature,
            'top_p': model.top_p,
            'max_tokens': model.max_tokens,
            'presence_penalty': model.presence_penalty,
            'frequency_penalty': model.frequency_penalty
        }
        
        db_model = DBModel(**model_data)
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    except Exception as e:
        db.rollback()
        logger.error(f"创建模型时发生错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    try:
        # 验证所有模型是否存在且用途类型正确
        for step in config.steps:
            model = db.query(DBModel).filter(DBModel.id == step.model_id).first()
            if not model:
                raise HTTPException(status_code=404, detail=f"Model {step.model_id} not found")
            if model.type not in ["both", step.step_type]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Model {model.name} cannot be used for {step.step_type}"
                )

        # 创建配置
        db_config = DBConfiguration(
            name=config.name,
            is_active=config.is_active,
            transfer_content=config.transfer_content
        )
        db.add(db_config)
        db.commit()
        db.refresh(db_config)

        # 创建配置步骤
        for step in config.steps:
            db_step = ConfigurationStep(
                configuration_id=db_config.id,
                model_id=step.model_id,
                step_type=step.step_type,
                step_order=step.step_order,
                system_prompt=step.system_prompt
            )
            db.add(db_step)
        
        db.commit()
        db.refresh(db_config)
        return db_config
        
    except Exception as e:
        db.rollback()
        logger.error(f"创建配置时发生错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/v1/configurations/{config_id}", response_model=Configuration)
async def update_configuration(config_id: int, config: ConfigurationCreate, db: Session = Depends(get_db)):
    try:
        # 获取现有配置
        db_config = db.query(DBConfiguration).filter(DBConfiguration.id == config_id).first()
        if not db_config:
            raise HTTPException(status_code=404, detail="Configuration not found")
        
        # 更新基本字段
        db_config.name = config.name
        db_config.is_active = config.is_active
        db_config.transfer_content = config.transfer_content
        
        # 删除现有步骤
        db.query(ConfigurationStep).filter(
            ConfigurationStep.configuration_id == config_id
        ).delete()
        
        # 创建新步骤
        for step in config.steps:
            db_step = ConfigurationStep(
                configuration_id=config_id,
                model_id=step.model_id,
                step_type=step.step_type,
                step_order=step.step_order,
                system_prompt=step.system_prompt
            )
            db.add(db_step)
        
        try:
            db.commit()
            db.refresh(db_config)
            logger.info(f"配置已更新: {db_config.name}")
            return db_config
        except Exception as e:
            db.rollback()
            logger.error(f"更新配置时发生错误: {e}")
            raise HTTPException(status_code=500, detail=str(e))
            
    except Exception as e:
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
        
        if not model:
            raise HTTPException(status_code=400, detail="Model is required")
        
        # 查找匹配的活跃配置
        config = db.query(DBConfiguration).filter(
            DBConfiguration.name == model,
            DBConfiguration.is_active == True
        ).first()
        
        if not config:
            raise HTTPException(status_code=404, detail=f"No active configuration found for model {model}")
        
        # 获取配置步骤
        steps = db.query(ConfigurationStep).filter(
            ConfigurationStep.configuration_id == config.id
        ).order_by(ConfigurationStep.step_order).all()
        
        if not steps:
            raise HTTPException(status_code=404, detail="Configuration has no steps")
        
        # 创建多步骤处理器
        processor = MultiStepModelCollaboration(
            steps=[{
                'model': db.query(DBModel).get(step.model_id),
                'step_type': step.step_type,
                'system_prompt': step.system_prompt
            } for step in steps]
        )
        
        # 获取流式参数
        stream = body.get("stream", True)
        
        # 处理请求
        if stream:
            return StreamingResponse(
                processor.process_with_stream(messages),
                media_type="text/event-stream"
            )
        else:
            response = await processor.process_without_stream(messages)
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