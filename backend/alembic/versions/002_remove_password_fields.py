"""Remove password fields from users

Revision ID: 002
Revises: 001
Create Date: 2025-07-24 04:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get the connection to check if columns exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Remove hashed_password column if it exists
    if 'hashed_password' in columns:
        op.drop_column('users', 'hashed_password')
    
    # Make name column nullable (allow incomplete profiles)
    try:
        op.alter_column('users', 'name', nullable=True)
    except Exception:
        # Column might already be nullable
        pass


def downgrade() -> None:
    # Add back the hashed_password column
    op.add_column('users', sa.Column('hashed_password', sa.String(), nullable=False, server_default=''))
    
    # Make name column not nullable again
    op.alter_column('users', 'name', nullable=False)