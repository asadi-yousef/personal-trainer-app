"""
Configuration settings for FitConnect API
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "1@2@3@4_5Tuf"
    db_name: str = "fitconnect_db"
    
    @property
    def database_url(self) -> str:
        """Generate database URL from components"""
        from urllib.parse import quote_plus
        password_encoded = quote_plus(self.db_password)
        return f"mysql+pymysql://{self.db_user}:{password_encoded}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    # Security
    secret_key: str = "your-secret-key-here-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Application
    app_name: str = "FitConnect API"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Email (for future use)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()
