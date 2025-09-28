"""
API routes for analytics and reporting system
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import User, Trainer, Session, Program, FitnessGoal, Message
from app.schemas.analytics import (
    OverviewMetrics, OverviewDashboard, SessionAnalyticsMetrics,
    ClientProgressMetrics, TrainerPerformanceMetrics, ProgramAnalyticsMetrics,
    GoalAnalyticsMetrics, MessageAnalyticsMetrics, EngagementMetrics,
    KPIDashboard, RealTimeDashboard, CustomReport, ReportFilters,
    TimeSeriesData, AnalyticsChart
)
from app.services.analytics_service import AnalyticsService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


# Overview Dashboard
@router.get("/overview", response_model=OverviewDashboard)
async def get_overview_dashboard(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview dashboard with key metrics and charts"""
    
    # Check permissions (admin or trainer)
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view analytics"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Set default date range if not provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Get metrics
    metrics = analytics_service.get_overview_metrics(start_date, end_date)
    
    # Create charts
    charts = []
    
    # Session completion trend
    completion_trend = analytics_service.get_time_series_data(
        "completed_sessions", start_date, end_date, "day"
    )
    charts.append(AnalyticsChart(
        title="Session Completion Trend",
        chart_type="line",
        data=completion_trend,
        x_axis_label="Date",
        y_axis_label="Completed Sessions"
    ))
    
    # Session ratings trend
    rating_trend = analytics_service.get_time_series_data(
        "average_rating", start_date, end_date, "day"
    )
    charts.append(AnalyticsChart(
        title="Average Session Rating",
        chart_type="line",
        data=rating_trend,
        x_axis_label="Date",
        y_axis_label="Rating (1-5)"
    ))
    
    # Recent activity (last 10 sessions)
    recent_sessions = db.query(Session).order_by(desc(Session.created_at)).limit(10).all()
    recent_activity = []
    for session in recent_sessions:
        recent_activity.append({
            "id": session.id,
            "type": "session",
            "description": f"{session.session_type} session with {session.client.full_name}",
            "status": session.status,
            "date": session.scheduled_date,
            "rating": session.client_rating
        })
    
    # Top performers
    top_performers = {
        "trainers": [],
        "clients": [],
        "programs": []
    }
    
    # Top trainers by rating
    top_trainers = db.query(Trainer).join(Session).filter(
        Session.status == "completed",
        Session.client_rating.isnot(None)
    ).group_by(Trainer.id).order_by(
        desc(func.avg(Session.client_rating))
    ).limit(5).all()
    
    for trainer in top_trainers:
        avg_rating = db.query(func.avg(Session.client_rating)).filter(
            Session.trainer_id == trainer.id,
            Session.status == "completed"
        ).scalar()
        
        top_performers["trainers"].append({
            "id": trainer.id,
            "name": trainer.user.full_name,
            "rating": round(avg_rating, 2) if avg_rating else None,
            "specialty": trainer.specialty
        })
    
    # Top clients by completion rate
    top_clients = db.query(User).join(Session).filter(
        User.role == "client"
    ).group_by(User.id).order_by(
        desc(func.count(Session.id))
    ).limit(5).all()
    
    for client in top_clients:
        total_sessions = db.query(Session).filter(Session.client_id == client.id).count()
        completed_sessions = db.query(Session).filter(
            Session.client_id == client.id,
            Session.status == "completed"
        ).count()
        completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        top_performers["clients"].append({
            "id": client.id,
            "name": client.full_name,
            "completion_rate": round(completion_rate, 2),
            "total_sessions": total_sessions
        })
    
    # Alerts (sessions needing attention)
    alerts = []
    
    # Overdue sessions
    overdue_sessions = db.query(Session).filter(
        Session.status == "pending",
        Session.scheduled_date < datetime.utcnow()
    ).count()
    
    if overdue_sessions > 0:
        alerts.append({
            "type": "warning",
            "message": f"{overdue_sessions} sessions are overdue",
            "action": "Review pending sessions"
        })
    
    # Low-rated sessions
    low_rated_sessions = db.query(Session).filter(
        Session.client_rating < 3,
        Session.status == "completed"
    ).count()
    
    if low_rated_sessions > 0:
        alerts.append({
            "type": "critical",
            "message": f"{low_rated_sessions} sessions have low ratings",
            "action": "Review session feedback"
        })
    
    return OverviewDashboard(
        metrics=metrics,
        charts=charts,
        recent_activity=recent_activity,
        top_performers=top_performers,
        alerts=alerts
    )


# Session Analytics
@router.get("/sessions", response_model=SessionAnalyticsMetrics)
async def get_session_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    trainer_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed session analytics"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view session analytics"
        )
    
    # Apply role-based filtering
    if current_user.role == "trainer":
        trainer_id = current_user.trainer_profile.id
    
    analytics_service = AnalyticsService(db)
    
    # Set default date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Get base metrics
    metrics = analytics_service.get_session_analytics(start_date, end_date)
    
    # Apply additional filters if needed
    if trainer_id or client_id:
        # This would require modifying the analytics service to accept filters
        # For now, we'll return the basic metrics
        pass
    
    return metrics


# Client Analytics
@router.get("/clients", response_model=ClientProgressMetrics)
async def get_client_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    trainer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get client analytics and progress metrics"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view client analytics"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Set default date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    metrics = analytics_service.get_client_analytics(start_date, end_date)
    
    return metrics


# Trainer Analytics
@router.get("/trainers", response_model=TrainerPerformanceMetrics)
async def get_trainer_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    trainer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get trainer performance analytics"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view trainer analytics"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Set default date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    metrics = analytics_service.get_trainer_analytics(start_date, end_date)
    
    return metrics


# Program Analytics
@router.get("/programs", response_model=ProgramAnalyticsMetrics)
async def get_program_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    trainer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get program effectiveness analytics"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view program analytics"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Set default date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    metrics = analytics_service.get_program_analytics(start_date, end_date)
    
    return metrics


# Goal Analytics
@router.get("/goals", response_model=GoalAnalyticsMetrics)
async def get_goal_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    trainer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get goal achievement analytics"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view goal analytics"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Set default date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    metrics = analytics_service.get_goal_analytics(start_date, end_date)
    
    return metrics


# KPI Dashboard
@router.get("/kpis", response_model=KPIDashboard)
async def get_kpi_dashboard(
    period: str = Query("month", regex="^(day|week|month|quarter|year)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get KPI dashboard with key performance indicators"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view KPI dashboard"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Get KPI metrics
    kpis = analytics_service.get_kpi_metrics()
    
    # Calculate overall score
    overall_score = None
    if kpis:
        total_score = 0
        for kpi in kpis:
            if kpi.target and kpi.value:
                score = min(100, (kpi.value / kpi.target) * 100)
                total_score += score
        overall_score = total_score / len(kpis)
    
    # Generate insights
    insights = []
    if overall_score:
        if overall_score >= 80:
            insights.append("Excellent performance across all KPIs")
        elif overall_score >= 60:
            insights.append("Good performance with room for improvement")
        else:
            insights.append("Performance below target - immediate attention needed")
    
    # Generate recommendations
    recommendations = []
    for kpi in kpis:
        if kpi.status == "critical":
            recommendations.append(f"Priority: Address {kpi.name} - currently at {kpi.value}{kpi.unit}")
        elif kpi.status == "warning":
            recommendations.append(f"Monitor {kpi.name} - approaching target threshold")
    
    return KPIDashboard(
        period=period,
        kpis=kpis,
        overall_score=round(overall_score, 2) if overall_score else None,
        insights=insights,
        recommendations=recommendations
    )


# Real-time Dashboard
@router.get("/realtime", response_model=RealTimeDashboard)
async def get_realtime_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get real-time dashboard with live metrics"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view real-time dashboard"
        )
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Real-time metrics
    active_sessions = db.query(Session).filter(
        Session.status.in_(["pending", "confirmed"]),
        Session.scheduled_date >= now
    ).count()
    
    # Active users (users with recent activity)
    recent_activity = now - timedelta(hours=1)
    active_users = db.query(User).join(Session).filter(
        Session.updated_at >= recent_activity
    ).distinct().count()
    
    # Today's metrics
    sessions_today = db.query(Session).filter(
        Session.scheduled_date >= today_start
    ).count()
    
    messages_today = db.query(Message).filter(
        Message.created_at >= today_start
    ).count()
    
    # Live sessions (currently happening)
    live_sessions = db.query(Session).filter(
        Session.status == "confirmed",
        Session.scheduled_date <= now,
        Session.scheduled_date + timedelta(minutes=Session.duration_minutes) >= now
    ).limit(10).all()
    
    live_sessions_data = []
    for session in live_sessions:
        live_sessions_data.append({
            "id": session.id,
            "client_name": session.client.full_name,
            "trainer_name": session.trainer.user.full_name,
            "session_type": session.session_type,
            "started_at": session.scheduled_date,
            "duration": session.duration_minutes
        })
    
    # Recent activities
    recent_activities = []
    
    # Recent sessions
    recent_sessions = db.query(Session).order_by(desc(Session.updated_at)).limit(5).all()
    for session in recent_sessions:
        recent_activities.append({
            "type": "session",
            "description": f"{session.session_type} session",
            "user": session.client.full_name,
            "timestamp": session.updated_at,
            "status": session.status
        })
    
    # Recent messages
    recent_messages = db.query(Message).order_by(desc(Message.created_at)).limit(5).all()
    for message in recent_messages:
        recent_activities.append({
            "type": "message",
            "description": f"Message from {message.sender.full_name}",
            "user": message.sender.full_name,
            "timestamp": message.created_at,
            "status": "sent"
        })
    
    # System alerts
    system_alerts = []
    
    # Check for system issues
    error_sessions = db.query(Session).filter(
        Session.status == "error"
    ).count()
    
    if error_sessions > 0:
        system_alerts.append({
            "type": "error",
            "message": f"{error_sessions} sessions have errors",
            "timestamp": now
        })
    
    return RealTimeDashboard(
        metrics={
            "active_sessions": active_sessions,
            "active_users": active_users,
            "sessions_today": sessions_today,
            "messages_today": messages_today,
            "last_updated": now
        },
        live_sessions=live_sessions_data,
        recent_activities=recent_activities,
        system_alerts=system_alerts
    )


# Custom Reports
@router.post("/reports/custom", response_model=CustomReport)
async def generate_custom_report(
    report_name: str,
    report_type: str,
    filters: ReportFilters,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a custom analytics report"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can generate custom reports"
        )
    
    # Set default date range
    if not filters.end_date:
        filters.end_date = datetime.utcnow()
    if not filters.start_date:
        filters.start_date = filters.end_date - timedelta(days=30)
    
    # Generate report data based on type
    report_data = {}
    
    if report_type == "session_summary":
        analytics_service = AnalyticsService(db)
        report_data = {
            "metrics": analytics_service.get_session_analytics(filters.start_date, filters.end_date).dict(),
            "period": f"{filters.start_date.date()} to {filters.end_date.date()}",
            "generated_by": current_user.full_name
        }
    elif report_type == "client_progress":
        analytics_service = AnalyticsService(db)
        report_data = {
            "metrics": analytics_service.get_client_analytics(filters.start_date, filters.end_date).dict(),
            "period": f"{filters.start_date.date()} to {filters.end_date.date()}",
            "generated_by": current_user.full_name
        }
    
    # Create report
    report = CustomReport(
        report_name=report_name,
        report_type=report_type,
        filters=filters,
        generated_at=datetime.utcnow(),
        generated_by=current_user.full_name,
        data=report_data
    )
    
    # In a real implementation, you might save this to database or generate PDF/Excel
    # For now, we'll just return the report data
    
    return report


# Time Series Data
@router.get("/timeseries/{metric}")
async def get_time_series_data(
    metric: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    period: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get time series data for charts and trends"""
    
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and trainers can view time series data"
        )
    
    analytics_service = AnalyticsService(db)
    
    # Validate metric
    valid_metrics = ["sessions", "completed_sessions", "average_rating", "clients", "goals"]
    if metric not in valid_metrics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid metric. Must be one of: {valid_metrics}"
        )
    
    # Get time series data
    data = analytics_service.get_time_series_data(metric, start_date, end_date, period)
    
    return {
        "metric": metric,
        "period": period,
        "start_date": start_date,
        "end_date": end_date,
        "data": data
    }
