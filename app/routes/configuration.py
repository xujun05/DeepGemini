from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db, Configuration as DBConfiguration, ConfigurationStep, Model as DBModel
from app.models.schemas import Configuration, ConfigurationCreate

router = APIRouter()

@router.get("/configurations", response_model=List[Configuration])
async def get_configurations(db: Session = Depends(get_db)):
    return db.query(DBConfiguration).all()

@router.post("/configurations", response_model=Configuration)
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
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/configurations/{config_id}", response_model=Configuration)
async def update_configuration(config_id: int, config: ConfigurationCreate, db: Session = Depends(get_db)):
    try:
        db_config = db.query(DBConfiguration).filter(DBConfiguration.id == config_id).first()
        if not db_config:
            raise HTTPException(status_code=404, detail="Configuration not found")
        
        db_config.name = config.name
        db_config.is_active = config.is_active
        db_config.transfer_content = config.transfer_content
        
        db.query(ConfigurationStep).filter(
            ConfigurationStep.configuration_id == config_id
        ).delete()
        
        for step in config.steps:
            db_step = ConfigurationStep(
                configuration_id=config_id,
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
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/configurations/{config_id}")
async def delete_configuration(config_id: int, db: Session = Depends(get_db)):
    db_config = db.query(DBConfiguration).filter(DBConfiguration.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    db.delete(db_config)
    db.commit()
    return {"status": "success"} 