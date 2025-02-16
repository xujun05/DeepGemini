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
    type = Column(String)  # 'reasoning', 'execution', 'general'
    provider = Column(String)
    api_key = Column(String)
    api_url = Column(String)
    model_name = Column(String)
    system_prompt = Column(String)
    
    # Default parameters
    temperature = Column(Float, default=0.7)
    top_p = Column(Float, default=0.9)
    max_tokens = Column(Integer, default=2000)
    presence_penalty = Column(Float, default=0.0)
    frequency_penalty = Column(Float, default=0.0)
    
    # Relationships
    configuration_steps = relationship("ConfigurationStep", back_populates="model")

class ConfigurationStep(Base):
    __tablename__ = "configuration_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    configuration_id = Column(Integer, ForeignKey("configurations.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    step_type = Column(String)  # 'reasoning' or 'execution'
    order = Column(Integer)  # 步骤顺序
    system_prompt = Column(String, default="")
    
    configuration = relationship("Configuration", back_populates="steps")
    model = relationship("Model", back_populates="configuration_steps")

class Configuration(Base):
    __tablename__ = "configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Configuration settings
    reasoning_pattern = Column(String)  # Regex pattern to extract reasoning
    transfer_content = Column(JSON)  # Custom configuration for content transfer
    
    # Relationships
    steps = relationship("ConfigurationStep", back_populates="configuration", order_by="ConfigurationStep.order")

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