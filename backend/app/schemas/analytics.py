"""
Pydantic schemas for analytics and reporting system
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TimePeriod(str, Enum):
    """Time period enumeration for analytics"""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


class MetricType(str, Enum):
    """Metric type enumeration"""
    COUNT = "count"
    PERCENTAGE = "percentage"
    AVERAGE = "average"
    SUM = "sum"
    TREND = "trend"


# Base Analytics Schemas
class AnalyticsMetric(BaseModel):
    """Base analytics metric"""
    name: str
    value: float
    metric_type: MetricType
    unit: Optional[str] = None
    change_percentage: Optional[float] = None
    trend: Optional[str] = None  # "up", "down", "stable"


class TimeSeriesData(BaseModel):
    """Time series data point"""
    date: datetime
    value: float
    label: Optional[str] = None


class AnalyticsChart(BaseModel):
    """Analytics chart data"""
    title: str
    chart_type: str  # "line", "bar", "pie", "area"
    data: List[TimeSeriesData]
    x_axis_label: str
    y_axis_label: str


# Overview Dashboard Schemas
class OverviewMetrics(BaseModel):
    """Overview dashboard metrics"""
    total_users: int
    total_trainers: int
    total_clients: int
    total_sessions: int
    completed_sessions: int
    active_programs: int
    total_revenue: Optional[float] = None
    average_session_rating: Optional[float] = None
    session_completion_rate: float
    client_satisfaction_score: Optional[float] = None


class OverviewDashboard(BaseModel):
    """Complete overview dashboard"""
    metrics: OverviewMetrics
    charts: List[AnalyticsChart]
    recent_activity: List[Dict[str, Any]]
    top_performers: Dict[str, List[Dict[str, Any]]]
    alerts: List[Dict[str, Any]]


# Session Analytics Schemas
class SessionAnalyticsMetrics(BaseModel):
    """Session analytics metrics"""
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    no_show_sessions: int
    completion_rate: float
    average_session_duration: Optional[float] = None
    average_session_rating: Optional[float] = None
    total_calories_burned: Optional[int] = None
    average_heart_rate: Optional[float] = None


class SessionAnalytics(BaseModel):
    """Complete session analytics"""
    period: str
    metrics: SessionAnalyticsMetrics
    sessions_by_type: Dict[str, int]
    sessions_by_intensity: Dict[str, int]
    sessions_by_day_of_week: Dict[str, int]
    sessions_by_hour: Dict[str, int]
    completion_trend: List[TimeSeriesData]
    rating_trend: List[TimeSeriesData]
    duration_trend: List[TimeSeriesData]


# Client Analytics Schemas
class ClientProgressMetrics(BaseModel):
    """Client progress metrics"""
    total_clients: int
    active_clients: int
    new_clients_this_period: int
    client_retention_rate: float
    average_sessions_per_client: float
    average_client_rating: Optional[float] = None
    goal_achievement_rate: Optional[float] = None


class ClientAnalytics(BaseModel):
    """Client analytics data"""
    period: str
    metrics: ClientProgressMetrics
    client_acquisition_trend: List[TimeSeriesData]
    client_retention_trend: List[TimeSeriesData]
    top_performing_clients: List[Dict[str, Any]]
    client_satisfaction_distribution: Dict[str, int]


# Trainer Analytics Schemas
class TrainerPerformanceMetrics(BaseModel):
    """Trainer performance metrics"""
    total_trainers: int
    active_trainers: int
    average_client_rating: Optional[float] = None
    average_sessions_per_trainer: float
    trainer_utilization_rate: float
    revenue_per_trainer: Optional[float] = None
    client_retention_by_trainer: Optional[float] = None


class TrainerAnalytics(BaseModel):
    """Trainer analytics data"""
    period: str
    metrics: TrainerPerformanceMetrics
    top_performing_trainers: List[Dict[str, Any]]
    trainer_rating_distribution: Dict[str, int]
    trainer_utilization_trend: List[TimeSeriesData]
    trainer_revenue_trend: List[TimeSeriesData]


# Program Analytics Schemas
class ProgramAnalyticsMetrics(BaseModel):
    """Program analytics metrics"""
    total_programs: int
    active_programs: int
    completed_programs: int
    average_program_duration: float
    program_completion_rate: float
    most_popular_program_types: Dict[str, int]
    program_effectiveness_score: Optional[float] = None


class ProgramAnalytics(BaseModel):
    """Program analytics data"""
    period: str
    metrics: ProgramAnalyticsMetrics
    programs_by_type: Dict[str, int]
    programs_by_difficulty: Dict[str, int]
    program_completion_trend: List[TimeSeriesData]
    top_programs: List[Dict[str, Any]]
    program_effectiveness_by_type: Dict[str, float]


# Revenue Analytics Schemas
class RevenueMetrics(BaseModel):
    """Revenue metrics"""
    total_revenue: float
    revenue_this_period: float
    average_session_price: Optional[float] = None
    revenue_per_client: Optional[float] = None
    revenue_per_trainer: Optional[float] = None
    revenue_growth_rate: Optional[float] = None


class RevenueAnalytics(BaseModel):
    """Revenue analytics data"""
    period: str
    metrics: RevenueMetrics
    revenue_trend: List[TimeSeriesData]
    revenue_by_trainer: List[Dict[str, Any]]
    revenue_by_session_type: Dict[str, float]
    pricing_analysis: Dict[str, Any]


# Goal Analytics Schemas
class GoalAnalyticsMetrics(BaseModel):
    """Goal analytics metrics"""
    total_goals: int
    achieved_goals: int
    goals_in_progress: int
    goal_achievement_rate: float
    average_time_to_achieve: Optional[float] = None
    most_common_goal_types: Dict[str, int]


class GoalAnalytics(BaseModel):
    """Goal analytics data"""
    period: str
    metrics: GoalAnalyticsMetrics
    goals_by_type: Dict[str, int]
    goal_achievement_trend: List[TimeSeriesData]
    time_to_achieve_by_type: Dict[str, float]
    top_achieving_clients: List[Dict[str, Any]]


# Message Analytics Schemas
class MessageAnalyticsMetrics(BaseModel):
    """Message analytics metrics"""
    total_messages: int
    messages_this_period: int
    average_messages_per_user: float
    response_time_average: Optional[float] = None
    most_active_conversations: int


class MessageAnalytics(BaseModel):
    """Message analytics data"""
    period: str
    metrics: MessageAnalyticsMetrics
    messages_by_type: Dict[str, int]
    message_volume_trend: List[TimeSeriesData]
    response_time_trend: List[TimeSeriesData]
    most_active_users: List[Dict[str, Any]]


# Custom Report Schemas
class ReportFilters(BaseModel):
    """Report filters"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    trainer_ids: Optional[List[int]] = None
    client_ids: Optional[List[int]] = None
    session_types: Optional[List[str]] = None
    program_types: Optional[List[str]] = None
    goal_types: Optional[List[str]] = None


class CustomReport(BaseModel):
    """Custom report"""
    report_name: str
    report_type: str
    filters: ReportFilters
    generated_at: datetime
    generated_by: str
    data: Dict[str, Any]


class ReportTemplate(BaseModel):
    """Report template"""
    name: str
    description: str
    report_type: str
    default_filters: ReportFilters
    chart_configurations: List[Dict[str, Any]]
    is_public: bool = False


# Comparison Analytics Schemas
class ComparisonMetrics(BaseModel):
    """Comparison metrics"""
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    change_percentage: Dict[str, float]
    trend_direction: Dict[str, str]  # "up", "down", "stable"


class PeriodComparison(BaseModel):
    """Period comparison data"""
    current_period: str
    previous_period: str
    metrics: ComparisonMetrics
    insights: List[str]


# Real-time Analytics Schemas
class RealTimeMetrics(BaseModel):
    """Real-time metrics"""
    active_sessions: int
    active_users: int
    sessions_today: int
    messages_today: int
    revenue_today: Optional[float] = None
    last_updated: datetime


class RealTimeDashboard(BaseModel):
    """Real-time dashboard"""
    metrics: RealTimeMetrics
    live_sessions: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]
    system_alerts: List[Dict[str, Any]]


# Export Schemas
class ExportRequest(BaseModel):
    """Export request"""
    report_type: str
    format: str  # "pdf", "excel", "csv"
    filters: ReportFilters
    include_charts: bool = True
    email_to: Optional[str] = None


class ExportResponse(BaseModel):
    """Export response"""
    export_id: str
    status: str
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None


# KPI Dashboard Schemas
class KPIMetric(BaseModel):
    """KPI metric"""
    name: str
    value: float
    target: Optional[float] = None
    unit: Optional[str] = None
    status: str  # "good", "warning", "critical"
    trend: Optional[str] = None
    change_percentage: Optional[float] = None


class KPIDashboard(BaseModel):
    """KPI dashboard"""
    period: str
    kpis: List[KPIMetric]
    overall_score: Optional[float] = None
    insights: List[str]
    recommendations: List[str]


# User Engagement Analytics
class EngagementMetrics(BaseModel):
    """User engagement metrics"""
    daily_active_users: int
    weekly_active_users: int
    monthly_active_users: int
    average_session_time: Optional[float] = None
    feature_usage: Dict[str, int]
    user_retention_rate: float


class EngagementAnalytics(BaseModel):
    """Engagement analytics"""
    period: str
    metrics: EngagementMetrics
    engagement_trend: List[TimeSeriesData]
    feature_usage_trend: Dict[str, List[TimeSeriesData]]
    user_segments: Dict[str, int]
