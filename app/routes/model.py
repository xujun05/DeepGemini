from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import logging

from app.models.database import get_db, Model as DBModel
from app.models.schemas import Model, ModelCreate

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/models", response_model=List[Model])
async def get_models(db: Session = Depends(get_db)):
    return db.query(DBModel).all()

@router.post("/models", response_model=Model)
async def create_model(model: ModelCreate, db: Session = Depends(get_db)):
    try:
        logger.debug(f"Creating model with data: {model.dict()}")
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
            'frequency_penalty': model.frequency_penalty,
            'enable_tools': model.enable_tools,
            'tools': model.tools,
            'tool_choice': model.tool_choice,
            'enable_thinking': model.enable_thinking,
            'thinking_budget_tokens': model.thinking_budget_tokens,
            'custom_parameters': model.custom_parameters if model.custom_parameters else {}
        }
        
        logger.debug(f"Processed model data: {model_data}")
        
        db_model = DBModel(**model_data)
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        logger.debug(f"Created model: {db_model.__dict__}")
        return db_model
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/models/{model_id}", response_model=Model)
async def update_model(model_id: int, model: ModelCreate, db: Session = Depends(get_db)):
    db_model = db.query(DBModel).filter(DBModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    for key, value in model.dict().items():
        setattr(db_model, key, value)
    
    try:
        db.commit()
        db.refresh(db_model)
        return db_model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/models/{model_id}")
async def delete_model(model_id: int, db: Session = Depends(get_db)):
    db_model = db.query(DBModel).filter(DBModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    db.delete(db_model)
    db.commit()
    return {"status": "success"} 