# FitConnect - Personal Trainer Platform

A full-stack web application connecting personal trainers with clients, featuring intelligent booking, payment processing, session management, and AI-powered meal planning.

> **Note**: This is a university project. The payment system is simulated for educational purposes and does not process real transactions.

## 🚀 Quick Start

### Prerequisites
- **Backend**: Python 3.8+, MySQL 8.0+
- **Frontend**: Node.js 16+, npm
- **Tools**: Git, Virtual Environment
- **AI Services**: Groq api key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd personal-trainer-app
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   
   # Create and activate virtual environment
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Initialize database
   python init_db.py
   
   # Run migrations
   alembic upgrade head
   
   # Start backend server
   python -m app.main
   ```
   
   Backend runs at: http://localhost:8000  
   API Docs: http://localhost:8000/docs

3. **Setup Frontend:**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```
   
   Frontend runs at: http://localhost:3000

## 📋 Features

### 🎯 Core Features
- ✅ **User Management** - Client, Trainer, and Admin roles
- ✅ **Trainer Profiles** - Detailed profiles with specializations, ratings, and pricing
- ✅ **Intelligent Booking System** - Multiple booking methods:
  - Direct booking with available time slots
  - Booking requests with trainer approval
  - Smart scheduling with optimal time suggestions
  - Time-based booking with specific start/end times
- ✅ **Payment System** - Simulated payment processing
- ✅ **Session Management** - Complete session lifecycle
- ✅ **Messaging System** - In-app communication
- ✅ **Analytics Dashboard** - Insights for clients, trainers, and admins

### 🧠 Advanced Features
- ✅ **Optimal Scheduling Algorithm**
- ✅ **Availability Management** - Trainers set weekly availability
- ✅ **Time Slot System** - Granular availability tracking
- ✅ **Session Tracking** - Progress monitoring and fitness goals
- ✅ **Payment History** - Transaction tracking with refund capabilities
- ✅ **Email Notifications** - Automated booking confirmations
- ✅ **AI-Powered Meal Planning** - Groq AI integration for personalized meal plans
- ✅ **Chatbot Support** - AI assistant for user queries and support
- ✅ **Admin Dashboard** - Platform management and analytics
- ✅ **Trainer Registration Flow** - Multi-step profile completion

## 🏗️ System Architecture

### Tech Stack

**Backend:**
- FastAPI (Python web framework)
- MySQL (Database)
- SQLAlchemy (ORM)
- Alembic (Migrations)
- JWT (Authentication)
- Pydantic (Validation)
- Groq API (AI Integration)

**Frontend:**
- Next.js 15 (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Context API (State management)

### Project Structure

```
personal-trainer-app/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── schemas/          # Pydantic models
│   │   ├── services/         # Business logic
│   │   ├── models.py         # Database models
│   │   └── main.py           # Application entry
│   └── requirements.txt      # Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   ├── contexts/         # Context providers
│   │   └── lib/              # API client
│   └── package.json         # Dependencies
│
└── README.md               # Documentation
```

## 📊 Database Schema

### Core Tables

**Users & Authentication:**
- `users` - User accounts with roles
- `trainers` - Trainer profiles and details
- `admin_users` - Admin accounts

**Booking System:**
- `bookings` - Session bookings
- `booking_requests` - Pending booking requests
- `time_slots` - Trainer availability slots
- `sessions` - Training session records
- `trainer_availability` - Weekly availability schedules

**Payment System:**
- `payments` - Payment transactions

**Communication:**
- `conversations` - Message threads
- `messages` - Individual messages
- `notifications` - System notifications

**Analytics:**
- `fitness_goals` - Client fitness objectives
- `schedule_optimizations` - AI algorithm results

## 🎓 Booking System

### Four Booking Methods

#### 1. Direct Booking
- Client selects trainer and views available time slots
- Client books specific time slot with exact start/end times
- Sends booking request to trainer
- Trainer approves/rejects
- Automatic session creation upon approval

#### 2. Flexible Booking Request
- Client specifies date range and preferences
- Client submits booking request with training type and location
- Trainer reviews and selects optimal time
- Confirms booking with specific time
- Session created automatically

#### 3. Smart Scheduling (Optimal Algorithm)
- Client enters preferences (times, dates, duration, location)
- System analyzes all available trainers
- AI algorithm finds optimal matches using multiple criteria
- Presents ranked suggestions with confidence scores
- Client selects and books

#### 4. Time-Based Booking
- Client selects specific start and end times
- System validates trainer availability
- Direct booking with precise scheduling
- Immediate confirmation process

### Booking Flow

```
Client Request → Trainer Review → Approval/Rejection
    ↓                                    ↓
Pending Status                   Confirmed Booking
                                        ↓
                                 Session Created
                                        ↓
                                 Payment Required
                                        ↓
                                 Session Completed
```

## 💳 Payment System

### Features
- ✅ Simulated payment processing (safe for academic use)
- ✅ Credit card validation
- ✅ Transaction tracking with unique IDs
- ✅ Payment history and statistics
- ✅ Refund support (trainers/admins)
- ✅ Secure storage (only last 4 digits)

### Test Cards
Use these test card numbers:
- **Visa:** 4111 1111 1111 1111
- **Mastercard:** 5555 5555 5555 4444
- **Amex:** 3782 822463 10005

**Payment Flow:**
1. Booking confirmed by trainer
2. Client clicks "Pay Now"
3. Enters payment details
4. System validates and processes
5. Payment record created
6. Booking marked as paid

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Trainers
- `GET /api/trainers` - List all trainers
- `GET /api/trainers/{id}` - Get trainer details
- `POST /api/trainers` - Create trainer profile

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings/smart-booking` - Smart booking
- `POST /api/bookings/optimal-schedule` - Find optimal schedule
- `PUT /api/bookings/{id}/confirm` - Confirm booking

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions/{id}/complete` - Mark complete
- `POST /api/sessions/{id}/cancel` - Cancel session

### Payments
- `POST /api/payments/` - Create payment
- `GET /api/payments/my-payments` - Payment history
- `POST /api/payments/refund` - Refund payment

### Time Slots
- `GET /api/time-slots/trainer/{id}/available` - Get available slots
- `POST /api/time-slots/bulk-create` - Create multiple slots

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/sessions` - Session analytics
- `GET /api/analytics/clients` - Client analytics

### AI Features
- `POST /api/chatbot/message` - Chatbot interaction
- `POST /api/meal-plan` - Generate meal plan
- `GET /api/meal-plan/history` - Meal plan history

Full API documentation: http://localhost:8000/docs

## 🎨 User Roles

### Client Features
- Browse and search trainers
- Book training sessions (4 methods)
- View and manage bookings
- Make payments
- View payment history
- Set fitness goals
- Message trainers
- View session history
- AI meal planning
- Chatbot support

### Trainer Features
- Complete profile setup
- Set weekly availability
- Create time slots
- Review booking requests
- Approve/reject bookings
- Track client progress
- View earnings and analytics
- Message clients
- Complete/cancel sessions

### Admin Features
- User management
- System analytics
- Process refunds
- Monitor platform health

## 🧪 Testing

### Test Users

**Client:**
- Email: client@example.com
- Password: password123

**Trainer:**
- Email: trainer@example.com
- Password: password123

**Admin:**
- Email: admin@example.com
- Password: password123

### Test Scenarios

1. **Complete Booking Flow:**
   - Login as client
   - Browse trainers
   - Book session via direct booking
   - Login as trainer
   - Approve booking
   - Login as client
   - Make payment
   - View in payment history

2. **Smart Scheduling:**
   - Login as client
   - Go to optimal scheduler
   - Enter preferences
   - View AI-generated suggestions
   - Book optimal time

3. **AI Features:**
   - Test chatbot functionality
   - Generate personalized meal plans
   - Use optimal scheduling algorithm

## 🚨 Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check MySQL is running
mysql -u root -p

# Update config.py with correct credentials
database_url = "mysql+pymysql://root:password@localhost:3306/fitconnect_db"
```

**Migration Errors:**
```bash
# Reset migrations (development only)
alembic downgrade base
alembic upgrade head
```

**Port Already in Use:**
```bash
# Change port in main.py
uvicorn.run("app.main:app", host="0.0.0.0", port=8001)
```

### Frontend Issues

**Module Not Found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API Connection Failed:**
- Check backend is running on port 8000
- Verify API_BASE_URL in `frontend/src/lib/api.ts`

## 📄 License

This is an educational project for university coursework.

## 👥 Contributors

- **Yosef Asadi** - University of Haifa

## 📞 Support

For questions or issues:
1. Check API documentation at http://localhost:8000/docs
2. Review this README for setup instructions
3. Check troubleshooting section for common issues

---

**Made with ❤️ for University of Haifa - Computer Science Program**

*Last Updated: January 2025*

