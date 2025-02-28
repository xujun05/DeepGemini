"""update custom parameters default

Revision ID: xxxx
Revises: previous_revision
Create Date: 2024-03-21 xx:xx:xx.xxxxxx
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

revision = 'xxxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # SQLite 不支持修改列，所以需要重建表
    with op.batch_alter_table('models') as batch_op:
        batch_op.alter_column('custom_parameters',
                            existing_type=sa.JSON(),
                            nullable=False,
                            server_default='{}')
    
    # 更新现有记录
    op.execute("UPDATE models SET custom_parameters = '{}' WHERE custom_parameters IS NULL")

def downgrade() -> None:
    with op.batch_alter_table('models') as batch_op:
        batch_op.alter_column('custom_parameters',
                            existing_type=sa.JSON(),
                            nullable=True,
                            server_default=None) 