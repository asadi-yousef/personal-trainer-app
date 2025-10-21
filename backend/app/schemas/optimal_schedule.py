"""
Pydantic schemas for optimal schedule generation
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ProposedScheduleEntry(BaseModel):
    """Schema for a proposed schedule entry"""
    booking_request_id: int
    client_id: int
    client_name: str
    session_type: str
    training_type: Optional[str] = None
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    slot_ids: List[str]
    is_contiguous: bool = Field(
        description="Whether this entry uses multiple contiguous slots"
    )
    preferred_start_date: Optional[datetime] = None
    special_requests: Optional[str] = None
    location: Optional[str] = None
    priority_score: float = Field(default=5.0, ge=0, le=10)
    
    class Config:
        from_attributes = True


class OptimalScheduleStatistics(BaseModel):
    """Statistics about the optimal schedule generation"""
    total_requests: int = Field(description="Total number of booking requests")
    scheduled_requests: int = Field(description="Number of successfully scheduled requests")
    unscheduled_requests: int = Field(description="Number of requests that couldn't be scheduled")
    total_hours: float = Field(description="Total hours scheduled")
    gaps_minimized: int = Field(description="Number of gaps minimized (consecutive sessions)")
    utilization_rate: float = Field(description="Percentage of available time utilized", ge=0, le=100)
    scheduling_efficiency: float = Field(description="Percentage of requests successfully scheduled", ge=0, le=100)
    
    class Config:
        from_attributes = True


class OptimalScheduleResponse(BaseModel):
    """Response schema for optimal schedule generation"""
    trainer_id: int
    proposed_entries: List[ProposedScheduleEntry]
    statistics: OptimalScheduleStatistics
    message: str = Field(description="Human-readable status message")
    
    class Config:
        from_attributes = True


class OptimalScheduleRequest(BaseModel):
    """Request schema for generating optimal schedule (optional filters)"""
    start_date: Optional[datetime] = Field(
        None,
        description="Filter requests from this date onwards"
    )
    end_date: Optional[datetime] = Field(
        None,
        description="Filter requests up to this date"
    )
    max_entries: Optional[int] = Field(
        None,
        ge=1,
        le=100,
        description="Maximum number of schedule entries to return"
    )
    
    class Config:
        from_attributes = True

