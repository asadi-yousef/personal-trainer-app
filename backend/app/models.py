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


class MessageType(str, enum.Enum):
    """Message type enumeration"""
    GENERAL = "general"
    BOOKING_REQUEST = "booking_request"
    PROGRAM_UPDATE = "program_update"
    SESSION_REMINDER = "session_reminder"
    PROGRESS_UPDATE = "progress_update"
    URGENT = "urgent"


class ConversationStatus(str, enum.Enum):
    """Conversation status enumeration"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


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
    availability_schedule = relationship("TrainerAvailability", back_populates="trainer")


class Program(Base):
    """Enhanced workout program model"""
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    duration_weeks = Column(Integer, nullable=False)
    difficulty_level = Column(String(50))  # "Beginner", "Intermediate", "Advanced"
    program_type = Column(String(100))  # "Weight Loss", "Strength", "Cardio", "Flexibility"
    
    # Program details
    goals = Column(Text)  # JSON string of goals
    equipment_needed = Column(Text)  # JSON string of required equipment
    target_audience = Column(String(255))  # "General", "Athletes", "Seniors", etc.
    
    # Pricing and availability
    price = Column(Float, default=0.0)
    is_public = Column(Boolean, default=False)  # Can other trainers use this template
    is_template = Column(Boolean, default=False)  # Is this a reusable template
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trainer = relationship("Trainer", back_populates="programs")
    workouts = relationship("Workout", back_populates="program")
    program_assignments = relationship("ProgramAssignment", back_populates="program")


class Workout(Base):
    """Individual workout within a program"""
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    week_number = Column(Integer, nullable=False)  # Week 1, 2, 3, etc.
    day_number = Column(Integer, nullable=False)  # Day 1, 2, 3, etc. within the week
    title = Column(String(255), nullable=False)
    description = Column(Text)
    estimated_duration_minutes = Column(Integer, default=60)
    focus_area = Column(String(100))  # "Upper Body", "Lower Body", "Cardio", "Full Body"
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    program = relationship("Program", back_populates="workouts")
    exercises = relationship("WorkoutExercise", back_populates="workout")


class Exercise(Base):
    """Exercise library/database"""
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    muscle_groups = Column(Text)  # JSON array of muscle groups
    equipment_needed = Column(Text)  # JSON array of equipment
    difficulty_level = Column(String(50))  # "Beginner", "Intermediate", "Advanced"
    exercise_type = Column(String(100))  # "Strength", "Cardio", "Flexibility", "Balance"
    instructions = Column(Text)  # Step-by-step instructions
    tips = Column(Text)  # Safety tips and variations
    video_url = Column(String(500))  # Link to demonstration video
    image_url = Column(String(500))  # Link to exercise image
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    workout_exercises = relationship("WorkoutExercise", back_populates="exercise")


class WorkoutExercise(Base):
    """Exercise within a specific workout (with sets/reps)"""
    __tablename__ = "workout_exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    
    # Exercise parameters
    sets = Column(Integer, default=3)
    reps = Column(String(100))  # Can be "10-12", "AMRAP", "30 seconds", etc.
    weight = Column(String(100))  # Can be "Bodyweight", "10-15 lbs", etc.
    rest_seconds = Column(Integer, default=60)
    order = Column(Integer, default=1)  # Order within the workout
    
    # Optional parameters
    distance = Column(String(100))  # For cardio exercises
    duration_seconds = Column(Integer)  # For time-based exercises
    notes = Column(Text)  # Specific notes for this exercise in this workout
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    workout = relationship("Workout", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="workout_exercises")


class ProgramAssignment(Base):
    """Assignment of a program to a client"""
    __tablename__ = "program_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    
    # Assignment details
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    current_week = Column(Integer, default=1)
    current_day = Column(Integer, default=1)
    
    # Status and progress
    status = Column(String(50), default="active")  # "active", "completed", "paused", "cancelled"
    completion_percentage = Column(Float, default=0.0)
    
    # Customization
    custom_notes = Column(Text)  # Trainer notes for this client
    modifications = Column(Text)  # JSON string of program modifications
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    program = relationship("Program", back_populates="program_assignments")
    client = relationship("User")
    trainer = relationship("Trainer")


class WorkoutProgress(Base):
    """Client's progress tracking for individual workouts"""
    __tablename__ = "workout_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    program_assignment_id = Column(Integer, ForeignKey("program_assignments.id"), nullable=False)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Workout completion
    completed_date = Column(DateTime(timezone=True))
    actual_duration_minutes = Column(Integer)
    client_rating = Column(Integer)  # 1-5 difficulty rating
    client_notes = Column(Text)
    trainer_notes = Column(Text)
    
    # Performance tracking
    exercises_completed = Column(Integer, default=0)
    total_exercises = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    program_assignment = relationship("ProgramAssignment")
    workout = relationship("Workout")
    client = relationship("User")


class Session(Base):
    """Enhanced training session model with comprehensive tracking"""
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    program_assignment_id = Column(Integer, ForeignKey("program_assignments.id"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text)
    session_type = Column(String(100), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    location = Column(String(255))
    status = Column(Enum(SessionStatus), default=SessionStatus.PENDING)
    notes = Column(Text)
    
    # Session completion tracking
    actual_start_time = Column(DateTime(timezone=True))
    actual_end_time = Column(DateTime(timezone=True))
    actual_duration_minutes = Column(Integer)
    
    # Ratings and feedback
    client_rating = Column(Integer)  # 1-5 overall session rating
    trainer_rating = Column(Integer)  # 1-5 client performance rating
    difficulty_rating = Column(Integer)  # 1-5 how hard the session was
    client_feedback = Column(Text)
    trainer_feedback = Column(Text)
    
    # Energy and mood tracking
    client_energy_before = Column(Integer)  # 1-5 scale
    client_energy_after = Column(Integer)  # 1-5 scale
    client_mood_before = Column(String(50))  # "Great", "Good", "Okay", "Tired", "Stressed"
    client_mood_after = Column(String(50))
    
    # Session metrics
    calories_burned = Column(Integer)
    avg_heart_rate = Column(Integer)
    max_heart_rate = Column(Integer)
    session_intensity = Column(String(20))  # "Low", "Moderate", "High"
    
    # Progress tracking
    exercises_completed = Column(Integer, default=0)
    total_exercises_planned = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    
    # Photos and media
    before_photos = Column(Text)  # JSON array of photo URLs
    after_photos = Column(Text)  # JSON array of photo URLs
    workout_videos = Column(Text)  # JSON array of video URLs
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("User", back_populates="sessions")
    trainer = relationship("Trainer", back_populates="sessions")
    booking = relationship("Booking", back_populates="sessions")
    program_assignment = relationship("ProgramAssignment")
    exercise_performances = relationship("ExercisePerformance", back_populates="session")
    session_goals = relationship("SessionGoal", back_populates="session")


class ExercisePerformance(Base):
    """Individual exercise performance within a session"""
    __tablename__ = "exercise_performances"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    
    # Exercise execution
    sets_planned = Column(Integer, nullable=False)
    sets_completed = Column(Integer, nullable=False)
    reps_planned = Column(String(100))  # "10-12", "AMRAP", etc.
    reps_completed = Column(Text)  # JSON array of actual reps per set
    weight_planned = Column(String(100))
    weight_used = Column(Text)  # JSON array of actual weights per set
    rest_time_seconds = Column(Integer)
    
    # Performance metrics
    form_rating = Column(Integer)  # 1-5 trainer rating of form
    difficulty_felt = Column(Integer)  # 1-5 client rating of difficulty
    rpe_rating = Column(Integer)  # Rate of Perceived Exertion 1-10
    tempo_seconds = Column(Text)  # JSON: {"eccentric": 3, "pause": 1, "concentric": 2}
    
    # Cardio-specific metrics
    distance_covered = Column(Float)  # in miles/km
    duration_seconds = Column(Integer)
    avg_pace = Column(String(20))  # "8:30/mile"
    elevation_gain = Column(Float)  # in feet/meters
    
    # Notes and observations
    trainer_notes = Column(Text)
    client_notes = Column(Text)
    modifications_made = Column(Text)  # Any adjustments during exercise
    equipment_used = Column(Text)  # JSON array of equipment
    
    # Timing
    exercise_order = Column(Integer)  # Order within the session
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="exercise_performances")
    exercise = relationship("Exercise")


class SessionGoal(Base):
    """Goals tracked during a specific session"""
    __tablename__ = "session_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    goal_name = Column(String(255), nullable=False)
    goal_type = Column(String(50))  # "Weight", "Strength", "Endurance", "Flexibility", "Skill"
    
    # Goal metrics
    target_value = Column(Float)
    actual_value = Column(Float)
    unit = Column(String(20))  # "lbs", "reps", "minutes", "inches", etc.
    
    # Progress assessment
    progress_rating = Column(Integer)  # 1-5 how well goal was met
    notes = Column(Text)
    trainer_assessment = Column(Text)
    
    # Comparison with previous sessions
    previous_value = Column(Float)
    improvement_percentage = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="session_goals")


class FitnessGoal(Base):
    """Long-term fitness goals for clients"""
    __tablename__ = "fitness_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    
    # Goal details
    goal_name = Column(String(255), nullable=False)
    goal_description = Column(Text)
    goal_type = Column(String(50))  # "Weight Loss", "Muscle Gain", "Strength", "Endurance", etc.
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String(20))
    
    # Timeline
    start_date = Column(DateTime(timezone=True), nullable=False)
    target_date = Column(DateTime(timezone=True), nullable=False)
    is_achieved = Column(Boolean, default=False)
    achieved_date = Column(DateTime(timezone=True))
    
    # Progress tracking
    milestones = Column(Text)  # JSON array of milestone objects
    progress_photos = Column(Text)  # JSON array of progress photo URLs
    notes = Column(Text)
    
    # Status
    is_active = Column(Boolean, default=True)
    priority = Column(String(20), default="medium")  # "low", "medium", "high"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("User")
    trainer = relationship("Trainer")


class SessionTemplate(Base):
    """Reusable session templates for trainers"""
    __tablename__ = "session_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    
    # Template details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    session_type = Column(String(100), nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=False)
    difficulty_level = Column(String(50))
    
    # Template structure
    exercises = Column(Text)  # JSON array of exercise configurations
    warmup_duration = Column(Integer, default=10)  # minutes
    cooldown_duration = Column(Integer, default=5)  # minutes
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    
    # Sharing
    is_public = Column(Boolean, default=False)
    tags = Column(Text)  # JSON array of tags
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trainer = relationship("Trainer")


class Conversation(Base):
    """Conversation model for grouping messages between users"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    participant1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    participant2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    last_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    last_message_at = Column(DateTime(timezone=True))
    status = Column(Enum(ConversationStatus), default=ConversationStatus.ACTIVE)
    
    # Conversation metadata
    subject = Column(String(255))  # Optional conversation subject
    is_pinned = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    participant1 = relationship("User", foreign_keys=[participant1_id])
    participant2 = relationship("User", foreign_keys=[participant2_id])
    last_message = relationship("Message", foreign_keys=[last_message_id])
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    """Enhanced message model"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Message content
    subject = Column(String(255))
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.GENERAL)
    
    # Message status and metadata
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    
    # Message attachments and formatting
    attachments = Column(Text)  # JSON array of attachment URLs
    is_important = Column(Boolean, default=False)
    is_encrypted = Column(Boolean, default=False)
    
    # Reply/thread information
    parent_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True))
    
    # Related entities (for context)
    related_booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    related_session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    related_program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")
    parent_message = relationship("Message", remote_side=[id], backref="replies")
    
    # Related entities
    related_booking = relationship("Booking")
    related_session = relationship("Session")
    related_program = relationship("Program")


class MessageTemplate(Base):
    """Message templates for common communications"""
    __tablename__ = "message_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    name = Column(String(255), nullable=False)
    subject = Column(String(255))
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.GENERAL)
    
    # Template variables (for personalization)
    variables = Column(Text)  # JSON array of available variables like {client_name}, {session_date}
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trainer = relationship("Trainer")


class Notification(Base):
    """System notifications for users"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    
    # Notification content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    notification_type = Column(Enum(MessageType), default=MessageType.GENERAL)
    
    # Status and delivery
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True))
    
    # Delivery channels
    email_sent = Column(Boolean, default=False)
    push_sent = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    
    # Priority and scheduling
    priority = Column(String(20), default="normal")  # "low", "normal", "high", "urgent"
    scheduled_for = Column(DateTime(timezone=True))  # For delayed notifications
    
    # Related entities
    related_booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    related_session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    related_program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    message = relationship("Message")
    related_booking = relationship("Booking")
    related_session = relationship("Session")
    related_program = relationship("Program")


class BookingStatus(str, enum.Enum):
    """Booking status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class Booking(Base):
    """Enhanced booking model for session requests"""
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    
    # Scheduling details
    preferred_start_date = Column(DateTime(timezone=True))
    preferred_end_date = Column(DateTime(timezone=True))
    preferred_times = Column(Text)  # JSON array of preferred time slots
    confirmed_date = Column(DateTime(timezone=True))
    
    # Session details
    session_type = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    location = Column(String(255))
    special_requests = Column(Text)
    
    # Status and metadata
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    priority_score = Column(Float, default=0.0)  # For optimization algorithm
    is_recurring = Column(Boolean, default=False)
    recurring_pattern = Column(String(50))  # "weekly", "biweekly", "monthly"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client = relationship("User")
    trainer = relationship("Trainer")
    sessions = relationship("Session", back_populates="booking")


class TrainerAvailability(Base):
    """Trainer availability schedule model"""
    __tablename__ = "trainer_availability"
    
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(10), nullable=False)  # Format: "09:00"
    end_time = Column(String(10), nullable=False)    # Format: "17:00"
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
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
