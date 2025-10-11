"""create trainer scheduling preferences table

Revision ID: create_trainer_scheduling_preferences
Revises: 
Create Date: 2025-01-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'create_trainer_scheduling_preferences'
down_revision = None  # Update this if you have previous migrations
branch_labels = None
depends_on = None


def upgrade():
    # Create trainer_scheduling_preferences table
    op.create_table(
        'trainer_scheduling_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trainer_id', sa.Integer(), nullable=False),
        sa.Column('max_sessions_per_day', sa.Integer(), nullable=False, server_default='8'),
        sa.Column('min_break_minutes', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('prefer_consecutive_sessions', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('work_start_time', sa.String(10), nullable=True, server_default='08:00'),
        sa.Column('work_end_time', sa.String(10), nullable=True, server_default='18:00'),
        sa.Column('days_off', sa.Text(), nullable=True, server_default='[]'),
        sa.Column('preferred_time_blocks', sa.Text(), nullable=True, server_default='["morning", "afternoon"]'),
        sa.Column('prioritize_recurring_clients', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('prioritize_high_value_sessions', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['trainer_id'], ['trainers.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('trainer_id')
    )
    
    # Create index on trainer_id for faster lookups
    op.create_index('ix_trainer_scheduling_preferences_trainer_id', 'trainer_scheduling_preferences', ['trainer_id'])


def downgrade():
    # Drop index
    op.drop_index('ix_trainer_scheduling_preferences_trainer_id', table_name='trainer_scheduling_preferences')
    
    # Drop table
    op.drop_table('trainer_scheduling_preferences')

