from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# 获取数据库URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./deepgemini.db")

# 创建SQLAlchemy引擎和会话
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建会话
db = SessionLocal()

# 执行原始SQL命令添加列
try:
    # 使用text()函数包装SQL语句
    statements = [
        text("ALTER TABLE discussion_groups ADD COLUMN summary_model_id INTEGER REFERENCES models(id)"),
        text("ALTER TABLE discussion_groups ADD COLUMN summary_prompt TEXT")
    ]
    
    for sql in statements:
        try:
            db.execute(sql)
            print(f"成功执行: {sql}")
        except Exception as e:
            print(f"执行 {sql} 时出错: {str(e)}")
    
    db.commit()
    print("成功添加总结相关列到discussion_groups表")
except Exception as e:
    db.rollback()
    print(f"添加列时出错: {str(e)}")
finally:
    db.close() 