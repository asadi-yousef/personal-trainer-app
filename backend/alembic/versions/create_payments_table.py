"""create payments table

Revision ID: payments_001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'payments_001'
down_revision = 'ae6f294b945e'  # Points to the latest existing migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create payments table"""
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('trainer_id', sa.Integer(), nullable=False),
        
        # Payment details
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', name='paymentstatus'), nullable=False, default='PENDING'),
        
        # Card details (last 4 digits only for security)
        sa.Column('card_last_four', sa.String(4), nullable=False),
        sa.Column('card_type', sa.String(20)),
        sa.Column('cardholder_name', sa.String(100), nullable=False),
        
        # Payment metadata
        sa.Column('payment_method', sa.String(50), default='credit_card'),
        sa.Column('transaction_id', sa.String(100), unique=True),
        sa.Column('payment_date', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        
        # Additional info
        sa.Column('description', sa.Text()),
        sa.Column('notes', sa.Text()),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('NOW()')),
        
        # Primary key
        sa.PrimaryKeyConstraint('id'),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
        sa.ForeignKeyConstraint(['client_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['trainer_id'], ['trainers.id'], ),
        
        # Indexes
        sa.Index('ix_payments_booking_id', 'booking_id'),
        sa.Index('ix_payments_client_id', 'client_id'),
        sa.Index('ix_payments_trainer_id', 'trainer_id'),
        sa.Index('ix_payments_status', 'status'),
        sa.Index('ix_payments_transaction_id', 'transaction_id'),
    )


def downgrade() -> None:
    """Drop payments table"""
    op.drop_table('payments')

