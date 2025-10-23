"""
Admin authentication router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from passlib.context import CryptContext

from app.database import get_db
from app.models import AdminUser, AdminLevel
from app.schemas.admin import (
    AdminLoginRequest, 
    AdminLoginResponse, 
    AdminInfo,
    AdminCreateRequest,
    AdminResponse
)
from app.config import settings

router = APIRouter(prefix="/api/admin", tags=["admin-auth"])
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Admin JWT settings
ADMIN_JWT_SECRET = "admin-secret-key-change-in-production"  # Change this!
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_MINUTES = 60  # 1 hour for admin sessions


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_admin_access_token(data: dict) -> str:
    """Create JWT token for admin"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ADMIN_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "admin"})
    encoded_jwt = jwt.encode(to_encode, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGORITHM)
    return encoded_jwt


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> AdminUser:
    """Get current admin from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGORITHM])
        admin_id: int = payload.get("sub")
        token_type: str = payload.get("type")
        
        if admin_id is None or token_type != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token"
        )
    
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found or inactive"
        )
    
    return admin


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    # Find admin by username
    admin = db.query(AdminUser).filter(AdminUser.username == request.username).first()
    
    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(request.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_admin_access_token(data={"sub": str(admin.id)})
    
    return AdminLoginResponse(
        access_token=access_token,
        admin_info=AdminInfo(
            id=admin.id,
            username=admin.username,
            email=admin.email,
            admin_level=admin.admin_level,
            is_active=admin.is_active,
            last_login=admin.last_login,
            created_at=admin.created_at
        )
    )


@router.get("/me", response_model=AdminInfo)
async def get_current_admin_info(current_admin: AdminUser = Depends(get_current_admin)):
    """Get current admin information"""
    return AdminInfo(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        admin_level=current_admin.admin_level,
        is_active=current_admin.is_active,
        last_login=current_admin.last_login,
        created_at=current_admin.created_at
    )


@router.post("/create", response_model=AdminResponse)
async def create_admin(
    request: AdminCreateRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create new admin (super admin only)"""
    # Check if current admin is super admin
    if current_admin.admin_level != AdminLevel.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create new admins"
        )
    
    # Check if username or email already exists
    existing_admin = db.query(AdminUser).filter(
        (AdminUser.username == request.username) | (AdminUser.email == request.email)
    ).first()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Create new admin
    admin = AdminUser(
        username=request.username,
        email=request.email,
        password_hash=get_password_hash(request.password),
        admin_level=request.admin_level,
        created_by=current_admin.id
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    return AdminResponse(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        admin_level=admin.admin_level,
        is_active=admin.is_active,
        last_login=admin.last_login,
        created_at=admin.created_at,
        created_by=admin.created_by
    )

