from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import os

# Create the database engine
DATABASE_URL = "sqlite:///./deepgemini.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

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
    
    # 添加与配置步骤的关系
    configuration_steps = relationship("ConfigurationStep", back_populates="model")

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