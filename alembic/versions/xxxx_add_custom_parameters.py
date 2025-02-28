"""add custom parameters

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
    with op.batch_alter_table('models') as batch_op:
        batch_op.add_column(sa.Column('custom_parameters', sa.JSON(), nullable=True))
    
    # 为现有记录设置默认值
    op.execute("UPDATE models SET custom_parameters = '{}' WHERE custom_parameters IS NULL")

def downgrade() -> None:
    with op.batch_alter_table('models') as batch_op:
        batch_op.drop_column('custom_parameters') 