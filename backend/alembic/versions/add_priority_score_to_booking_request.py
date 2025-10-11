"""add priority_score to booking_request

Revision ID: priority_score_001
Revises: payments_001
Create Date: 2025-01-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'priority_score_001'
down_revision = 'payments_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add priority_score column to booking_requests table with default value
    op.add_column('booking_requests', 
        sa.Column('priority_score', sa.Float(), nullable=False, server_default='5.0')
    )


def downgrade():
    # Remove priority_score column
    op.drop_column('booking_requests', 'priority_score')

