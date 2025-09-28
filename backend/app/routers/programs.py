"""
API routes for program management system
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import (
    Program, Workout, Exercise, WorkoutExercise, 
    ProgramAssignment, WorkoutProgress, Trainer, User
)
from app.schemas.program import (
    ProgramCreate, ProgramUpdate, ProgramResponse,
    WorkoutCreate, WorkoutUpdate, WorkoutResponse,
    ExerciseCreate, ExerciseUpdate, ExerciseResponse,
    WorkoutExerciseCreate, WorkoutExerciseUpdate, WorkoutExerciseResponse,
    ProgramAssignmentCreate, ProgramAssignmentUpdate, ProgramAssignmentResponse,
    WorkoutProgressCreate, WorkoutProgressUpdate, WorkoutProgressResponse,
    ProgramSummary, ClientProgressSummary
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/programs", tags=["programs"])


# Exercise Management
@router.post("/exercises", response_model=ExerciseResponse)
async def create_exercise(
    exercise_data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new exercise in the library"""
    
    # Only trainers and admins can create exercises
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can create exercises"
        )
    
    # Check if exercise already exists
    existing_exercise = db.query(Exercise).filter(
        Exercise.name == exercise_data.name
    ).first()
    
    if existing_exercise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise with this name already exists"
        )
    
    # Create exercise
    exercise = Exercise(
        name=exercise_data.name,
        description=exercise_data.description,
        muscle_groups=json.dumps(exercise_data.muscle_groups),
        equipment_needed=json.dumps(exercise_data.equipment_needed),
        difficulty_level=exercise_data.difficulty_level.value,
        exercise_type=exercise_data.exercise_type.value,
        instructions=exercise_data.instructions,
        tips=exercise_data.tips,
        video_url=exercise_data.video_url,
        image_url=exercise_data.image_url
    )
    
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    
    # Convert JSON fields back to lists for response
    exercise.muscle_groups = json.loads(exercise.muscle_groups or "[]")
    exercise.equipment_needed = json.loads(exercise.equipment_needed or "[]")
    
    return exercise


@router.get("/exercises", response_model=List[ExerciseResponse])
async def get_exercises(
    skip: int = 0,
    limit: int = 100,
    exercise_type: Optional[str] = Query(None),
    difficulty_level: Optional[str] = Query(None),
    muscle_group: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get exercises with filtering and search"""
    
    query = db.query(Exercise).filter(Exercise.is_active == True)
    
    # Apply filters
    if exercise_type:
        query = query.filter(Exercise.exercise_type == exercise_type)
    if difficulty_level:
        query = query.filter(Exercise.difficulty_level == difficulty_level)
    if muscle_group:
        query = query.filter(Exercise.muscle_groups.contains(muscle_group))
    if search:
        query = query.filter(Exercise.name.contains(search))
    
    exercises = query.offset(skip).limit(limit).all()
    
    # Convert JSON fields to lists
    for exercise in exercises:
        exercise.muscle_groups = json.loads(exercise.muscle_groups or "[]")
        exercise.equipment_needed = json.loads(exercise.equipment_needed or "[]")
    
    return exercises


@router.get("/exercises/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific exercise"""
    
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )
    
    # Convert JSON fields to lists
    exercise.muscle_groups = json.loads(exercise.muscle_groups or "[]")
    exercise.equipment_needed = json.loads(exercise.equipment_needed or "[]")
    
    return exercise


# Program Management
@router.post("/", response_model=ProgramResponse)
async def create_program(
    program_data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workout program"""
    
    # Only trainers and admins can create programs
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can create programs"
        )
    
    # Get trainer ID
    if current_user.role == "trainer":
        trainer_id = current_user.trainer_profile.id
    else:  # admin - could specify trainer_id in request
        trainer_id = current_user.trainer_profile.id if current_user.trainer_profile else 1
    
    # Create program
    program = Program(
        trainer_id=trainer_id,
        title=program_data.title,
        description=program_data.description,
        duration_weeks=program_data.duration_weeks,
        difficulty_level=program_data.difficulty_level.value,
        program_type=program_data.program_type.value,
        goals=json.dumps(program_data.goals),
        equipment_needed=json.dumps(program_data.equipment_needed),
        target_audience=program_data.target_audience,
        price=program_data.price,
        is_public=program_data.is_public,
        is_template=program_data.is_template
    )
    
    db.add(program)
    db.commit()
    db.refresh(program)
    
    # Create workouts if provided
    if program_data.workouts:
        for workout_data in program_data.workouts:
            workout = Workout(
                program_id=program.id,
                week_number=workout_data.week_number,
                day_number=workout_data.day_number,
                title=workout_data.title,
                description=workout_data.description,
                estimated_duration_minutes=workout_data.estimated_duration_minutes,
                focus_area=workout_data.focus_area,
                notes=workout_data.notes
            )
            db.add(workout)
            db.commit()
            db.refresh(workout)
            
            # Create workout exercises
            for exercise_data in workout_data.exercises:
                workout_exercise = WorkoutExercise(
                    workout_id=workout.id,
                    exercise_id=exercise_data.exercise_id,
                    sets=exercise_data.sets,
                    reps=exercise_data.reps,
                    weight=exercise_data.weight,
                    rest_seconds=exercise_data.rest_seconds,
                    order=exercise_data.order,
                    distance=exercise_data.distance,
                    duration_seconds=exercise_data.duration_seconds,
                    notes=exercise_data.notes
                )
                db.add(workout_exercise)
    
    db.commit()
    db.refresh(program)
    
    # Add trainer name for response
    program.trainer_name = program.trainer.user.full_name
    
    # Convert JSON fields to lists
    program.goals = json.loads(program.goals or "[]")
    program.equipment_needed = json.loads(program.equipment_needed or "[]")
    
    return program


@router.get("/", response_model=List[ProgramResponse])
async def get_programs(
    skip: int = 0,
    limit: int = 100,
    trainer_id: Optional[int] = Query(None),
    program_type: Optional[str] = Query(None),
    difficulty_level: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    is_template: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get programs with filtering"""
    
    query = db.query(Program).filter(Program.is_active == True)
    
    # Apply role-based filtering
    if current_user.role == "trainer":
        query = query.filter(Program.trainer_id == current_user.trainer_profile.id)
    elif current_user.role == "client":
        # Clients can only see public programs or programs assigned to them
        assigned_program_ids = db.query(ProgramAssignment.program_id).filter(
            ProgramAssignment.client_id == current_user.id
        ).subquery()
        query = query.filter(
            (Program.is_public == True) | 
            (Program.id.in_(assigned_program_ids))
        )
    
    # Apply filters
    if trainer_id:
        query = query.filter(Program.trainer_id == trainer_id)
    if program_type:
        query = query.filter(Program.program_type == program_type)
    if difficulty_level:
        query = query.filter(Program.difficulty_level == difficulty_level)
    if is_public is not None:
        query = query.filter(Program.is_public == is_public)
    if is_template is not None:
        query = query.filter(Program.is_template == is_template)
    if search:
        query = query.filter(Program.title.contains(search))
    
    programs = query.offset(skip).limit(limit).all()
    
    # Add trainer names and convert JSON fields
    for program in programs:
        program.trainer_name = program.trainer.user.full_name
        program.goals = json.loads(program.goals or "[]")
        program.equipment_needed = json.loads(program.equipment_needed or "[]")
    
    return programs


@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific program"""
    
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    # Check permissions
    if current_user.role == "trainer" and program.trainer_id != current_user.trainer_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this program"
        )
    elif current_user.role == "client":
        # Check if client is assigned to this program or if it's public
        assignment = db.query(ProgramAssignment).filter(
            ProgramAssignment.program_id == program_id,
            ProgramAssignment.client_id == current_user.id
        ).first()
        if not assignment and not program.is_public:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this program"
            )
    
    # Add trainer name and convert JSON fields
    program.trainer_name = program.trainer.user.full_name
    program.goals = json.loads(program.goals or "[]")
    program.equipment_needed = json.loads(program.equipment_needed or "[]")
    
    return program


# Program Assignment Management
@router.post("/{program_id}/assign", response_model=ProgramAssignmentResponse)
async def assign_program_to_client(
    program_id: int,
    assignment_data: ProgramAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign a program to a client"""
    
    # Check if program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    # Check if client exists
    client = db.query(User).filter(User.id == assignment_data.client_id).first()
    if not client or client.role != "client":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Check permissions (trainer or admin)
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can assign programs"
        )
    
    # Get trainer ID
    if current_user.role == "trainer":
        trainer_id = current_user.trainer_profile.id
    else:
        trainer_id = program.trainer_id
    
    # Check if assignment already exists
    existing_assignment = db.query(ProgramAssignment).filter(
        ProgramAssignment.program_id == program_id,
        ProgramAssignment.client_id == assignment_data.client_id,
        ProgramAssignment.status.in_(["active", "paused"])
    ).first()
    
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Program is already assigned to this client"
        )
    
    # Create assignment
    assignment = ProgramAssignment(
        program_id=program_id,
        client_id=assignment_data.client_id,
        trainer_id=trainer_id,
        start_date=assignment_data.start_date,
        end_date=assignment_data.end_date,
        custom_notes=assignment_data.custom_notes,
        modifications=json.dumps(assignment_data.modifications) if assignment_data.modifications else None
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    # Add related data for response
    assignment.program = program
    assignment.client_name = client.full_name
    assignment.trainer_name = assignment.trainer.user.full_name
    
    return assignment


@router.get("/assignments/my-programs", response_model=List[ProgramAssignmentResponse])
async def get_my_programs(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get programs assigned to the current user (client)"""
    
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can view their assigned programs"
        )
    
    query = db.query(ProgramAssignment).filter(
        ProgramAssignment.client_id == current_user.id
    )
    
    if status:
        query = query.filter(ProgramAssignment.status == status)
    
    assignments = query.offset(skip).limit(limit).all()
    
    # Add related data
    for assignment in assignments:
        assignment.program = assignment.program
        assignment.client_name = current_user.full_name
        assignment.trainer_name = assignment.trainer.user.full_name
    
    return assignments


# Workout Progress Tracking
@router.post("/workouts/{workout_id}/progress", response_model=WorkoutProgressResponse)
async def track_workout_progress(
    workout_id: int,
    progress_data: WorkoutProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track progress for a workout"""
    
    # Check if workout exists
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    # Check if user is assigned to this program
    assignment = db.query(ProgramAssignment).filter(
        ProgramAssignment.program_id == workout.program_id,
        ProgramAssignment.client_id == current_user.id,
        ProgramAssignment.status == "active"
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this program"
        )
    
    # Create or update progress
    existing_progress = db.query(WorkoutProgress).filter(
        WorkoutProgress.workout_id == workout_id,
        WorkoutProgress.client_id == current_user.id
    ).first()
    
    if existing_progress:
        # Update existing progress
        update_data = progress_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing_progress, field, value)
        progress = existing_progress
    else:
        # Create new progress
        progress = WorkoutProgress(
            program_assignment_id=assignment.id,
            workout_id=workout_id,
            client_id=current_user.id,
            completed_date=progress_data.completed_date,
            actual_duration_minutes=progress_data.actual_duration_minutes,
            client_rating=progress_data.client_rating,
            client_notes=progress_data.client_notes,
            exercises_completed=progress_data.exercises_completed,
            total_exercises=progress_data.total_exercises
        )
        db.add(progress)
    
    db.commit()
    db.refresh(progress)
    
    # Add related data
    progress.client_name = current_user.full_name
    progress.workout_title = workout.title
    
    return progress


@router.get("/assignments/{assignment_id}/progress", response_model=List[WorkoutProgressResponse])
async def get_program_progress(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get progress for a program assignment"""
    
    # Check if assignment exists and user has access
    assignment = db.query(ProgramAssignment).filter(
        ProgramAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program assignment not found"
        )
    
    # Check permissions
    if (current_user.role not in ["admin"] and 
        current_user.id != assignment.client_id and 
        current_user.id != assignment.trainer.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this progress"
        )
    
    # Get progress records
    progress_records = db.query(WorkoutProgress).filter(
        WorkoutProgress.program_assignment_id == assignment_id
    ).all()
    
    # Add related data
    for progress in progress_records:
        progress.client_name = progress.client.full_name
        progress.workout_title = progress.workout.title
    
    return progress_records
