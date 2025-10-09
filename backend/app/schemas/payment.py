"""
Payment schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class PaymentStatusEnum(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentCreate(BaseModel):
    """Schema for creating a new payment"""
    booking_id: int = Field(..., description="ID of the booking being paid for")
    
    # Credit card details (simulated - not real processing)
    card_number: str = Field(..., min_length=13, max_length=19, description="Full card number (will only store last 4)")
    card_type: str = Field(..., description="Card type (Visa, Mastercard, Amex, etc.)")
    cardholder_name: str = Field(..., min_length=1, max_length=100, description="Name on card")
    expiry_month: int = Field(..., ge=1, le=12, description="Card expiry month")
    expiry_year: int = Field(..., ge=2024, description="Card expiry year")
    cvv: str = Field(..., min_length=3, max_length=4, description="Card CVV (not stored)")
    
    # Billing details
    billing_address: Optional[str] = Field(None, description="Billing address")
    billing_city: Optional[str] = Field(None, description="Billing city")
    billing_state: Optional[str] = Field(None, description="Billing state")
    billing_zip: Optional[str] = Field(None, description="Billing ZIP code")
    
    # Payment notes
    notes: Optional[str] = Field(None, description="Additional payment notes")
    
    @validator('card_number')
    def validate_card_number(cls, v):
        """Validate card number is numeric and reasonable length"""
        clean_number = v.replace(' ', '').replace('-', '')
        if not clean_number.isdigit():
            raise ValueError('Card number must contain only digits')
        if len(clean_number) < 13 or len(clean_number) > 19:
            raise ValueError('Card number must be between 13 and 19 digits')
        return clean_number
    
    @validator('cvv')
    def validate_cvv(cls, v):
        """Validate CVV is numeric and 3-4 digits"""
        if not v.isdigit():
            raise ValueError('CVV must contain only digits')
        if len(v) < 3 or len(v) > 4:
            raise ValueError('CVV must be 3 or 4 digits')
        return v


class PaymentResponse(BaseModel):
    """Schema for payment response"""
    id: int
    booking_id: int
    client_id: int
    trainer_id: int
    
    # Payment details
    amount: float
    currency: str
    status: PaymentStatusEnum
    
    # Card details (masked)
    card_last_four: str
    card_type: str
    cardholder_name: str
    
    # Payment metadata
    payment_method: str
    transaction_id: Optional[str]
    payment_date: datetime
    
    # Additional info
    description: Optional[str]
    notes: Optional[str]
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PaymentSummary(BaseModel):
    """Schema for payment summary (for lists)"""
    id: int
    booking_id: int
    amount: float
    currency: str
    status: PaymentStatusEnum
    card_last_four: str
    card_type: str
    payment_date: datetime
    transaction_id: Optional[str]
    
    # Additional fields for client view
    trainer_name: Optional[str] = None
    session_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaymentRefund(BaseModel):
    """Schema for processing a refund"""
    payment_id: int
    refund_reason: str = Field(..., min_length=10, description="Reason for refund")
    refund_amount: Optional[float] = Field(None, description="Partial refund amount (optional)")


class PaymentStats(BaseModel):
    """Schema for payment statistics"""
    total_payments: int
    total_amount: float
    successful_payments: int
    pending_payments: int
    failed_payments: int
    refunded_payments: int
    average_payment: float
    currency: str = "USD"

