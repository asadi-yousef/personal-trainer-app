"""
Analytics service for calculating comprehensive metrics and insights
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, extract
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
import json

from app.models import (
    User, Trainer, Session, Program, ProgramAssignment, 
    FitnessGoal, Message, Booking, ExercisePerformance,
    SessionGoal, WorkoutProgress, Notification
)
from app.schemas.analytics import (
    OverviewMetrics, SessionAnalyticsMetrics, ClientProgressMetrics,
    TrainerPerformanceMetrics, ProgramAnalyticsMetrics, RevenueMetrics,
    GoalAnalyticsMetrics, MessageAnalyticsMetrics, EngagementMetrics,
    TimeSeriesData, KPIMetric
)


class AnalyticsService:
    """Comprehensive analytics service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_overview_metrics(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> OverviewMetrics:
        """Get overview dashboard metrics"""
        
        # Basic counts
        total_users = self.db.query(User).count()
        total_trainers = self.db.query(Trainer).count()
        total_clients = self.db.query(User).filter(User.role == "client").count()
        
        # Session metrics
        session_query = self.db.query(Session)
        if start_date:
            session_query = session_query.filter(Session.scheduled_date >= start_date)
        if end_date:
            session_query = session_query.filter(Session.scheduled_date <= end_date)
        
        total_sessions = session_query.count()
        completed_sessions = session_query.filter(Session.status == "completed").count()
        
        # Program metrics
        active_programs = self.db.query(Program).filter(Program.is_active == True).count()
        
        # Calculate completion rate
        completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        # Average session rating
        avg_rating = self.db.query(func.avg(Session.client_rating)).filter(
            Session.client_rating.isnot(None),
            Session.status == "completed"
        ).scalar()
        
        # Client satisfaction (based on ratings)
        satisfaction_score = avg_rating * 20 if avg_rating else None  # Convert 1-5 to percentage
        
        return OverviewMetrics(
            total_users=total_users,
            total_trainers=total_trainers,
            total_clients=total_clients,
            total_sessions=total_sessions,
            completed_sessions=completed_sessions,
            active_programs=active_programs,
            session_completion_rate=round(completion_rate, 2),
            average_session_rating=round(avg_rating, 2) if avg_rating else None,
            client_satisfaction_score=round(satisfaction_score, 2) if satisfaction_score else None
        )
    
    def get_session_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> SessionAnalyticsMetrics:
        """Get session analytics metrics"""
        
        # Base query
        query = self.db.query(Session)
        if start_date:
            query = query.filter(Session.scheduled_date >= start_date)
        if end_date:
            query = query.filter(Session.scheduled_date <= end_date)
        
        # Basic counts
        total_sessions = query.count()
        completed_sessions = query.filter(Session.status == "completed").count()
        cancelled_sessions = query.filter(Session.status == "cancelled").count()
        no_show_sessions = query.filter(Session.status == "no_show").count()
        
        # Calculate completion rate
        completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        # Average duration
        avg_duration = query.filter(
            Session.actual_duration_minutes.isnot(None)
        ).with_entities(func.avg(Session.actual_duration_minutes)).scalar()
        
        # Average rating
        avg_rating = query.filter(
            Session.client_rating.isnot(None),
            Session.status == "completed"
        ).with_entities(func.avg(Session.client_rating)).scalar()
        
        # Total calories
        total_calories = query.filter(
            Session.calories_burned.isnot(None)
        ).with_entities(func.sum(Session.calories_burned)).scalar() or 0
        
        # Average heart rate
        avg_heart_rate = query.filter(
            Session.avg_heart_rate.isnot(None)
        ).with_entities(func.avg(Session.avg_heart_rate)).scalar()
        
        return SessionAnalyticsMetrics(
            total_sessions=total_sessions,
            completed_sessions=completed_sessions,
            cancelled_sessions=cancelled_sessions,
            no_show_sessions=no_show_sessions,
            completion_rate=round(completion_rate, 2),
            average_session_duration=round(avg_duration, 2) if avg_duration else None,
            average_session_rating=round(avg_rating, 2) if avg_rating else None,
            total_calories_burned=int(total_calories),
            average_heart_rate=round(avg_heart_rate, 2) if avg_heart_rate else None
        )
    
    def get_client_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> ClientProgressMetrics:
        """Get client analytics metrics"""
        
        # Total clients
        total_clients = self.db.query(User).filter(User.role == "client").count()
        
        # Active clients (have sessions in period)
        active_clients_query = self.db.query(User).join(Session).filter(User.role == "client")
        if start_date:
            active_clients_query = active_clients_query.filter(Session.scheduled_date >= start_date)
        if end_date:
            active_clients_query = active_clients_query.filter(Session.scheduled_date <= end_date)
        
        active_clients = active_clients_query.distinct().count()
        
        # New clients this period
        new_clients = 0
        if start_date:
            new_clients = self.db.query(User).filter(
                User.role == "client",
                User.created_at >= start_date
            ).count()
        
        # Calculate retention rate (simplified)
        retention_rate = (active_clients / total_clients * 100) if total_clients > 0 else 0
        
        # Average sessions per client
        avg_sessions = 0
        if total_clients > 0:
            session_query = self.db.query(Session)
            if start_date:
                session_query = session_query.filter(Session.scheduled_date >= start_date)
            if end_date:
                session_query = session_query.filter(Session.scheduled_date <= end_date)
            
            total_sessions = session_query.count()
            avg_sessions = total_sessions / total_clients
        
        # Average client rating
        avg_rating = self.db.query(func.avg(Session.client_rating)).filter(
            Session.client_rating.isnot(None),
            Session.status == "completed"
        ).scalar()
        
        # Goal achievement rate
        total_goals = self.db.query(FitnessGoal).filter(FitnessGoal.is_active == True).count()
        achieved_goals = self.db.query(FitnessGoal).filter(
            FitnessGoal.is_active == True,
            FitnessGoal.is_achieved == True
        ).count()
        
        goal_achievement_rate = (achieved_goals / total_goals * 100) if total_goals > 0 else None
        
        return ClientProgressMetrics(
            total_clients=total_clients,
            active_clients=active_clients,
            new_clients_this_period=new_clients,
            client_retention_rate=round(retention_rate, 2),
            average_sessions_per_client=round(avg_sessions, 2),
            average_client_rating=round(avg_rating, 2) if avg_rating else None,
            goal_achievement_rate=round(goal_achievement_rate, 2) if goal_achievement_rate else None
        )
    
    def get_trainer_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> TrainerPerformanceMetrics:
        """Get trainer analytics metrics"""
        
        # Total trainers
        total_trainers = self.db.query(Trainer).count()
        
        # Active trainers (have sessions in period)
        active_trainers_query = self.db.query(Trainer).join(Session)
        if start_date:
            active_trainers_query = active_trainers_query.filter(Session.scheduled_date >= start_date)
        if end_date:
            active_trainers_query = active_trainers_query.filter(Session.scheduled_date <= end_date)
        
        active_trainers = active_trainers_query.distinct().count()
        
        # Average client rating for trainers
        avg_rating = self.db.query(func.avg(Session.client_rating)).filter(
            Session.client_rating.isnot(None),
            Session.status == "completed"
        ).scalar()
        
        # Average sessions per trainer
        avg_sessions = 0
        if total_trainers > 0:
            session_query = self.db.query(Session)
            if start_date:
                session_query = session_query.filter(Session.scheduled_date >= start_date)
            if end_date:
                session_query = session_query.filter(Session.scheduled_date <= end_date)
            
            total_sessions = session_query.count()
            avg_sessions = total_sessions / total_trainers
        
        # Trainer utilization rate (sessions vs availability)
        # This is simplified - in reality you'd compare against trainer availability
        utilization_rate = min(100.0, (avg_sessions * 100) / 20)  # Assuming 20 sessions/week is 100%
        
        return TrainerPerformanceMetrics(
            total_trainers=total_trainers,
            active_trainers=active_trainers,
            average_client_rating=round(avg_rating, 2) if avg_rating else None,
            average_sessions_per_trainer=round(avg_sessions, 2),
            trainer_utilization_rate=round(utilization_rate, 2),
            client_retention_by_trainer=None  # Would need more complex calculation
        )
    
    def get_program_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> ProgramAnalyticsMetrics:
        """Get program analytics metrics"""
        
        # Program counts
        total_programs = self.db.query(Program).count()
        active_programs = self.db.query(Program).filter(Program.is_active == True).count()
        
        # Completed programs
        completed_assignments = self.db.query(ProgramAssignment).filter(
            ProgramAssignment.status == "completed"
        ).count()
        
        # Average program duration
        avg_duration = self.db.query(func.avg(Program.duration_weeks)).filter(
            Program.duration_weeks.isnot(None)
        ).scalar()
        
        # Program completion rate
        total_assignments = self.db.query(ProgramAssignment).count()
        completion_rate = (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0
        
        # Most popular program types
        program_types = self.db.query(
            Program.program_type,
            func.count(Program.id).label('count')
        ).group_by(Program.program_type).all()
        
        popular_types = {pt[0]: pt[1] for pt in program_types if pt[0]}
        
        return ProgramAnalyticsMetrics(
            total_programs=total_programs,
            active_programs=active_programs,
            completed_programs=completed_assignments,
            average_program_duration=round(avg_duration, 2) if avg_duration else None,
            program_completion_rate=round(completion_rate, 2),
            most_popular_program_types=popular_types,
            program_effectiveness_score=None  # Would need complex calculation
        )
    
    def get_goal_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> GoalAnalyticsMetrics:
        """Get goal analytics metrics"""
        
        # Goal counts
        total_goals = self.db.query(FitnessGoal).count()
        achieved_goals = self.db.query(FitnessGoal).filter(
            FitnessGoal.is_achieved == True
        ).count()
        
        goals_in_progress = self.db.query(FitnessGoal).filter(
            FitnessGoal.is_active == True,
            FitnessGoal.is_achieved == False
        ).count()
        
        # Goal achievement rate
        achievement_rate = (achieved_goals / total_goals * 100) if total_goals > 0 else 0
        
        # Average time to achieve (simplified)
        avg_time = None
        achieved_goals_with_dates = self.db.query(FitnessGoal).filter(
            FitnessGoal.is_achieved == True,
            FitnessGoal.achieved_date.isnot(None)
        ).all()
        
        if achieved_goals_with_dates:
            total_days = sum([
                (goal.achieved_date - goal.start_date).days 
                for goal in achieved_goals_with_dates
            ])
            avg_time = total_days / len(achieved_goals_with_dates)
        
        # Most common goal types
        goal_types = self.db.query(
            FitnessGoal.goal_type,
            func.count(FitnessGoal.id).label('count')
        ).group_by(FitnessGoal.goal_type).all()
        
        common_types = {gt[0]: gt[1] for gt in goal_types if gt[0]}
        
        return GoalAnalyticsMetrics(
            total_goals=total_goals,
            achieved_goals=achieved_goals,
            goals_in_progress=goals_in_progress,
            goal_achievement_rate=round(achievement_rate, 2),
            average_time_to_achieve=round(avg_time, 2) if avg_time else None,
            most_common_goal_types=common_types
        )
    
    def get_message_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> MessageAnalyticsMetrics:
        """Get message analytics metrics"""
        
        # Message counts
        query = self.db.query(Message)
        if start_date:
            query = query.filter(Message.created_at >= start_date)
        if end_date:
            query = query.filter(Message.created_at <= end_date)
        
        total_messages = query.count()
        messages_this_period = total_messages
        
        # Average messages per user
        total_users = self.db.query(User).count()
        avg_messages = total_messages / total_users if total_users > 0 else 0
        
        # Response time (simplified - would need conversation analysis)
        response_time = None
        
        # Most active conversations
        active_conversations = self.db.query(Message.conversation_id).distinct().count()
        
        return MessageAnalyticsMetrics(
            total_messages=total_messages,
            messages_this_period=messages_this_period,
            average_messages_per_user=round(avg_messages, 2),
            response_time_average=response_time,
            most_active_conversations=active_conversations
        )
    
    def get_engagement_metrics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> EngagementMetrics:
        """Get user engagement metrics"""
        
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Daily active users (users with sessions today)
        today = date.today()
        dau = self.db.query(User).join(Session).filter(
            func.date(Session.scheduled_date) == today
        ).distinct().count()
        
        # Weekly active users
        week_ago = today - timedelta(days=7)
        wau = self.db.query(User).join(Session).filter(
            func.date(Session.scheduled_date) >= week_ago
        ).distinct().count()
        
        # Monthly active users
        month_ago = today - timedelta(days=30)
        mau = self.db.query(User).join(Session).filter(
            func.date(Session.scheduled_date) >= month_ago
        ).distinct().count()
        
        # Average session time (using actual duration)
        avg_session_time = self.db.query(func.avg(Session.actual_duration_minutes)).filter(
            Session.actual_duration_minutes.isnot(None),
            Session.status == "completed"
        ).scalar()
        
        # Feature usage (simplified)
        feature_usage = {
            "sessions": self.db.query(Session).count(),
            "messages": self.db.query(Message).count(),
            "programs": self.db.query(ProgramAssignment).count(),
            "goals": self.db.query(FitnessGoal).count()
        }
        
        # User retention (simplified)
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).join(Session).filter(
            func.date(Session.scheduled_date) >= month_ago
        ).distinct().count()
        
        retention_rate = (active_users / total_users * 100) if total_users > 0 else 0
        
        return EngagementMetrics(
            daily_active_users=dau,
            weekly_active_users=wau,
            monthly_active_users=mau,
            average_session_time=round(avg_session_time, 2) if avg_session_time else None,
            feature_usage=feature_usage,
            user_retention_rate=round(retention_rate, 2)
        )
    
    def get_time_series_data(
        self,
        metric: str,
        start_date: datetime,
        end_date: datetime,
        period: str = "day"
    ) -> List[TimeSeriesData]:
        """Get time series data for a metric"""
        
        data_points = []
        current_date = start_date
        
        while current_date <= end_date:
            if period == "day":
                next_date = current_date + timedelta(days=1)
                date_filter = func.date(Session.scheduled_date) == current_date.date()
            elif period == "week":
                next_date = current_date + timedelta(weeks=1)
                date_filter = func.date(Session.scheduled_date) >= current_date.date()
                date_filter = date_filter & (func.date(Session.scheduled_date) < next_date.date())
            else:  # month
                next_date = current_date + timedelta(days=30)
                date_filter = func.date(Session.scheduled_date) >= current_date.date()
                date_filter = date_filter & (func.date(Session.scheduled_date) < next_date.date())
            
            # Calculate metric value for this period
            if metric == "sessions":
                value = self.db.query(Session).filter(date_filter).count()
            elif metric == "completed_sessions":
                value = self.db.query(Session).filter(
                    date_filter,
                    Session.status == "completed"
                ).count()
            elif metric == "average_rating":
                result = self.db.query(func.avg(Session.client_rating)).filter(
                    date_filter,
                    Session.client_rating.isnot(None)
                ).scalar()
                value = result if result else 0
            else:
                value = 0
            
            data_points.append(TimeSeriesData(
                date=current_date,
                value=float(value)
            ))
            
            current_date = next_date
        
        return data_points
    
    def get_kpi_metrics(self) -> List[KPIMetric]:
        """Get KPI metrics for dashboard"""
        
        # Get current period metrics
        current_metrics = self.get_overview_metrics()
        
        # Get previous period metrics for comparison
        month_ago = datetime.utcnow() - timedelta(days=30)
        previous_metrics = self.get_overview_metrics(
            start_date=month_ago - timedelta(days=30),
            end_date=month_ago
        )
        
        kpis = []
        
        # Session completion rate KPI
        current_completion = current_metrics.session_completion_rate
        previous_completion = previous_metrics.session_completion_rate
        completion_change = ((current_completion - previous_completion) / previous_completion * 100) if previous_completion > 0 else 0
        
        kpis.append(KPIMetric(
            name="Session Completion Rate",
            value=current_completion,
            target=85.0,  # Target 85% completion rate
            unit="%",
            status="good" if current_completion >= 85 else "warning" if current_completion >= 70 else "critical",
            trend="up" if completion_change > 0 else "down" if completion_change < 0 else "stable",
            change_percentage=round(completion_change, 2)
        ))
        
        # Client satisfaction KPI
        if current_metrics.client_satisfaction_score:
            kpis.append(KPIMetric(
                name="Client Satisfaction",
                value=current_metrics.client_satisfaction_score,
                target=80.0,
                unit="%",
                status="good" if current_metrics.client_satisfaction_score >= 80 else "warning",
                trend="stable"
            ))
        
        # Active clients KPI
        kpis.append(KPIMetric(
            name="Active Clients",
            value=float(current_metrics.total_clients),
            target=100.0,
            unit="clients",
            status="good",
            trend="up"
        ))
        
        return kpis
