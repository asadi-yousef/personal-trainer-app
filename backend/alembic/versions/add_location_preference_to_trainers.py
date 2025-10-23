"""add_location_preference_to_trainers

Revision ID: add_location_preference
Revises: 9127c694a6ae
Create Date: 2024-12-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_location_preference'
down_revision = '9127c694a6ae'
branch_labels = None
depends_on = None


def upgrade():
    """Add location_preference column to trainers table"""
    # Check if column already exists
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'trainers' 
        AND COLUMN_NAME = 'location_preference'
    """))
    
    column_exists = result.scalar() > 0
    
    if not column_exists:
        op.add_column('trainers', sa.Column('location_preference', sa.String(50), nullable=True, default='specific_gym'))


def downgrade():
    """Remove location_preference column from trainers table"""
    op.drop_column('trainers', 'location_preference')







