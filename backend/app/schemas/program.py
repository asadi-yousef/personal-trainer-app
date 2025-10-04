"""
Pydantic schemas for program management system
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty level enumeration"""
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class ProgramType(str, Enum):
    """Program type enumeration"""
    WEIGHT_LOSS = "Weight Loss"
    STRENGTH = "Strength"
    CARDIO = "Cardio"
    FLEXIBILITY = "Flexibility"
    BALANCE = "Balance"
    ENDURANCE = "Endurance"
    SPORTS_SPECIFIC = "Sports Specific"


class ExerciseType(str, Enum):
    """Exercise type enumeration"""
    STRENGTH = "Strength"
    CARDIO = "Cardio"
    FLEXIBILITY = "Flexibility"
    BALANCE = "Balance"
    PLYOMETRIC = "Plyometric"


class AssignmentStatus(str, Enum):
    """Program assignment status enumeration"""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


# Exercise Schemas
class ExerciseBase(BaseModel):
    """Base exercise schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    muscle_groups: Optional[List[str]] = Field(default_factory=list)
    equipment_needed: Optional[List[str]] = Field(default_factory=list)
    difficulty_level: DifficultyLevel
    exercise_type: ExerciseType
    instructions: Optional[str] = None
    tips: Optional[str] = None
    video_url: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)


class ExerciseCreate(ExerciseBase):
    """Schema for creating an exercise"""
    pass


class ExerciseUpdate(BaseModel):
    """Schema for updating an exercise"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    muscle_groups: Optional[List[str]] = None
    equipment_needed: Optional[List[str]] = None
    difficulty_level: Optional[DifficultyLevel] = None
    exercise_type: Optional[ExerciseType] = None
    instructions: Optional[str] = None
    tips: Optional[str] = None
    video_url: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)


class ExerciseResponse(ExerciseBase):
    """Schema for exercise response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Workout Exercise Schemas
class WorkoutExerciseBase(BaseModel):
    """Base workout exercise schema"""
    exercise_id: int
    sets: int = Field(default=3, ge=1, le=20)
    reps: str = Field(default="10-12", max_length=100)
    weight: str = Field(default="Bodyweight", max_length=100)
    rest_seconds: int = Field(default=60, ge=0, le=600)
    order: int = Field(default=1, ge=1)
    distance: Optional[str] = Field(None, max_length=100)
    duration_seconds: Optional[int] = Field(None, ge=1, le=3600)
    notes: Optional[str] = None


class WorkoutExerciseCreate(WorkoutExerciseBase):
    """Schema for creating a workout exercise"""
    pass


class WorkoutExerciseUpdate(BaseModel):
    """Schema for updating a workout exercise"""
    sets: Optional[int] = Field(None, ge=1, le=20)
    reps: Optional[str] = Field(None, max_length=100)
    weight: Optional[str] = Field(None, max_length=100)
    rest_seconds: Optional[int] = Field(None, ge=0, le=600)
    order: Optional[int] = Field(None, ge=1)
    distance: Optional[str] = Field(None, max_length=100)
    duration_seconds: Optional[int] = Field(None, ge=1, le=3600)
    notes: Optional[str] = None


class WorkoutExerciseResponse(WorkoutExerciseBase):
    """Schema for workout exercise response"""
    id: int
    created_at: datetime
    exercise: ExerciseResponse

    class Config:
        from_attributes = True


# Workout Schemas
class WorkoutBase(BaseModel):
    """Base workout schema"""
    week_number: int = Field(..., ge=1, le=52)
    day_number: int = Field(..., ge=1, le=7)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    estimated_duration_minutes: int = Field(default=60, ge=15, le=240)
    focus_area: str = Field(default="Full Body", max_length=100)
    notes: Optional[str] = None


class WorkoutCreate(WorkoutBase):
    """Schema for creating a workout"""
    exercises: Optional[List[WorkoutExerciseCreate]] = Field(default_factory=list)


class WorkoutUpdate(BaseModel):
    """Schema for updating a workout"""
    week_number: Optional[int] = Field(None, ge=1, le=52)
    day_number: Optional[int] = Field(None, ge=1, le=7)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    estimated_duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    focus_area: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class WorkoutResponse(WorkoutBase):
    """Schema for workout response"""
    id: int
    program_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    exercises: List[WorkoutExerciseResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


# Program Schemas
class ProgramBase(BaseModel):
    """Base program schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    duration_weeks: int = Field(..., ge=1, le=52)
    difficulty_level: DifficultyLevel
    program_type: ProgramType
    goals: Optional[List[str]] = Field(default_factory=list)
    equipment_needed: Optional[List[str]] = Field(default_factory=list)
    target_audience: str = Field(default="General", max_length=255)
    price: float = Field(default=0.0, ge=0.0)
    is_public: bool = False
    is_template: bool = False


class ProgramCreate(ProgramBase):
    """Schema for creating a program"""
    workouts: Optional[List[WorkoutCreate]] = Field(default_factory=list)


class ProgramUpdate(BaseModel):
    """Schema for updating a program"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=52)
    difficulty_level: Optional[DifficultyLevel] = None
    program_type: Optional[ProgramType] = None
    goals: Optional[List[str]] = None
    equipment_needed: Optional[List[str]] = None
    target_audience: Optional[str] = Field(None, max_length=255)
    price: Optional[float] = Field(None, ge=0.0)
    is_public: Optional[bool] = None
    is_template: Optional[bool] = None


class ProgramResponse(ProgramBase):
    """Schema for program response"""
    id: int
    trainer_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    workouts: List[WorkoutResponse] = Field(default_factory=list)
    trainer_name: Optional[str] = None

    class Config:
        from_attributes = True


# Program Assignment Schemas
class ProgramAssignmentBase(BaseModel):
    """Base program assignment schema"""
    client_id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    custom_notes: Optional[str] = None
    modifications: Optional[Dict[str, Any]] = None


class ProgramAssignmentCreate(ProgramAssignmentBase):
    """Schema for creating a program assignment"""
    pass


class ProgramAssignmentUpdate(BaseModel):
    """Schema for updating a program assignment"""
    current_week: Optional[int] = Field(None, ge=1)
    current_day: Optional[int] = Field(None, ge=1, le=7)
    status: Optional[AssignmentStatus] = None
    completion_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    custom_notes: Optional[str] = None
    modifications: Optional[Dict[str, Any]] = None


class ProgramAssignmentResponse(ProgramAssignmentBase):
    """Schema for program assignment response"""
    id: int
    program_id: int
    trainer_id: int
    current_week: int
    current_day: int
    status: AssignmentStatus
    completion_percentage: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    program: Optional[ProgramResponse] = None
    client_name: Optional[str] = None
    trainer_name: Optional[str] = None

    class Config:
        from_attributes = True


# Workout Progress Schemas
class WorkoutProgressBase(BaseModel):
    """Base workout progress schema"""
    workout_id: int
    completed_date: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    client_rating: Optional[int] = Field(None, ge=1, le=5)
    client_notes: Optional[str] = None
    trainer_notes: Optional[str] = None
    exercises_completed: Optional[int] = Field(None, ge=0)
    total_exercises: Optional[int] = Field(None, ge=0)


class WorkoutProgressCreate(WorkoutProgressBase):
    """Schema for creating workout progress"""
    pass


class WorkoutProgressUpdate(BaseModel):
    """Schema for updating workout progress"""
    completed_date: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    client_rating: Optional[int] = Field(None, ge=1, le=5)
    client_notes: Optional[str] = None
    trainer_notes: Optional[str] = None
    exercises_completed: Optional[int] = Field(None, ge=0)
    total_exercises: Optional[int] = Field(None, ge=0)


class WorkoutProgressResponse(WorkoutProgressBase):
    """Schema for workout progress response"""
    id: int
    program_assignment_id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    client_name: Optional[str] = None
    workout_title: Optional[str] = None

    class Config:
        from_attributes = True


# Summary and Analytics Schemas
class ProgramSummary(BaseModel):
    """Program summary with statistics"""
    program: ProgramResponse
    total_assignments: int
    active_assignments: int
    completed_assignments: int
    average_completion_rate: float
    average_client_rating: Optional[float] = None


class ClientProgressSummary(BaseModel):
    """Client's progress summary across all programs"""
    total_programs: int
    active_programs: int
    completed_programs: int
    total_workouts_completed: int
    average_workout_rating: Optional[float] = None
    current_week: int
    current_day: int
