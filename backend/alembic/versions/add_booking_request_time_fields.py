"""Add time fields to booking requests

Revision ID: add_booking_time_fields
Revises: 702a54793e02
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_booking_time_fields'
down_revision = '702a54793e02'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to booking_requests table
    op.add_column('booking_requests', sa.Column('start_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('booking_requests', sa.Column('end_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('booking_requests', sa.Column('training_type', sa.String(100), nullable=True))
    op.add_column('booking_requests', sa.Column('location_type', sa.Enum('gym', 'home', 'online', name='locationtype'), nullable=True))
    op.add_column('booking_requests', sa.Column('location_address', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove the columns
    op.drop_column('booking_requests', 'location_address')
    op.drop_column('booking_requests', 'location_type')
    op.drop_column('booking_requests', 'training_type')
    op.drop_column('booking_requests', 'end_time')
    op.drop_column('booking_requests', 'start_time')


