"""
API routes for payment processing (simulated for university project)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import secrets
import hashlib

from app.database import get_db
from app.models import Payment, PaymentStatus, Booking, User, Trainer
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentSummary,
    PaymentRefund,
    PaymentStats,
    PaymentStatusEnum
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


def generate_transaction_id() -> str:
    """Generate a simulated transaction ID"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    random_part = secrets.token_hex(8)
    return f"TXN-{timestamp}-{random_part.upper()}"


def get_card_type(card_number: str) -> str:
    """Determine card type from card number (basic simulation)"""
    if card_number.startswith('4'):
        return 'Visa'
    elif card_number.startswith('5'):
        return 'Mastercard'
    elif card_number.startswith('3'):
        return 'American Express'
    elif card_number.startswith('6'):
        return 'Discover'
    else:
        return 'Unknown'


def simulate_payment_processing(card_number: str, cvv: str, amount: float) -> bool:
    """
    Simulate payment processing (ALWAYS SUCCEEDS for university project)
    In a real system, this would call a payment gateway API
    """
    # For testing: Always succeed
    # In a real system, you would integrate with Stripe, PayPal, etc.
    return True


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new payment for a booking (SIMULATED - NO REAL PAYMENT PROCESSING)
    
    This endpoint simulates payment processing for educational purposes.
    In production, this would integrate with real payment gateways.
    """
    # Get the booking
    booking = db.query(Booking).filter(Booking.id == payment_data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify user is the client for this booking
    if booking.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to pay for this booking"
        )
    
    # Check if booking already has a completed payment
    existing_payment = db.query(Payment).filter(
        Payment.booking_id == payment_data.booking_id,
        Payment.status == PaymentStatus.COMPLETED
    ).first()
    
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking has already been paid"
        )
    
    # Validate expiry date
    current_year = datetime.utcnow().year
    current_month = datetime.utcnow().month
    
    if payment_data.expiry_year < current_year or \
       (payment_data.expiry_year == current_year and payment_data.expiry_month < current_month):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Card has expired"
        )
    
    # Get amount from booking - calculate if not set
    amount = booking.total_cost
    if not amount or amount <= 0:
        # Calculate amount from trainer's pricing
        trainer = db.query(Trainer).filter(Trainer.id == booking.trainer_id).first()
        if trainer:
            hours = booking.duration_minutes / 60
            amount = trainer.price_per_hour * hours if trainer.price_per_hour > 0 else trainer.price_per_session
            # Update the booking with calculated amount
            booking.total_cost = amount
            db.commit()
    
    if not amount or amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking amount - unable to calculate cost"
        )
    
    # Simulate payment processing
    payment_successful = simulate_payment_processing(
        payment_data.card_number,
        payment_data.cvv,
        amount
    )
    
    # Extract last 4 digits only (for security)
    card_last_four = payment_data.card_number[-4:]
    
    # Generate transaction ID
    transaction_id = generate_transaction_id()
    
    # Determine card type if not provided
    card_type = payment_data.card_type or get_card_type(payment_data.card_number)
    
    # Create payment record
    payment = Payment(
        booking_id=payment_data.booking_id,
        client_id=current_user.id,
        trainer_id=booking.trainer_id,
        amount=amount,
        currency="USD",
        status=PaymentStatus.COMPLETED if payment_successful else PaymentStatus.FAILED,
        card_last_four=card_last_four,
        card_type=card_type,
        cardholder_name=payment_data.cardholder_name,
        payment_method="credit_card",
        transaction_id=transaction_id,
        payment_date=datetime.utcnow(),
        description=f"Payment for {booking.session_type} session",
        notes=payment_data.notes
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment


@router.get("/", response_model=List[PaymentSummary])
async def get_payments(
    status: Optional[PaymentStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all payments for the current user
    - Clients see their own payments
    - Trainers see payments they've received
    - Admins see all payments
    """
    query = db.query(Payment)
    
    # Filter by user role
    if current_user.role == "client":
        query = query.filter(Payment.client_id == current_user.id)
    elif current_user.role == "trainer":
        if current_user.trainer_profile:
            query = query.filter(Payment.trainer_id == current_user.trainer_profile.id)
        else:
            query = query.filter(Payment.id == -1)  # Return empty
    # Admin can see all
    
    # Apply status filter
    if status:
        query = query.filter(Payment.status == status.value)
    
    payments = query.order_by(Payment.payment_date.desc()).all()
    
    # Add additional info for response
    result = []
    for payment in payments:
        payment_dict = PaymentSummary.from_orm(payment)
        
        # Add trainer name if available
        if payment.trainer and payment.trainer.user:
            payment_dict.trainer_name = payment.trainer.user.full_name
        
        # Add session type from booking
        if payment.booking:
            payment_dict.session_type = payment.booking.session_type
        
        result.append(payment_dict)
    
    return result


@router.get("/my-payments", response_model=List[PaymentSummary])
async def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payments made by the current user (client view)"""
    payments = db.query(Payment).filter(
        Payment.client_id == current_user.id
    ).order_by(Payment.payment_date.desc()).all()
    
    # Add additional info
    result = []
    for payment in payments:
        payment_dict = PaymentSummary.from_orm(payment)
        
        if payment.trainer and payment.trainer.user:
            payment_dict.trainer_name = payment.trainer.user.full_name
        
        if payment.booking:
            payment_dict.session_type = payment.booking.session_type
        
        result.append(payment_dict)
    
    return result


@router.get("/stats", response_model=PaymentStats)
async def get_payment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment statistics for the current user"""
    query = db.query(Payment)
    
    # Filter by role
    if current_user.role == "client":
        query = query.filter(Payment.client_id == current_user.id)
    elif current_user.role == "trainer":
        if current_user.trainer_profile:
            query = query.filter(Payment.trainer_id == current_user.trainer_profile.id)
        else:
            query = query.filter(Payment.id == -1)
    
    payments = query.all()
    
    total_payments = len(payments)
    total_amount = sum(p.amount for p in payments)
    successful_payments = len([p for p in payments if p.status == PaymentStatus.COMPLETED])
    pending_payments = len([p for p in payments if p.status == PaymentStatus.PENDING])
    failed_payments = len([p for p in payments if p.status == PaymentStatus.FAILED])
    refunded_payments = len([p for p in payments if p.status == PaymentStatus.REFUNDED])
    average_payment = total_amount / total_payments if total_payments > 0 else 0.0
    
    return PaymentStats(
        total_payments=total_payments,
        total_amount=total_amount,
        successful_payments=successful_payments,
        pending_payments=pending_payments,
        failed_payments=failed_payments,
        refunded_payments=refunded_payments,
        average_payment=average_payment
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific payment by ID"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if current_user.role == "client" and payment.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this payment"
        )
    elif current_user.role == "trainer":
        if not current_user.trainer_profile or payment.trainer_id != current_user.trainer_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this payment"
            )
    
    return payment


@router.post("/refund", response_model=PaymentResponse)
async def refund_payment(
    refund_data: PaymentRefund,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a refund for a payment (SIMULATED)
    Only admins or trainers can issue refunds
    """
    # Only trainers and admins can refund
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can issue refunds"
        )
    
    payment = db.query(Payment).filter(Payment.id == refund_data.payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only refund completed payments"
        )
    
    # Update payment status
    payment.status = PaymentStatus.REFUNDED
    payment.notes = f"{payment.notes or ''}\nRefund Reason: {refund_data.refund_reason}"
    payment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payment)
    
    return payment

