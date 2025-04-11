from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, JSON, ForeignKey, Text, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import os
from datetime import datetime

# Create the database engine
DATABASE_URL = "sqlite:///./deepgemini.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 角色与讨论组的多对多关系表
role_discussion_group = Table(
    'role_discussion_group', 
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id')),
    Column('discussion_group_id', Integer, ForeignKey('discussion_groups.id'))
)

class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String)  # 'reasoning', 'execution', or 'both'
    provider = Column(String)  # 'anthropic', 'google', etc.
    api_key = Column(String)
    api_url = Column(String)
    model_name = Column(String)
    
    # Default parameters
    temperature = Column(Float, default=0.7)
    top_p = Column(Float, default=1.0)
    max_tokens = Column(Integer, default=2000)
    presence_penalty = Column(Float, default=0.0)
    frequency_penalty = Column(Float, default=0.0)
    
    # Tool configuration
    enable_tools = Column(Boolean, server_default='0', nullable=False)
    tools = Column(JSON, nullable=True)  # 存储工具配置的JSON
    tool_choice = Column(JSON, nullable=True)  # 存储工具选择配置的JSON
    
    # Thinking configuration
    enable_thinking = Column(Boolean, server_default='0', nullable=False)
    thinking_budget_tokens = Column(Integer, server_default='16000', nullable=False)
    
    # 添加自定义参数字段，确保有默认值
    custom_parameters = Column(JSON, nullable=False, server_default='{}')
    
    # 添加与配置步骤的关系
    configuration_steps = relationship("ConfigurationStep", back_populates="model")
    
    # 添加关系
    roles = relationship("Role", back_populates="model")

class Configuration(Base):
    __tablename__ = "configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    transfer_content = Column(JSON, default=dict)
    
    # 保留步骤关系
    steps = relationship(
        "ConfigurationStep",
        back_populates="configuration",
        cascade="all, delete-orphan",
        order_by="ConfigurationStep.step_order"
    )

class ConfigurationStep(Base):
    __tablename__ = "configuration_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    configuration_id = Column(Integer, ForeignKey("configurations.id", ondelete="CASCADE"))
    model_id = Column(Integer, ForeignKey("models.id"))
    step_type = Column(String)  # reasoning 或 execution
    step_order = Column(Integer)  # 步骤顺序
    system_prompt = Column(String, default="")
    
    # 关系
    configuration = relationship("Configuration", back_populates="steps")
    model = relationship("Model", back_populates="configuration_steps")

class Role(Base):
    """角色模型"""
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    model_id = Column(Integer, ForeignKey('models.id'), nullable=False)
    personality = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)  # 存储技能列表
    parameters = Column(JSON, nullable=True)  # 存储模型参数
    system_prompt = Column(Text, nullable=True)  # 系统提示词
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, nullable=True)
    is_human = Column(Boolean, default=False)  # 是否为人类角色
    host_role_id = Column(Integer, ForeignKey('roles.id'), nullable=True)  # 人类角色寄生的agent角色ID
    
    # 关系
    model = relationship("Model", back_populates="roles")
    discussion_groups = relationship("DiscussionGroup", 
                                    secondary=role_discussion_group, 
                                    back_populates="roles")
    host_role = relationship("Role", remote_side=[id], foreign_keys=[host_role_id])

class DiscussionGroup(Base):
    """讨论组模型"""
    __tablename__ = 'discussion_groups'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    topic = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    mode = Column(String(50), nullable=False, default="discussion")  # 会议模式
    max_rounds = Column(Integer, default=3)  # 最大轮数
    summary_model_id = Column(Integer, ForeignKey('models.id'), nullable=True)  # 总结使用的模型
    summary_prompt = Column(Text, nullable=True)  # 自定义总结提示模板
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, nullable=True)
    
    # 关系
    roles = relationship("Role", 
                        secondary=role_discussion_group, 
                        back_populates="discussion_groups")
    summary_model = relationship("Model", foreign_keys=[summary_model_id])

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()