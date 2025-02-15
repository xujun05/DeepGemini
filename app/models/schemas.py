from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Union

class ModelBase(BaseModel):
    name: str
    type: str
    provider: str
    api_key: str
    api_url: str
    model_name: Optional[str] = ""  # Make model_name optional with default empty string
    system_prompt: Optional[str] = None
    temperature: Union[float, str] = Field(default=0.7)  # Accept both float and string
    top_p: Union[float, str] = Field(default=0.9)  # Accept both float and string
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
        valid_types = {'reasoning', 'execution'}
        if v.lower() not in valid_types:
            raise ValueError(f'Type must be one of {valid_types}')
        return v.lower()

class ModelCreate(ModelBase):
    pass

class Model(ModelBase):
    id: int

    class Config:
        from_attributes = True

class ConfigurationBase(BaseModel):
    name: str
    reasoning_model_id: int
    execution_model_id: int
    reasoning_pattern: Optional[str] = None
    is_active: bool = True
    transfer_content: Dict = {}
    reasoning_system_prompt: str = ""  # 添加到基类中
    execution_system_prompt: str = ""  # 添加到基类中

class ConfigurationCreate(ConfigurationBase):
    pass

class Configuration(ConfigurationBase):
    id: int

    class Config:
        from_attributes = True