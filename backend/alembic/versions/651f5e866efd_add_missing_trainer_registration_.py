"""Add missing trainer registration completion fields

Revision ID: 651f5e866efd
Revises: 9127c694a6ae
Create Date: 2025-10-07 19:08:10.943936

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '651f5e866efd'
down_revision = '9127c694a6ae'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing trainer registration completion fields
    op.add_column('trainers', sa.Column('price_per_hour', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('trainers', sa.Column('training_types', sa.Text(), nullable=True))
    op.add_column('trainers', sa.Column('gym_name', sa.String(length=255), nullable=True))
    op.add_column('trainers', sa.Column('gym_address', sa.Text(), nullable=True))
    op.add_column('trainers', sa.Column('gym_city', sa.String(length=100), nullable=True))
    op.add_column('trainers', sa.Column('gym_state', sa.String(length=50), nullable=True))
    op.add_column('trainers', sa.Column('gym_zip_code', sa.String(length=20), nullable=True))
    op.add_column('trainers', sa.Column('gym_phone', sa.String(length=20), nullable=True))
    op.add_column('trainers', sa.Column('profile_completion_status', sa.Enum('INCOMPLETE', 'COMPLETE', name='profilecompletionstatus'), nullable=True))
    op.add_column('trainers', sa.Column('profile_completion_date', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove trainer registration completion fields
    op.drop_column('trainers', 'profile_completion_date')
    op.drop_column('trainers', 'profile_completion_status')
    op.drop_column('trainers', 'gym_phone')
    op.drop_column('trainers', 'gym_zip_code')
    op.drop_column('trainers', 'gym_state')
    op.drop_column('trainers', 'gym_city')
    op.drop_column('trainers', 'gym_address')
    op.drop_column('trainers', 'gym_name')
    op.drop_column('trainers', 'training_types')
    op.drop_column('trainers', 'price_per_hour')











