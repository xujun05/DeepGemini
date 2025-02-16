"""update model relationships

Revision ID: xxx
Revises: previous_revision
Create Date: 2024-xx-xx

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'xxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 删除旧表
    op.drop_table('configurations')
    op.drop_table('models')
    
    # 创建新表
    op.create_table('models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=True),  # 'reasoning', 'execution', or 'both'
        sa.Column('provider', sa.String(), nullable=True),
        sa.Column('api_key', sa.String(), nullable=True),
        sa.Column('api_url', sa.String(), nullable=True),
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('system_prompt', sa.String(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=True),
        sa.Column('top_p', sa.Float(), nullable=True),
        sa.Column('max_tokens', sa.Integer(), nullable=True),
        sa.Column('presence_penalty', sa.Float(), nullable=True),
        sa.Column('frequency_penalty', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('transfer_content', sqlite.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('configuration_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('configuration_id', sa.Integer(), nullable=True),
        sa.Column('model_id', sa.Integer(), nullable=True),
        sa.Column('step_type', sa.String(), nullable=True),
        sa.Column('step_order', sa.Integer(), nullable=True),
        sa.Column('system_prompt', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['configuration_id'], ['configurations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('configuration_steps')
    op.drop_table('configurations')
    op.drop_table('models') 