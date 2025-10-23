"""
FastAPI main application
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from app.config import settings
from app.database import get_db, create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting FitConnect API...")
    create_tables()
    print("✅ Database tables created/verified")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down FitConnect API...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Personal Trainer Platform API with Optimal Scheduling",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to FitConnect API",
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "environment": settings.environment
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )


# Include routers
from app.routers import auth, trainers, sessions, availability, bookings, programs, messages, session_tracking, analytics, time_slots, booking_requests, trainer_registration, booking_management, payments, optimal_schedule, trainer_profile, scheduling_preferences, chatbot, meal_planning
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(trainers.router, prefix="/api/trainers", tags=["Trainers"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(availability.router, prefix="/api", tags=["Availability"])
app.include_router(bookings.router, prefix="/api", tags=["Bookings"])
app.include_router(booking_requests.router, prefix="/api", tags=["Booking Requests"])
app.include_router(booking_management.router, prefix="/api/booking-management", tags=["Booking Management"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(programs.router, prefix="/api", tags=["Programs"])
app.include_router(messages.router, prefix="/api", tags=["Messages"])
app.include_router(session_tracking.router, prefix="/api", tags=["Session Tracking"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(time_slots.router, prefix="/api", tags=["Time Slots"])
app.include_router(trainer_registration.router, tags=["Trainer Registration"])
app.include_router(trainer_profile.router, tags=["Trainer Profile"])
app.include_router(scheduling_preferences.router, tags=["Scheduling Preferences"])
app.include_router(optimal_schedule.router, prefix="/api", tags=["Optimal Schedule"])  # Provides /api/trainer/me/optimal-schedule endpoint
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])  # /api/chatbot/message
app.include_router(meal_planning.router, prefix="/api", tags=["Meal Planning"])  # /api/meal-plan

# TODO: Add more routers as we build them
# from app.routers import users, programs, messages
# app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(programs.router, prefix="/api/programs", tags=["Programs"])
# app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )

