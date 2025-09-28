"""
Pydantic schemas for enhanced session tracking system
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class SessionIntensity(str, Enum):
    """Session intensity enumeration"""
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"


class MoodLevel(str, Enum):
    """Mood level enumeration"""
    EXCELLENT = "Excellent"
    GREAT = "Great"
    GOOD = "Good"
    OKAY = "Okay"
    TIRED = "Tired"
    STRESSED = "Stressed"


class GoalType(str, Enum):
    """Goal type enumeration"""
    WEIGHT = "Weight"
    STRENGTH = "Strength"
    ENDURANCE = "Endurance"
    FLEXIBILITY = "Flexibility"
    SKILL = "Skill"
    CARDIO = "Cardio"


class FitnessGoalType(str, Enum):
    """Fitness goal type enumeration"""
    WEIGHT_LOSS = "Weight Loss"
    MUSCLE_GAIN = "Muscle Gain"
    STRENGTH = "Strength"
    ENDURANCE = "Endurance"
    FLEXIBILITY = "Flexibility"
    CARDIOVASCULAR = "Cardiovascular"
    SPORTS_PERFORMANCE = "Sports Performance"


# Session Completion Schemas
class SessionCompletionBase(BaseModel):
    """Base session completion schema"""
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    
    # Energy and mood
    client_energy_before: Optional[int] = Field(None, ge=1, le=5)
    client_energy_after: Optional[int] = Field(None, ge=1, le=5)
    client_mood_before: Optional[MoodLevel] = None
    client_mood_after: Optional[MoodLevel] = None
    
    # Session metrics
    calories_burned: Optional[int] = Field(None, ge=0, le=2000)
    avg_heart_rate: Optional[int] = Field(None, ge=40, le=220)
    max_heart_rate: Optional[int] = Field(None, ge=40, le=220)
    session_intensity: Optional[SessionIntensity] = None
    
    # Media
    before_photos: Optional[List[str]] = Field(default_factory=list)
    after_photos: Optional[List[str]] = Field(default_factory=list)
    workout_videos: Optional[List[str]] = Field(default_factory=list)


class SessionCompletionCreate(SessionCompletionBase):
    """Schema for creating session completion"""
    pass


class SessionCompletionUpdate(SessionCompletionBase):
    """Schema for updating session completion"""
    pass


# Exercise Performance Schemas
class ExercisePerformanceBase(BaseModel):
    """Base exercise performance schema"""
    exercise_id: int
    sets_planned: int = Field(..., ge=1, le=20)
    sets_completed: int = Field(..., ge=0, le=20)
    reps_planned: str = Field(..., max_length=100)
    reps_completed: Optional[List[int]] = Field(default_factory=list)
    weight_planned: str = Field(..., max_length=100)
    weight_used: Optional[List[str]] = Field(default_factory=list)
    rest_time_seconds: Optional[int] = Field(None, ge=0, le=600)
    
    # Performance metrics
    form_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty_felt: Optional[int] = Field(None, ge=1, le=5)
    rpe_rating: Optional[int] = Field(None, ge=1, le=10)
    tempo_seconds: Optional[Dict[str, int]] = None
    
    # Cardio metrics
    distance_covered: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=1, le=7200)
    avg_pace: Optional[str] = Field(None, max_length=20)
    elevation_gain: Optional[float] = Field(None, ge=0)
    
    # Notes
    trainer_notes: Optional[str] = None
    client_notes: Optional[str] = None
    modifications_made: Optional[str] = None
    equipment_used: Optional[List[str]] = Field(default_factory=list)
    
    # Timing
    exercise_order: int = Field(..., ge=1)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExercisePerformanceCreate(ExercisePerformanceBase):
    """Schema for creating exercise performance"""
    pass


class ExercisePerformanceUpdate(BaseModel):
    """Schema for updating exercise performance"""
    sets_completed: Optional[int] = Field(None, ge=0, le=20)
    reps_completed: Optional[List[int]] = None
    weight_used: Optional[List[str]] = None
    form_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty_felt: Optional[int] = Field(None, ge=1, le=5)
    rpe_rating: Optional[int] = Field(None, ge=1, le=10)
    trainer_notes: Optional[str] = None
    client_notes: Optional[str] = None
    modifications_made: Optional[str] = None
    end_time: Optional[datetime] = None


class ExercisePerformanceResponse(ExercisePerformanceBase):
    """Schema for exercise performance response"""
    id: int
    session_id: int
    created_at: datetime
    
    # Related data
    exercise_name: Optional[str] = None
    exercise_description: Optional[str] = None
    
    class Config:
        from_attributes = True


# Session Goal Schemas
class SessionGoalBase(BaseModel):
    """Base session goal schema"""
    goal_name: str = Field(..., min_length=1, max_length=255)
    goal_type: GoalType
    target_value: Optional[float] = None
    actual_value: Optional[float] = None
    unit: Optional[str] = Field(None, max_length=20)
    progress_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    trainer_assessment: Optional[str] = None


class SessionGoalCreate(SessionGoalBase):
    """Schema for creating session goal"""
    pass


class SessionGoalUpdate(BaseModel):
    """Schema for updating session goal"""
    actual_value: Optional[float] = None
    progress_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    trainer_assessment: Optional[str] = None


class SessionGoalResponse(SessionGoalBase):
    """Schema for session goal response"""
    id: int
    session_id: int
    previous_value: Optional[float] = None
    improvement_percentage: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Fitness Goal Schemas
class FitnessGoalBase(BaseModel):
    """Base fitness goal schema"""
    goal_name: str = Field(..., min_length=1, max_length=255)
    goal_description: Optional[str] = None
    goal_type: FitnessGoalType
    target_value: float
    current_value: Optional[float] = 0.0
    unit: str = Field(..., max_length=20)
    start_date: datetime
    target_date: datetime
    priority: str = Field(default="medium", regex="^(low|medium|high)$")
    notes: Optional[str] = None


class FitnessGoalCreate(FitnessGoalBase):
    """Schema for creating fitness goal"""
    pass


class FitnessGoalUpdate(BaseModel):
    """Schema for updating fitness goal"""
    current_value: Optional[float] = None
    target_date: Optional[datetime] = None
    is_achieved: Optional[bool] = None
    notes: Optional[str] = None
    priority: Optional[str] = Field(None, regex="^(low|medium|high)$")


class FitnessGoalResponse(FitnessGoalBase):
    """Schema for fitness goal response"""
    id: int
    client_id: int
    trainer_id: int
    is_achieved: bool
    achieved_date: Optional[datetime]
    milestones: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    progress_photos: Optional[List[str]] = Field(default_factory=list)
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    client_name: Optional[str] = None
    trainer_name: Optional[str] = None
    progress_percentage: Optional[float] = None
    days_remaining: Optional[int] = None

    class Config:
        from_attributes = True


# Session Rating and Feedback Schemas
class SessionRatingBase(BaseModel):
    """Base session rating schema"""
    client_rating: Optional[int] = Field(None, ge=1, le=5)
    trainer_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    client_feedback: Optional[str] = None
    trainer_feedback: Optional[str] = None


class SessionRatingCreate(SessionRatingBase):
    """Schema for creating session rating"""
    pass


class SessionRatingUpdate(SessionRatingBase):
    """Schema for updating session rating"""
    pass


# Complete Session Tracking Schemas
class SessionTrackingCreate(BaseModel):
    """Schema for complete session tracking"""
    # Session completion
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    
    # Energy and mood
    client_energy_before: Optional[int] = Field(None, ge=1, le=5)
    client_energy_after: Optional[int] = Field(None, ge=1, le=5)
    client_mood_before: Optional[MoodLevel] = None
    client_mood_after: Optional[MoodLevel] = None
    
    # Session metrics
    calories_burned: Optional[int] = Field(None, ge=0, le=2000)
    avg_heart_rate: Optional[int] = Field(None, ge=40, le=220)
    max_heart_rate: Optional[int] = Field(None, ge=40, le=220)
    session_intensity: Optional[SessionIntensity] = None
    
    # Ratings and feedback
    client_rating: Optional[int] = Field(None, ge=1, le=5)
    trainer_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    client_feedback: Optional[str] = None
    trainer_feedback: Optional[str] = None
    
    # Exercise performances
    exercise_performances: Optional[List[ExercisePerformanceCreate]] = Field(default_factory=list)
    
    # Session goals
    session_goals: Optional[List[SessionGoalCreate]] = Field(default_factory=list)
    
    # Media
    before_photos: Optional[List[str]] = Field(default_factory=list)
    after_photos: Optional[List[str]] = Field(default_factory=list)
    workout_videos: Optional[List[str]] = Field(default_factory=list)


class SessionTrackingResponse(BaseModel):
    """Schema for complete session tracking response"""
    # Session info
    session_id: int
    session_title: str
    session_type: str
    scheduled_date: datetime
    
    # Completion tracking
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = None
    completion_percentage: Optional[float] = None
    
    # Energy and mood
    client_energy_before: Optional[int] = None
    client_energy_after: Optional[int] = None
    client_mood_before: Optional[str] = None
    client_mood_after: Optional[str] = None
    
    # Session metrics
    calories_burned: Optional[int] = None
    avg_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    session_intensity: Optional[str] = None
    
    # Ratings and feedback
    client_rating: Optional[int] = None
    trainer_rating: Optional[int] = None
    difficulty_rating: Optional[int] = None
    client_feedback: Optional[str] = None
    trainer_feedback: Optional[str] = None
    
    # Exercise performances
    exercise_performances: List[ExercisePerformanceResponse] = Field(default_factory=list)
    
    # Session goals
    session_goals: List[SessionGoalResponse] = Field(default_factory=list)
    
    # Media
    before_photos: Optional[List[str]] = None
    after_photos: Optional[List[str]] = None
    workout_videos: Optional[List[str]] = None
    
    # Related data
    client_name: Optional[str] = None
    trainer_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Session Template Schemas
class SessionTemplateBase(BaseModel):
    """Base session template schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    session_type: str = Field(..., max_length=100)
    estimated_duration_minutes: int = Field(..., ge=15, le=240)
    difficulty_level: Optional[str] = Field(None, max_length=50)
    exercises: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    warmup_duration: int = Field(default=10, ge=0, le=60)
    cooldown_duration: int = Field(default=5, ge=0, le=30)
    is_public: bool = False
    tags: Optional[List[str]] = Field(default_factory=list)


class SessionTemplateCreate(SessionTemplateBase):
    """Schema for creating session template"""
    pass


class SessionTemplateUpdate(BaseModel):
    """Schema for updating session template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    session_type: Optional[str] = Field(None, max_length=100)
    estimated_duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    difficulty_level: Optional[str] = Field(None, max_length=50)
    exercises: Optional[List[Dict[str, Any]]] = None
    warmup_duration: Optional[int] = Field(None, ge=0, le=60)
    cooldown_duration: Optional[int] = Field(None, ge=0, le=30)
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class SessionTemplateResponse(SessionTemplateBase):
    """Schema for session template response"""
    id: int
    trainer_id: int
    usage_count: int
    last_used_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    trainer_name: Optional[str] = None

    class Config:
        from_attributes = True


# Analytics and Statistics Schemas
class SessionAnalytics(BaseModel):
    """Schema for session analytics"""
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    average_session_rating: Optional[float] = None
    average_duration_minutes: Optional[float] = None
    total_calories_burned: Optional[int] = None
    average_heart_rate: Optional[float] = None
    sessions_by_intensity: Dict[str, int] = Field(default_factory=dict)
    sessions_by_type: Dict[str, int] = Field(default_factory=dict)
    monthly_progress: List[Dict[str, Any]] = Field(default_factory=list)


class ClientProgressReport(BaseModel):
    """Schema for client progress report"""
    client_id: int
    client_name: str
    report_period: str  # "week", "month", "quarter", "year"
    start_date: datetime
    end_date: datetime
    
    # Session statistics
    total_sessions: int
    completed_sessions: int
    completion_rate: float
    average_session_rating: Optional[float] = None
    
    # Performance metrics
    total_calories_burned: Optional[int] = None
    average_heart_rate: Optional[float] = None
    average_session_duration: Optional[float] = None
    
    # Goal progress
    goals_achieved: int
    goals_in_progress: int
    overall_progress_percentage: Optional[float] = None
    
    # Trends
    improvement_trend: str  # "improving", "stable", "declining"
    key_insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
