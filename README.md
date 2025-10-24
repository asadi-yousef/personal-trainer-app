# FitConnect - Personal Trainer Platform

A comprehensive full-stack web application connecting personal trainers with clients, featuring intelligent booking, payment processing, session management, and AI-powered meal planning.

> **Note**: This is a university project. The payment system is simulated for educational purposes and does not process real transactions.

## 🚀 Quick Start

### Prerequisites
- **Backend**: Python 3.8+, MySQL 8.0+
- **Frontend**: Node.js 16+, npm
- **Tools**: Git, Virtual Environment
- **AI Services**: OpenAI API Key (for meal planning and chatbot features)

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
- ✅ **User Management** - Client, Trainer, and Admin roles with comprehensive authentication
- ✅ **Trainer Profiles** - Detailed profiles with specializations, ratings, pricing, and location preferences
- ✅ **Intelligent Booking System** - Multiple booking methods:
  - Direct booking with available time slots
  - Booking requests with trainer approval
  - Smart scheduling with optimal time suggestions
  - Time-based booking with specific start/end times
- ✅ **Payment System** - Simulated payment processing with transaction tracking
- ✅ **Session Management** - Complete session lifecycle with progress tracking
- ✅ **Workout Programs** - Custom programs with exercises, sets, and progress tracking
- ✅ **Messaging System** - Real-time in-app communication with conversation management
- ✅ **Analytics Dashboard** - Comprehensive insights for clients, trainers, and admins

### 🧠 Advanced Features
- ✅ **Optimal Scheduling Algorithm** - AI-powered scheduling with multiple optimization strategies
- ✅ **Availability Management** - Trainers set weekly availability with scheduling preferences
- ✅ **Time Slot System** - Granular availability tracking with locking mechanisms
- ✅ **Session Tracking** - Detailed progress monitoring with fitness goals and performance metrics
- ✅ **Payment History** - Complete transaction tracking with refund capabilities
- ✅ **Email Notifications** - Automated booking confirmations and reminders
- ✅ **AI-Powered Meal Planning** - OpenAI integration for personalized meal plans
- ✅ **Chatbot Support** - AI assistant for user queries and support
- ✅ **Admin Dashboard** - Comprehensive platform management and analytics
- ✅ **Trainer Registration Flow** - Multi-step profile completion with validation
- ✅ **Scheduling Preferences** - Advanced trainer scheduling constraints and preferences

## 🏗️ System Architecture

### Tech Stack

**Backend:**
- **FastAPI** (Python web framework) - Modern, fast web framework
- **MySQL 8.0+** (Database) - Reliable relational database
- **SQLAlchemy 2.0** (ORM) - Advanced ORM with relationship management
- **Alembic** (Migrations) - Database schema versioning
- **JWT** (Authentication) - Secure token-based authentication
- **Pydantic 2.0** (Validation) - Data validation and serialization
- **OpenAI API** (AI Integration) - GPT models for meal planning and chatbot
- **bcrypt** (Password Hashing) - Secure password storage
- **python-jose** (JWT Handling) - JWT token management
- **fastapi-mail** (Email Service) - Email notifications
- **uvicorn** (ASGI Server) - High-performance ASGI server

**Frontend:**
- **Next.js 15.5.3** (React framework) - Latest Next.js with App Router
- **React 19.1.0** (UI Library) - Latest React with concurrent features
- **TypeScript 5** (Type safety) - Full type safety across the application
- **Tailwind CSS 4** (Styling) - Utility-first CSS framework
- **AOS** (Animations) - Scroll animations and transitions
- **Context API** (State management) - React context for global state
- **Feather Icons** (Icons) - Beautiful, customizable icons
- **ESLint** (Code Quality) - Code linting and formatting

### Project Structure

```
personal-trainer-app/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints (22 routers)
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── trainers.py   # Trainer management
│   │   │   ├── bookings.py   # Booking system
│   │   │   ├── sessions.py   # Session management
│   │   │   ├── payments.py   # Payment processing
│   │   │   ├── analytics.py  # Analytics and reporting
│   │   │   ├── messages.py   # Messaging system
│   │   │   ├── programs.py   # Workout programs
│   │   │   ├── optimal_schedule.py # AI scheduling
│   │   │   ├── chatbot.py    # AI chatbot
│   │   │   ├── meal_planning.py # AI meal planning
│   │   │   ├── admin_auth.py # Admin authentication
│   │   │   └── admin_management.py # Admin dashboard
│   │   ├── schemas/          # Pydantic models (18 schemas)
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Utility functions
│   │   ├── models.py         # SQLAlchemy database models
│   │   ├── database.py       # Database connection
│   │   ├── config.py         # Application configuration
│   │   └── main.py           # FastAPI application entry
│   ├── alembic/              # Database migrations
│   │   └── versions/         # Migration files
│   ├── requirements.txt      # Python dependencies
│   └── README.md            # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js 15 App Router pages
│   │   │   ├── admin/        # Admin dashboard pages
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── client/       # Client-specific pages
│   │   │   ├── trainer/      # Trainer-specific pages
│   │   │   ├── optimal-scheduling/ # AI scheduling page
│   │   │   └── meal-planner/ # AI meal planning page
│   │   ├── components/       # React components (40+ components)
│   │   │   ├── Admin/        # Admin dashboard components
│   │   │   ├── Client/       # Client-specific components
│   │   │   ├── Trainer/      # Trainer-specific components
│   │   │   ├── Messaging/    # Chat and messaging components
│   │   │   └── Cards/        # Reusable card components
│   │   ├── contexts/         # React Context providers
│   │   ├── lib/              # API client and utilities
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Utility functions
│   ├── package.json         # Node.js dependencies
│   └── README.md           # Frontend documentation
│
├── testsprite_tests/        # Automated testing suite
├── README.md               # Main project documentation
└── *.py                    # Database setup and testing scripts
```

## 📊 Database Schema

### Core Tables

**Users & Authentication:**
- `users` - User accounts with roles (client, trainer, admin)
- `trainers` - Trainer profiles with specializations and pricing
- `admin_users` - Admin accounts with different permission levels

**Booking System:**
- `bookings` - Session bookings with time-based scheduling
- `booking_requests` - Pending booking requests with preferences
- `time_slots` - Granular trainer availability slots
- `sessions` - Training session records with progress tracking
- `trainer_availability` - Weekly availability schedules
- `trainer_scheduling_preferences` - Advanced scheduling constraints

**Payment System:**
- `payments` - Payment transactions with refund support
- Payment tracking with card details (last 4 digits only)

**Content & Programs:**
- `programs` - Workout programs with exercises
- `workouts` - Individual workout sessions within programs
- `exercises` - Exercise library with instructions
- `workout_exercises` - Exercise configurations within workouts
- `program_assignments` - Client program assignments
- `workout_progress` - Client progress tracking
- `session_templates` - Reusable session templates

**Communication:**
- `conversations` - Message thread management
- `messages` - Individual messages with attachments
- `message_templates` - Reusable message templates
- `notifications` - System notifications

**Analytics & Tracking:**
- `fitness_goals` - Client fitness objectives
- `session_goals` - Session-specific goals
- `exercise_performances` - Detailed exercise tracking
- `schedule_optimizations` - AI algorithm results
- `session_tracking` - Comprehensive session analytics

**Advanced Features:**
- `trainer_scheduling_preferences` - Trainer scheduling constraints
- `schedule_optimizations` - AI optimization results
- `admin_users` - Multi-level admin system

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

### Authentication & Users
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset

### Trainers
- `GET /api/trainers` - List all trainers with filtering
- `GET /api/trainers/{id}` - Get trainer details
- `POST /api/trainers` - Create trainer profile
- `GET /api/trainer-profile/me` - Get my trainer profile
- `PATCH /api/trainer-profile/basic-info` - Update basic info
- `PATCH /api/trainer-profile/training-info` - Update training info
- `PATCH /api/trainer-profile/gym-info` - Update gym information
- `PATCH /api/trainer-profile/pricing` - Update pricing

### Bookings & Scheduling
- `GET /api/bookings` - List bookings
- `POST /api/bookings/smart-booking` - Smart booking
- `POST /api/bookings/optimal-schedule` - Find optimal schedule
- `POST /api/bookings/greedy-optimization` - Greedy optimization
- `PUT /api/bookings/{id}/confirm` - Confirm booking
- `GET /api/booking-management/my-bookings` - Get my bookings
- `POST /api/booking-management/cancel-booking` - Cancel booking
- `POST /api/booking-management/reschedule-booking` - Reschedule booking

### Booking Requests
- `POST /api/booking-management/booking-request` - Create request
- `GET /api/booking-management/booking-requests` - List requests
- `GET /api/booking-management/my-booking-requests` - My requests
- `POST /api/booking-management/approve-booking` - Approve booking
- `POST /api/booking-management/reject-booking` - Reject booking

### Time Slots
- `GET /api/time-slots/trainer/{id}/available` - Get available slots
- `POST /api/time-slots/bulk-create` - Create multiple slots
- `POST /api/time-slots/book` - Book time slot
- `PUT /api/time-slots/{id}` - Update time slot
- `DELETE /api/time-slots/{id}` - Delete time slot

### Sessions & Programs
- `GET /api/sessions` - List sessions
- `POST /api/sessions/{id}/complete` - Mark complete
- `POST /api/sessions/{id}/cancel` - Cancel session
- `GET /api/programs` - List programs
- `GET /api/programs/assignments/my-programs` - My programs

### Payments
- `POST /api/payments/` - Create payment
- `GET /api/payments/my-payments` - Payment history
- `GET /api/payments/stats` - Payment statistics
- `POST /api/payments/refund` - Refund payment

### Messaging
- `GET /api/messages/conversations/` - Get conversations
- `GET /api/messages/conversations/{id}/messages` - Get conversation messages
- `POST /api/messages/` - Send message
- `PUT /api/messages/read` - Mark conversation as read

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/sessions` - Session analytics
- `GET /api/analytics/clients` - Client analytics
- `GET /api/analytics/trainers` - Trainer analytics
- `GET /api/analytics/kpis` - Key performance indicators

### AI Features
- `POST /api/chatbot/message` - Chatbot interaction
- `POST /api/meal-plan` - Generate meal plan
- `GET /api/meal-plan/history` - Meal plan history

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get admin user
- `GET /api/admin/dashboard/stats` - Admin dashboard stats
- `GET /api/admin/users` - User management

### Scheduling Preferences
- `GET /api/scheduling-preferences/me` - Get preferences
- `PUT /api/scheduling-preferences/me` - Update preferences
- `POST /api/scheduling-preferences/reset` - Reset preferences

Full API documentation: http://localhost:8000/docs

## 🎨 User Roles

### Client Features
- **Browse and search trainers** with advanced filtering
- **Book training sessions** (4 methods: direct, flexible, smart, time-based)
- **View and manage bookings** with real-time status updates
- **Make payments** with secure card processing
- **View payment history** with detailed transaction records
- **Track workout programs** with progress monitoring
- **Set fitness goals** with milestone tracking
- **Message trainers** with real-time chat
- **View session history** with performance analytics
- **AI meal planning** with personalized nutrition recommendations
- **Chatbot support** for instant assistance

### Trainer Features
- **Complete profile setup** with multi-step registration
- **Set weekly availability** with scheduling preferences
- **Create time slots** with bulk creation tools
- **Review booking requests** with approval workflow
- **Approve/reject bookings** with detailed feedback
- **Create workout programs** with exercise libraries
- **Track client progress** with performance metrics
- **View earnings and analytics** with comprehensive reporting
- **Message clients** with conversation management
- **Complete/cancel sessions** with status tracking
- **Scheduling preferences** with advanced constraints
- **Profile management** with gym information and pricing

### Admin Features
- **User management** with role-based permissions
- **System analytics** with real-time dashboards
- **Process refunds** with transaction management
- **Monitor platform health** with performance metrics
- **Trainer management** with approval workflows
- **Booking oversight** with conflict resolution
- **Payment monitoring** with fraud detection
- **Content moderation** with message management

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
   - Browse trainers with filters
   - Book session via direct booking
   - Login as trainer
   - Approve booking
   - Login as client
   - Make payment
   - View in payment history

2. **Smart Scheduling:**
   - Login as client
   - Go to optimal scheduler
   - Enter preferences (times, dates, location)
   - View AI-generated suggestions
   - Book optimal time

3. **Trainer Registration:**
   - Register as trainer
   - Complete multi-step profile setup
   - Set availability and preferences
   - Create time slots
   - Review booking requests

4. **AI Features:**
   - Test chatbot functionality
   - Generate personalized meal plans
   - Use optimal scheduling algorithm

5. **Admin Dashboard:**
   - Login as admin
   - View system analytics
   - Manage users and trainers
   - Process refunds

## 📱 Application Features

The application includes:
- **Modern, responsive UI** with Tailwind CSS
- **Real-time updates** with live status changes
- **Smooth animations** with AOS library
- **Professional dashboards** for all user types
- **Interactive booking calendars** with drag-and-drop
- **Secure payment forms** with validation
- **Analytics charts** with real-time data
- **AI-powered features** with OpenAI integration
- **Mobile-responsive design** for all devices
- **Dark/light mode support** (planned)

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

## 🎯 Academic Project Notes

### Educational Features
- **Simulated Payments** - No real transactions
- **Test Data** - Pre-populated for demonstration
- **Complete Documentation** - API docs and diagrams
- **Clean Code** - Well-commented and structured

### What This Demonstrates
- ✅ Full-stack development (Frontend + Backend)
- ✅ Database design and normalization
- ✅ RESTful API design
- ✅ Authentication & Authorization
- ✅ Algorithm implementation (scheduling)
- ✅ Payment system concepts
- ✅ User experience design
- ✅ Project documentation
- ✅ Software architecture

### Grading Criteria Met
- **Functionality:** Complete end-to-end workflows
- **Code Quality:** TypeScript, type safety, validation
- **Database:** Normalized schema with proper relationships
- **Security:** JWT auth, password hashing, input validation
- **UI/UX:** Modern, responsive, accessible
- **Documentation:** Comprehensive README, API docs, diagrams
- **Testing:** Test users, test scenarios, test data

## 📄 License

This is an educational project for university coursework.

## 👥 Contributors

- **Yosef Asadi** - University of Haifa
  - Full-stack development
  - AI integration and optimization algorithms
  - Database design and API architecture
  - Frontend development with modern React patterns

## 📞 Support

For questions or issues:
1. **Check API documentation** at http://localhost:8000/docs
2. **Review this README** for comprehensive setup instructions
3. **Check troubleshooting section** for common issues
4. **Examine code comments** for implementation details
5. **Check backend/README.md** for backend-specific documentation
6. **Check frontend/README.md** for frontend-specific documentation

## 🎉 Acknowledgments

- **Built with modern technologies**: FastAPI, Next.js 15, React 19, TypeScript 5
- **AI Integration**: OpenAI GPT models for meal planning and chatbot
- **Database Design**: Comprehensive schema with 20+ tables
- **API Architecture**: RESTful design with 50+ endpoints
- **Frontend**: Modern React patterns with TypeScript
- **Educational Purpose**: Demonstrates real-world application architecture
- **Testing**: Comprehensive test suite with automated testing

## 🏆 Project Highlights

- **22 Backend Routers** - Comprehensive API coverage
- **40+ Frontend Components** - Modular React architecture
- **20+ Database Tables** - Normalized relational schema
- **50+ API Endpoints** - Full CRUD operations
- **AI Integration** - OpenAI GPT for intelligent features
- **Real-time Features** - Live updates and messaging
- **Advanced Scheduling** - AI-powered optimization algorithms
- **Comprehensive Analytics** - Multi-level reporting system

---

**Made with ❤️ for University of Haifa - Computer Science Program**

*Last Updated: January 2025*

