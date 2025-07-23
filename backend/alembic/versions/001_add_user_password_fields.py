"""Add password and verification fields to users

Revision ID: 001
Revises: 
Create Date: 2025-07-24 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get the connection to check if columns exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Add the missing columns to users table only if they don't exist
    if 'hashed_password' not in columns:
        op.add_column('users', sa.Column('hashed_password', sa.String(), nullable=False, server_default=''))
        # Remove server default after adding column
        op.alter_column('users', 'hashed_password', server_default=None)
    
    if 'email_verified' not in columns:
        op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=True, server_default='false'))
        # Remove server default after adding column
        op.alter_column('users', 'email_verified', server_default=None)
    
    if 'phone_verified' not in columns:
        op.add_column('users', sa.Column('phone_verified', sa.Boolean(), nullable=True, server_default='false'))
        # Remove server default after adding column
        op.alter_column('users', 'phone_verified', server_default=None)


def downgrade() -> None:
    # Remove the columns if we need to rollback
    op.drop_column('users', 'phone_verified')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'hashed_password')