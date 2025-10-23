"""
Admin schemas for authentication and management
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models import AdminLevel


class AdminLoginRequest(BaseModel):
    """Admin login request"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class AdminLoginResponse(BaseModel):
    """Admin login response"""
    access_token: str
    token_type: str = "bearer"
    admin_info: "AdminInfo"


class AdminInfo(BaseModel):
    """Admin user information"""
    id: int
    username: str
    email: str
    admin_level: AdminLevel
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime


class AdminCreateRequest(BaseModel):
    """Create new admin request"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    admin_level: AdminLevel = AdminLevel.VIEWER


class AdminUpdateRequest(BaseModel):
    """Update admin request"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    admin_level: Optional[AdminLevel] = None
    is_active: Optional[bool] = None


class AdminResponse(BaseModel):
    """Admin user response"""
    id: int
    username: str
    email: str
    admin_level: AdminLevel
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[int] = None


# Update forward references
AdminLoginResponse.model_rebuild()

