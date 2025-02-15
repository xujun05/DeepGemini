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
    type = Column(String)  # 'reasoning' or 'execution'
    provider = Column(String)  # 'anthropic', 'google', etc.
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
    reasoning_configurations = relationship(
        "Configuration",
        back_populates="reasoning_model",
        foreign_keys="Configuration.reasoning_model_id"
    )
    execution_configurations = relationship(
        "Configuration",
        back_populates="execution_model",
        foreign_keys="Configuration.execution_model_id"
    )

class Configuration(Base):
    __tablename__ = "configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    reasoning_model_id = Column(Integer, ForeignKey("models.id"))
    execution_model_id = Column(Integer, ForeignKey("models.id"))
    reasoning_pattern = Column(String, default="")
    is_active = Column(Boolean, default=True)
    transfer_content = Column(JSON, default=dict)
    reasoning_system_prompt = Column(String, default="")
    execution_system_prompt = Column(String, default="")
    
    # Configuration settings
    reasoning_pattern = Column(String)  # Regex pattern to extract reasoning
    transfer_content = Column(JSON)  # Custom configuration for content transfer
    
    # Relationships
    reasoning_model = relationship(
        "Model",
        back_populates="reasoning_configurations",
        foreign_keys=[reasoning_model_id]
    )
    execution_model = relationship(
        "Model",
        back_populates="execution_configurations",
        foreign_keys=[execution_model_id]
    )

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