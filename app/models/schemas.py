from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Union, List

class ModelBase(BaseModel):
    name: str
    type: str  # 'reasoning', 'execution', 'general'
    provider: str
    api_key: str
    api_url: str
    model_name: Optional[str] = ""
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    top_p: float = 0.9
    max_tokens: int = 2000
    presence_penalty: float = 0.0
    frequency_penalty: float = 0.0

    @validator('temperature', 'top_p', pre=True)
    def convert_to_float(cls, v):
        if isinstance(v, str):
            return float(v)
        return v

    @validator('type')
    def validate_type(cls, v):
        valid_types = {'reasoning', 'execution', 'general'}
        if v.lower() not in valid_types:
            raise ValueError(f'Type must be one of {valid_types}')
        return v.lower()

class ModelCreate(ModelBase):
    pass

class Model(ModelBase):
    id: int

    class Config:
        from_attributes = True

class ConfigurationStepBase(BaseModel):
    model_id: int
    step_type: str
    order: int
    system_prompt: Optional[str] = ""

class ConfigurationStepCreate(ConfigurationStepBase):
    pass

class ConfigurationStep(ConfigurationStepBase):
    id: int
    configuration_id: int

    class Config:
        from_attributes = True

class ConfigurationBase(BaseModel):
    name: str
    is_active: bool = True

class ConfigurationCreate(ConfigurationBase):
    steps: List[ConfigurationStepCreate]

class ConfigurationStepResponse(ConfigurationStepBase):
    id: int

    class Config:
        from_attributes = True

class ConfigurationResponse(ConfigurationBase):
    id: int
    steps: List[ConfigurationStepResponse]

    class Config:
        from_attributes = True