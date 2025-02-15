"""add system prompts

Revision ID: add_system_prompts
Revises: 
Create Date: 2024-02-15 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'add_system_prompts'
down_revision = None
branch_labels = None
depends_on = None

def has_column(table, column):
    """检查表中是否存在指定列"""
    conn = op.get_bind()
    insp = inspect(conn)
    columns = [c["name"] for c in insp.get_columns(table)]
    return column in columns

def upgrade() -> None:
    # 检查并添加新列
    if not has_column("configurations", "reasoning_system_prompt"):
        op.add_column('configurations', sa.Column('reasoning_system_prompt', sa.String(), nullable=True))
        # 更新现有记录，设置默认值
        op.execute("UPDATE configurations SET reasoning_system_prompt = '' WHERE reasoning_system_prompt IS NULL")
        # 修改列为非空
        op.alter_column('configurations', 'reasoning_system_prompt',
                        existing_type=sa.String(),
                        nullable=False,
                        server_default='')

    if not has_column("configurations", "execution_system_prompt"):
        op.add_column('configurations', sa.Column('execution_system_prompt', sa.String(), nullable=True))
        # 更新现有记录，设置默认值
        op.execute("UPDATE configurations SET execution_system_prompt = '' WHERE execution_system_prompt IS NULL")
        # 修改列为非空
        op.alter_column('configurations', 'execution_system_prompt',
                        existing_type=sa.String(),
                        nullable=False,
                        server_default='')

def downgrade() -> None:
    # 检查并删除列
    if has_column("configurations", "reasoning_system_prompt"):
        op.drop_column('configurations', 'reasoning_system_prompt')
    if has_column("configurations", "execution_system_prompt"):
        op.drop_column('configurations', 'execution_system_prompt') 