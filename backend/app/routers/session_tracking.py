"""
API routes for enhanced session tracking system
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import (
    Session, ExercisePerformance, SessionGoal, FitnessGoal, SessionTemplate,
    Exercise, User, Trainer, ProgramAssignment
)
from app.schemas.session_tracking import (
    SessionTrackingCreate, SessionTrackingResponse,
    ExercisePerformanceCreate, ExercisePerformanceUpdate, ExercisePerformanceResponse,
    SessionGoalCreate, SessionGoalUpdate, SessionGoalResponse,
    FitnessGoalCreate, FitnessGoalUpdate, FitnessGoalResponse,
    SessionTemplateCreate, SessionTemplateUpdate, SessionTemplateResponse,
    SessionAnalytics, ClientProgressReport
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/session-tracking", tags=["session-tracking"])


# Session Completion and Tracking
@router.post("/sessions/{session_id}/complete", response_model=SessionTrackingResponse)
async def complete_session(
    session_id: int,
    tracking_data: SessionTrackingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete a session with comprehensive tracking data"""
    
    # Get session
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check permissions (trainer or client)
    if current_user.role not in ["trainer", "admin"] and current_user.id != session.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this session"
        )
    
    # Update session completion data
    session.actual_start_time = tracking_data.actual_start_time
    session.actual_end_time = tracking_data.actual_end_time
    
    if tracking_data.actual_start_time and tracking_data.actual_end_time:
        duration = tracking_data.actual_end_time - tracking_data.actual_start_time
        session.actual_duration_minutes = int(duration.total_seconds() / 60)
    
    # Update energy and mood
    session.client_energy_before = tracking_data.client_energy_before
    session.client_energy_after = tracking_data.client_energy_after
    session.client_mood_before = tracking_data.client_mood_before.value if tracking_data.client_mood_before else None
    session.client_mood_after = tracking_data.client_mood_after.value if tracking_data.client_mood_after else None
    
    # Update session metrics
    session.calories_burned = tracking_data.calories_burned
    session.avg_heart_rate = tracking_data.avg_heart_rate
    session.max_heart_rate = tracking_data.max_heart_rate
    session.session_intensity = tracking_data.session_intensity.value if tracking_data.session_intensity else None
    
    # Update ratings and feedback
    session.client_rating = tracking_data.client_rating
    session.trainer_rating = tracking_data.trainer_rating
    session.difficulty_rating = tracking_data.difficulty_rating
    session.client_feedback = tracking_data.client_feedback
    session.trainer_feedback = tracking_data.trainer_feedback
    
    # Update media
    session.before_photos = json.dumps(tracking_data.before_photos) if tracking_data.before_photos else None
    session.after_photos = json.dumps(tracking_data.after_photos) if tracking_data.after_photos else None
    session.workout_videos = json.dumps(tracking_data.workout_videos) if tracking_data.workout_videos else None
    
    # Update status
    session.status = "completed"
    
    # Create exercise performances
    total_exercises = 0
    completed_exercises = 0
    
    for exercise_data in tracking_data.exercise_performances:
        exercise_performance = ExercisePerformance(
            session_id=session_id,
            exercise_id=exercise_data.exercise_id,
            sets_planned=exercise_data.sets_planned,
            sets_completed=exercise_data.sets_completed,
            reps_planned=exercise_data.reps_planned,
            reps_completed=json.dumps(exercise_data.reps_completed) if exercise_data.reps_completed else None,
            weight_planned=exercise_data.weight_planned,
            weight_used=json.dumps(exercise_data.weight_used) if exercise_data.weight_used else None,
            rest_time_seconds=exercise_data.rest_time_seconds,
            form_rating=exercise_data.form_rating,
            difficulty_felt=exercise_data.difficulty_felt,
            rpe_rating=exercise_data.rpe_rating,
            tempo_seconds=json.dumps(exercise_data.tempo_seconds) if exercise_data.tempo_seconds else None,
            distance_covered=exercise_data.distance_covered,
            duration_seconds=exercise_data.duration_seconds,
            avg_pace=exercise_data.avg_pace,
            elevation_gain=exercise_data.elevation_gain,
            trainer_notes=exercise_data.trainer_notes,
            client_notes=exercise_data.client_notes,
            modifications_made=exercise_data.modifications_made,
            equipment_used=json.dumps(exercise_data.equipment_used) if exercise_data.equipment_used else None,
            exercise_order=exercise_data.exercise_order,
            start_time=exercise_data.start_time,
            end_time=exercise_data.end_time
        )
        db.add(exercise_performance)
        
        total_exercises += 1
        if exercise_data.sets_completed > 0:
            completed_exercises += 1
    
    # Create session goals
    for goal_data in tracking_data.session_goals:
        session_goal = SessionGoal(
            session_id=session_id,
            goal_name=goal_data.goal_name,
            goal_type=goal_data.goal_type.value,
            target_value=goal_data.target_value,
            actual_value=goal_data.actual_value,
            unit=goal_data.unit,
            progress_rating=goal_data.progress_rating,
            notes=goal_data.notes,
            trainer_assessment=goal_data.trainer_assessment
        )
        db.add(session_goal)
    
    # Update completion percentage
    if total_exercises > 0:
        session.total_exercises_planned = total_exercises
        session.exercises_completed = completed_exercises
        session.completion_percentage = (completed_exercises / total_exercises) * 100
    
    db.commit()
    db.refresh(session)
    
    # Create progress notification
    if session.program_assignment_id:
        background_tasks.add_task(
            update_program_progress,
            db,
            session.program_assignment_id,
            session.completion_percentage
        )
    
    # Prepare response
    response = SessionTrackingResponse(
        session_id=session.id,
        session_title=session.title,
        session_type=session.session_type,
        scheduled_date=session.scheduled_date,
        actual_start_time=session.actual_start_time,
        actual_end_time=session.actual_end_time,
        actual_duration_minutes=session.actual_duration_minutes,
        completion_percentage=session.completion_percentage,
        client_energy_before=session.client_energy_before,
        client_energy_after=session.client_energy_after,
        client_mood_before=session.client_mood_before,
        client_mood_after=session.client_mood_after,
        calories_burned=session.calories_burned,
        avg_heart_rate=session.avg_heart_rate,
        max_heart_rate=session.max_heart_rate,
        session_intensity=session.session_intensity,
        client_rating=session.client_rating,
        trainer_rating=session.trainer_rating,
        difficulty_rating=session.difficulty_rating,
        client_feedback=session.client_feedback,
        trainer_feedback=session.trainer_feedback,
        before_photos=json.loads(session.before_photos) if session.before_photos else [],
        after_photos=json.loads(session.after_photos) if session.after_photos else [],
        workout_videos=json.loads(session.workout_videos) if session.workout_videos else [],
        client_name=session.client.full_name,
        trainer_name=session.trainer.user.full_name,
        created_at=session.created_at,
        updated_at=session.updated_at
    )
    
    # Add exercise performances
    for performance in session.exercise_performances:
        performance_response = ExercisePerformanceResponse(
            id=performance.id,
            session_id=performance.session_id,
            exercise_id=performance.exercise_id,
            sets_planned=performance.sets_planned,
            sets_completed=performance.sets_completed,
            reps_planned=performance.reps_planned,
            reps_completed=json.loads(performance.reps_completed) if performance.reps_completed else [],
            weight_planned=performance.weight_planned,
            weight_used=json.loads(performance.weight_used) if performance.weight_used else [],
            rest_time_seconds=performance.rest_time_seconds,
            form_rating=performance.form_rating,
            difficulty_felt=performance.difficulty_felt,
            rpe_rating=performance.rpe_rating,
            tempo_seconds=json.loads(performance.tempo_seconds) if performance.tempo_seconds else None,
            distance_covered=performance.distance_covered,
            duration_seconds=performance.duration_seconds,
            avg_pace=performance.avg_pace,
            elevation_gain=performance.elevation_gain,
            trainer_notes=performance.trainer_notes,
            client_notes=performance.client_notes,
            modifications_made=performance.modifications_made,
            equipment_used=json.loads(performance.equipment_used) if performance.equipment_used else [],
            exercise_order=performance.exercise_order,
            start_time=performance.start_time,
            end_time=performance.end_time,
            created_at=performance.created_at,
            exercise_name=performance.exercise.name,
            exercise_description=performance.exercise.description
        )
        response.exercise_performances.append(performance_response)
    
    # Add session goals
    for goal in session.session_goals:
        goal_response = SessionGoalResponse(
            id=goal.id,
            session_id=goal.session_id,
            goal_name=goal.goal_name,
            goal_type=goal.goal_type,
            target_value=goal.target_value,
            actual_value=goal.actual_value,
            unit=goal.unit,
            progress_rating=goal.progress_rating,
            notes=goal.notes,
            trainer_assessment=goal.trainer_assessment,
            previous_value=goal.previous_value,
            improvement_percentage=goal.improvement_percentage,
            created_at=goal.created_at
        )
        response.session_goals.append(goal_response)
    
    return response


@router.get("/sessions/{session_id}/tracking", response_model=SessionTrackingResponse)
async def get_session_tracking(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive tracking data for a session"""
    
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check permissions
    if (current_user.role not in ["admin"] and 
        current_user.id != session.client_id and 
        current_user.id != session.trainer.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this session tracking"
        )
    
    # Build response (similar to complete_session but for existing data)
    response = SessionTrackingResponse(
        session_id=session.id,
        session_title=session.title,
        session_type=session.session_type,
        scheduled_date=session.scheduled_date,
        actual_start_time=session.actual_start_time,
        actual_end_time=session.actual_end_time,
        actual_duration_minutes=session.actual_duration_minutes,
        completion_percentage=session.completion_percentage,
        client_energy_before=session.client_energy_before,
        client_energy_after=session.client_energy_after,
        client_mood_before=session.client_mood_before,
        client_mood_after=session.client_mood_after,
        calories_burned=session.calories_burned,
        avg_heart_rate=session.avg_heart_rate,
        max_heart_rate=session.max_heart_rate,
        session_intensity=session.session_intensity,
        client_rating=session.client_rating,
        trainer_rating=session.trainer_rating,
        difficulty_rating=session.difficulty_rating,
        client_feedback=session.client_feedback,
        trainer_feedback=session.trainer_feedback,
        before_photos=json.loads(session.before_photos) if session.before_photos else [],
        after_photos=json.loads(session.after_photos) if session.after_photos else [],
        workout_videos=json.loads(session.workout_videos) if session.workout_videos else [],
        client_name=session.client.full_name,
        trainer_name=session.trainer.user.full_name,
        created_at=session.created_at,
        updated_at=session.updated_at
    )
    
    # Add exercise performances and session goals (same as above)
    # ... (similar logic to complete_session response building)
    
    return response


# Fitness Goals Management
@router.post("/fitness-goals", response_model=FitnessGoalResponse)
async def create_fitness_goal(
    goal_data: FitnessGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a fitness goal for a client"""
    
    # Check if client exists
    client = db.query(User).filter(User.id == goal_data.client_id).first()
    if not client or client.role != "client":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Check permissions (trainer or admin)
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can create fitness goals"
        )
    
    # Get trainer ID
    trainer_id = current_user.trainer_profile.id if current_user.role == "trainer" else goal_data.trainer_id
    
    # Create goal
    goal = FitnessGoal(
        client_id=goal_data.client_id,
        trainer_id=trainer_id,
        goal_name=goal_data.goal_name,
        goal_description=goal_data.goal_description,
        goal_type=goal_data.goal_type.value,
        target_value=goal_data.target_value,
        current_value=goal_data.current_value,
        unit=goal_data.unit,
        start_date=goal_data.start_date,
        target_date=goal_data.target_date,
        priority=goal_data.priority,
        notes=goal_data.notes
    )
    
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    # Add related data for response
    goal.client_name = client.full_name
    goal.trainer_name = goal.trainer.user.full_name
    
    # Calculate progress percentage
    if goal.target_value > 0:
        goal.progress_percentage = (goal.current_value / goal.target_value) * 100
    
    # Calculate days remaining
    if goal.target_date:
        days_remaining = (goal.target_date - datetime.utcnow()).days
        goal.days_remaining = max(0, days_remaining)
    
    return goal


@router.get("/fitness-goals", response_model=List[FitnessGoalResponse])
async def get_fitness_goals(
    client_id: Optional[int] = Query(None),
    trainer_id: Optional[int] = Query(None),
    goal_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get fitness goals with filtering"""
    
    query = db.query(FitnessGoal)
    
    # Apply role-based filtering
    if current_user.role == "client":
        query = query.filter(FitnessGoal.client_id == current_user.id)
    elif current_user.role == "trainer":
        query = query.filter(FitnessGoal.trainer_id == current_user.trainer_profile.id)
    
    # Apply filters
    if client_id:
        query = query.filter(FitnessGoal.client_id == client_id)
    if trainer_id:
        query = query.filter(FitnessGoal.trainer_id == trainer_id)
    if goal_type:
        query = query.filter(FitnessGoal.goal_type == goal_type)
    if is_active is not None:
        query = query.filter(FitnessGoal.is_active == is_active)
    
    goals = query.order_by(desc(FitnessGoal.created_at)).offset(skip).limit(limit).all()
    
    # Add related data and calculations
    for goal in goals:
        goal.client_name = goal.client.full_name
        goal.trainer_name = goal.trainer.user.full_name
        
        # Calculate progress percentage
        if goal.target_value > 0:
            goal.progress_percentage = (goal.current_value / goal.target_value) * 100
        
        # Calculate days remaining
        if goal.target_date:
            days_remaining = (goal.target_date - datetime.utcnow()).days
            goal.days_remaining = max(0, days_remaining)
    
    return goals


# Session Templates
@router.post("/session-templates", response_model=SessionTemplateResponse)
async def create_session_template(
    template_data: SessionTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a session template"""
    
    # Only trainers and admins can create templates
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can create session templates"
        )
    
    # Get trainer ID
    trainer_id = current_user.trainer_profile.id if current_user.role == "trainer" else 1
    
    template = SessionTemplate(
        trainer_id=trainer_id,
        name=template_data.name,
        description=template_data.description,
        session_type=template_data.session_type,
        estimated_duration_minutes=template_data.estimated_duration_minutes,
        difficulty_level=template_data.difficulty_level,
        exercises=json.dumps(template_data.exercises) if template_data.exercises else None,
        warmup_duration=template_data.warmup_duration,
        cooldown_duration=template_data.cooldown_duration,
        is_public=template_data.is_public,
        tags=json.dumps(template_data.tags) if template_data.tags else None
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Add related data
    template.trainer_name = template.trainer.user.full_name
    template.exercises = json.loads(template.exercises) if template.exercises else []
    template.tags = json.loads(template.tags) if template.tags else []
    
    return template


# Analytics and Reports
@router.get("/analytics/sessions", response_model=SessionAnalytics)
async def get_session_analytics(
    client_id: Optional[int] = Query(None),
    trainer_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get session analytics"""
    
    query = db.query(Session)
    
    # Apply role-based filtering
    if current_user.role == "client":
        query = query.filter(Session.client_id == current_user.id)
    elif current_user.role == "trainer":
        query = query.filter(Session.trainer_id == current_user.trainer_profile.id)
    
    # Apply filters
    if client_id:
        query = query.filter(Session.client_id == client_id)
    if trainer_id:
        query = query.filter(Session.trainer_id == trainer_id)
    if start_date:
        query = query.filter(Session.scheduled_date >= start_date)
    if end_date:
        query = query.filter(Session.scheduled_date <= end_date)
    
    sessions = query.all()
    
    # Calculate analytics
    total_sessions = len(sessions)
    completed_sessions = len([s for s in sessions if s.status == "completed"])
    cancelled_sessions = len([s for s in sessions if s.status == "cancelled"])
    
    # Calculate averages
    rated_sessions = [s for s in sessions if s.client_rating is not None]
    average_session_rating = sum(s.client_rating for s in rated_sessions) / len(rated_sessions) if rated_sessions else None
    
    duration_sessions = [s for s in sessions if s.actual_duration_minutes is not None]
    average_duration_minutes = sum(s.actual_duration_minutes for s in duration_sessions) / len(duration_sessions) if duration_sessions else None
    
    # Calculate totals
    total_calories_burned = sum(s.calories_burned for s in sessions if s.calories_burned)
    heart_rate_sessions = [s for s in sessions if s.avg_heart_rate is not None]
    average_heart_rate = sum(s.avg_heart_rate for s in heart_rate_sessions) / len(heart_rate_sessions) if heart_rate_sessions else None
    
    # Group by intensity and type
    sessions_by_intensity = {}
    sessions_by_type = {}
    
    for session in sessions:
        if session.session_intensity:
            sessions_by_intensity[session.session_intensity] = sessions_by_intensity.get(session.session_intensity, 0) + 1
        if session.session_type:
            sessions_by_type[session.session_type] = sessions_by_type.get(session.session_type, 0) + 1
    
    return SessionAnalytics(
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        cancelled_sessions=cancelled_sessions,
        average_session_rating=average_session_rating,
        average_duration_minutes=average_duration_minutes,
        total_calories_burned=total_calories_burned,
        average_heart_rate=average_heart_rate,
        sessions_by_intensity=sessions_by_intensity,
        sessions_by_type=sessions_by_type
    )


# Helper Functions
def update_program_progress(db: Session, program_assignment_id: int, completion_percentage: float):
    """Update program assignment progress"""
    assignment = db.query(ProgramAssignment).filter(ProgramAssignment.id == program_assignment_id).first()
    if assignment:
        # Simple progress calculation - could be more sophisticated
        assignment.completion_percentage = min(100.0, assignment.completion_percentage + completion_percentage)
        db.commit()
