# FitConnect Backend API

Personal Trainer Platform API with Optimal Scheduling Algorithm

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- Virtual environment (recommended)

### Installation

1. **Activate virtual environment:**
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure database:**
   - Update database credentials in `app/config.py`
   - Default settings:
     - Host: localhost:3306
     - Database: fitconnect_db
     - User: root
     - Password: password

4. **Initialize database:**
   ```bash
   python init_db.py
   ```

5. **Create and apply migrations:**
   ```bash
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

6. **Start the API server:**
   ```bash
   python -m app.main
   ```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts (clients, trainers, admins)
- **trainers** - Trainer profiles and specializations
- **sessions** - Training sessions and bookings
- **programs** - Workout programs created by trainers
- **messages** - Communication between users
- **bookings** - Session booking requests
- **schedule_optimizations** - Algorithm optimization results

### Key Features
- **User Roles**: Client, Trainer, Admin
- **Session Management**: Booking, scheduling, status tracking
- **Optimal Scheduling**: AI-powered scheduling algorithm
- **Communication**: In-app messaging system
- **Program Management**: Custom workout programs

## 🔧 Configuration

Update `app/config.py` for your environment:

```python
# Database
database_url = "mysql+pymysql://user:password@host:port/database"

# Security
secret_key = "your-secret-key"
access_token_expire_minutes = 30

# CORS
cors_origins = ["http://localhost:3000"]
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile
- `GET /api/users/{id}` - Get user by ID

### Trainers
- `GET /api/trainers` - List all trainers
- `GET /api/trainers/{id}` - Get trainer details
- `POST /api/trainers` - Create trainer profile

### Sessions
- `GET /api/sessions` - List user sessions
- `POST /api/sessions` - Book new session
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Cancel session

### Scheduling Algorithm
- `POST /api/scheduling/optimize` - Run optimization algorithm
- `GET /api/scheduling/suggestions` - Get optimal time suggestions
- `POST /api/scheduling/apply` - Apply optimization results

## 🔄 Database Migrations

### Create Migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migration
```bash
alembic upgrade head
```

### Rollback Migration
```bash
alembic downgrade -1
```

## 🧪 Testing

```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=app
```

## 📝 Development

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   ├── config.py        # Configuration settings
│   ├── database.py      # Database connection
│   ├── models.py        # SQLAlchemy models
│   └── routers/         # API route handlers
├── alembic/             # Database migrations
├── requirements.txt     # Python dependencies
├── init_db.py          # Database initialization
└── start.py            # Startup script
```

### Adding New Features
1. Create new models in `models.py`
2. Generate migration: `alembic revision --autogenerate`
3. Apply migration: `alembic upgrade head`
4. Create API routes in `routers/`
5. Add routes to `main.py`

## 🚨 Troubleshooting

### Common Issues

**Database Connection Error:**
- Check MySQL is running
- Verify credentials in `config.py`
- Ensure database exists

**Migration Errors:**
- Check model imports in `alembic/env.py`
- Verify database schema matches models
- Try recreating migration

**Import Errors:**
- Ensure virtual environment is activated
- Check Python path in `alembic/env.py`
- Verify all dependencies are installed

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check database connection with `/health`

## 🎯 Next Steps

- [ ] Implement authentication system
- [ ] Create API routes for all entities
- [ ] Add scheduling algorithm endpoints
- [ ] Implement real-time notifications
- [ ] Add comprehensive testing
- [ ] Set up production deployment



