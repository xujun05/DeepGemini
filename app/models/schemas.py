from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Union, List
import json

class ModelBase(BaseModel):
    name: str
    type: str
    provider: str
    api_key: str
    api_url: str
    model_name: str
    max_tokens: int = 2000
    temperature: float = 0.7
    top_p: float = 1.0
    presence_penalty: float = 0.0
    frequency_penalty: float = 0.0
    enable_tools: bool = False
    tools: Optional[List[Dict]] = None
    tool_choice: Optional[Dict] = None
    enable_thinking: bool = False
    thinking_budget_tokens: int = 16000
    custom_parameters: Optional[Dict[str, Union[str, int, float, bool]]] = Field(default_factory=dict)

    @validator('temperature', 'top_p', pre=True)
    def convert_to_float(cls, v):
        if isinstance(v, str):
            return float(v)
        return v

    @validator('type')
    def validate_type(cls, v):
        valid_types = {'reasoning', 'execution', 'both'}
        if v.lower() not in valid_types:
            raise ValueError(f'Type must be one of {valid_types}')
        return v.lower()

    @validator('provider')
    def validate_provider(cls, v):
        valid_providers = {
            'deepseek', 'google', 'anthropic', 'oneapi', 
            'openrouter', '腾讯云', 'grok3', 'openai-completion', 'other'
        }
        if v.lower() not in valid_providers:
            raise ValueError(f'Provider must be one of {valid_providers}')
        return v.lower()

    @validator('tools', 'tool_choice', pre=True)
    def validate_json_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return None
        return v

    @validator('custom_parameters', pre=True)
    def validate_custom_parameters(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return {}
        return v if isinstance(v, dict) else {}

    class Config:
        from_attributes = True

class ModelCreate(ModelBase):
    pass

class Model(ModelBase):
    id: int

class ConfigurationStepBase(BaseModel):
    model_id: int
    step_type: str  # "reasoning" or "execution"
    step_order: int
    system_prompt: str = ""

class ConfigurationStepCreate(ConfigurationStepBase):
    pass

class ConfigurationStep(ConfigurationStepBase):
    id: int
    configuration_id: int

    class Config:
        orm_mode = True

class ConfigurationBase(BaseModel):
    name: str
    is_active: bool = True
    transfer_content: Dict = {}

class ConfigurationCreate(ConfigurationBase):
    steps: List[ConfigurationStepCreate]

class Configuration(ConfigurationBase):
    id: int
    steps: List[ConfigurationStep]

    class Config:
        from_attributes = True