"""
SQLAlchemy models for FitConnect database
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    """User role enumeration"""
    CLIENT = "client"
    TRAINER = "trainer"
    ADMIN = "admin"


class SessionStatus(str, enum.Enum):
    """Session status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MessageStatus(str, enum.Enum):
    """Message status enumeration"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class Specialty(str, enum.Enum):
    """Trainer specialty enumeration"""
    STRENGTH_TRAINING = "Strength Training"
    WEIGHT_LOSS = "Weight Loss"
    YOGA = "Yoga"
    REHABILITATION = "Rehabilitation"
    SPORTS_PERFORMANCE = "Sports Performance"
    PRENATAL_FITNESS = "Prenatal Fitness"


class Availability(str, enum.Enum):
    """Availability enumeration"""
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    EVENING = "Evening"
    WEEKENDS = "Weekends"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    avatar = Column(String(500))
    phone = Column(String(20))
    date_of_birth = Column(DateTime)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trainer_profile = relationship("Trainer", back_populates="user", uselist=False)
    sessions = relationship("Session", back_populates="client")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class Trainer(Base):
    """Trainer model"""
    __tablename__ = "trainers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    specialty = Column(Enum(Specialty), nullable=False)
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    price_per_session = Column(Float, nullable=False)
    bio = Column(Text)
    cover_image = Column(String(500))
    experience_years = Column(Integer, default=0)
    certifications = Column(Text)  # JSON string of certifications
    availability = Column(Text)  # JSON string of availability
    location = Column(String(255))
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="trainer_profile")
    sessions = relationship("Session", back_populates="trainer")
    programs = relationship("Program", back_populates="trainer")


class Program(Base):
    """Workout program model"""
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    duration_weeks = Column(Integer, nullable=False)
    difficulty_level = Column(String(50))
    goals = Column(Text)  # JSON string of goals
    exercises = Column(Text)  # JSON string of exercises
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trainer = relationship("Trainer", back_populates="programs")


class Session(Base):
    """Training session model"""
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    session_type = Column(String(100), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    location = Column(String(255))
    status = Column(Enum(SessionStatus), default=SessionStatus.PENDING)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("User", back_populates="sessions")
    trainer = relationship("Trainer", back_populates="sessions")


class Message(Base):
    """Message model"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255))
    content = Column(Text, nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")


class Booking(Base):
    """Booking model for session requests"""
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    preferred_dates = Column(Text)  # JSON string of preferred dates
    session_type = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    location = Column(String(255))
    special_requests = Column(Text)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("User")
    trainer = relationship("Trainer")


class ScheduleOptimization(Base):
    """Schedule optimization results model"""
    __tablename__ = "schedule_optimizations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    optimization_type = Column(String(50), nullable=False)  # 'customer' or 'trainer'
    criteria = Column(Text)  # JSON string of optimization criteria
    constraints = Column(Text)  # JSON string of constraints
    result_data = Column(Text)  # JSON string of optimization results
    confidence_score = Column(Float)
    is_applied = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
