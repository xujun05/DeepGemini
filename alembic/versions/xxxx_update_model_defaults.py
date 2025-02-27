"""update model defaults

Revision ID: xxxx
Revises: previous_revision
Create Date: 2024-03-21 xx:xx:xx.xxxxxx

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'new_revision'
down_revision: Union[str, None] = '7b27956007a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 更新现有记录的默认值
    with op.batch_alter_table('models') as batch_op:
        # 先设置现有记录的默认值
        op.execute("UPDATE models SET enable_tools = '0' WHERE enable_tools IS NULL")
        op.execute("UPDATE models SET enable_thinking = '0' WHERE enable_thinking IS NULL")
        op.execute("UPDATE models SET thinking_budget_tokens = 16000 WHERE thinking_budget_tokens IS NULL")
        
        # 修改列定义
        batch_op.alter_column('enable_tools',
            existing_type=sa.Boolean(),
            nullable=False,
            server_default='0'
        )
        batch_op.alter_column('enable_thinking',
            existing_type=sa.Boolean(),
            nullable=False,
            server_default='0'
        )
        batch_op.alter_column('thinking_budget_tokens',
            existing_type=sa.Integer(),
            nullable=False,
            server_default='16000'
        )

def downgrade() -> None:
    with op.batch_alter_table('models') as batch_op:
        batch_op.alter_column('enable_tools',
            existing_type=sa.Boolean(),
            nullable=True,
            server_default=None
        )
        batch_op.alter_column('enable_thinking',
            existing_type=sa.Boolean(),
            nullable=True,
            server_default=None
        )
        batch_op.alter_column('thinking_budget_tokens',
            existing_type=sa.Integer(),
            nullable=True,
            server_default=None
        ) 