import os
import sys
from alembic.config import Config
from alembic import command

def run_migrations():
    # 获取当前目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 创建 Alembic 配置
    alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))
    
    try:
        # 运行迁移
        command.upgrade(alembic_cfg, "head")
        print("数据库迁移成功完成！")
    except Exception as e:
        print(f"迁移过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations() 