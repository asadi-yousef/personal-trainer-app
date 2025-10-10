# Personal Trainer App - Complete Booking System Explanation

## System Architecture Overview

This is a comprehensive personal trainer booking application built with **FastAPI (Python) backend** and **Next.js (TypeScript) frontend**. The booking system uses a sophisticated dual-model approach with intelligent scheduling algorithms and atomic database operations.

---

## Core Database Models

### 1. User & Trainer Models
```python
User:
  - id, email, username, full_name
  - role: CLIENT | TRAINER | ADMIN
  - Relationships: trainer_profile, sessions, messages

Trainer:
  - id, user_id (FK to User)
  - specialty, rating, price_per_hour
  - training_types (JSON array)
  - gym_name, gym_address
  - Relationships: sessions, time_slots, booking_requests
```

### 2. Booking System Models

#### BookingRequest (Flexible Scheduling)
```python
BookingRequest:
  - id, client_id, trainer_id
  - session_type, duration_minutes, location
  - special_requests
  
  # Time preferences
  - start_time, end_time (for direct booking)
  - preferred_start_date, preferred_end_date (for flexible)
  - preferred_times: JSON ["10:00-12:00", "14:00-16:00"]
  - avoid_times: JSON ["09:00-09:30"]
  - allow_weekends, allow_evenings
  
  # Status management
  - status: PENDING | APPROVED | REJECTED | EXPIRED
  - expires_at (24-hour window)
  - confirmed_date, rejection_reason
```

#### Booking (Confirmed Sessions)
```python
Booking:
  - id, client_id, trainer_id
  - session_type, duration_minutes
  - start_time, end_time (confirmed times)
  - total_cost, price_per_hour
  - location_type: GYM | HOME | ONLINE
  - status: PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
  - is_recurring, recurring_pattern
  
  Relationships: sessions, time_slots, payments
```

#### TimeSlot (Availability Management)
```python
TimeSlot:
  - id, trainer_id
  - date, start_time, end_time
  - duration_minutes (typically 60)
  - is_available, is_booked
  - booking_id (FK, nullable)
  - locked_until (for concurrency control)
  
  Purpose: Represents trainer's available time blocks
```

#### Session (Training Records)
```python
Session:
  - id, client_id, trainer_id, booking_id
  - title, session_type, scheduled_date
  - duration_minutes, location
  - status: PENDING | CONFIRMED | COMPLETED | CANCELLED
  - actual_start_time, actual_end_time
  - client_rating, trainer_rating
  - Exercise performance tracking fields
  
  Purpose: Detailed training session records
```

---

## Booking Workflow: Two Methods

### Method 1: Direct Slot Booking

**Client Perspective:**
1. Client views trainer profile
2. Selects desired date from calendar
3. System fetches available TimeSlots for that date
4. Client sees available 60-minute slots (e.g., 9:00, 10:00, 11:00)
5. Client selects specific slot and duration
6. Creates BookingRequest with exact `start_time` and `end_time`

**Flow:**
```
Client -> Select Date -> View Available Slots -> Choose Slot -> Create Request
                                                                      ↓
Trainer <- Email Notification <- BookingRequest Created (status: PENDING)
       ↓
    Review Request
       ↓
    APPROVE/REJECT
       ↓
    [If APPROVE] → Atomic Transaction:
                   1. Create Booking
                   2. Mark TimeSlots as booked
                   3. Create Session
                   4. Update BookingRequest status
                   5. COMMIT (or ROLLBACK on failure)
```

### Method 2: Flexible Request (Preference-Based)

**Client Perspective:**
1. Client submits request with preferences:
   - Date range (e.g., "next week")
   - Preferred times (e.g., "mornings 10-12")
   - Times to avoid (e.g., "9-9:30 AM")
   - Weekend/evening availability
2. System doesn't book immediately - waits for trainer

**Trainer Perspective:**
1. Receives BookingRequest with preferences
2. Can view W_C scored slots (ranked by preference match)
3. Chooses optimal slot for client
4. Approves with confirmed time

**Flow:**
```
Client -> Submit Preferences -> BookingRequest (PENDING)
                                      ↓
                        Trainer gets notification
                                      ↓
                        Views W_C scored slots
                                      ↓
                            Selects best match
                                      ↓
                                   APPROVE
                                      ↓
                        Atomic transaction completes
```

---

## W_C Scoring System (Client Preference Match)

### Purpose
Ranks available time slots by how well they match client preferences. Higher score = better match.

### Score Components

#### 1. Date Match (0-50 points)
```python
# Linear decay from preferred start date
if slot_date in [preferred_start, preferred_end]:
    days_from_start = (slot_date - preferred_start_date).days
    total_days = (preferred_end_date - preferred_start_date).days
    score = 50 * (1 - days_from_start / total_days)
else:
    score = 0

# Example:
# Range: Jan 1-10
# Jan 1 slot: 50 points (closest to start)
# Jan 5 slot: 30 points
# Jan 10 slot: 5 points
```

#### 2. Time of Day Match (0-40 points or -50 penalty)
```python
# Check against preferred time blocks
if slot overlaps with preferred_times:
    score = 40  # Perfect match
elif slot overlaps with avoid_times:
    penalty = -50  # Strong penalty
else:
    score = 20  # Neutral

# Example:
# Preferred: ["10:00-12:00"]
# Avoid: ["09:00-09:30"]
# 
# 10:00-11:00 slot: +40 points
# 09:00-10:00 slot: -50 points (overlaps avoid)
# 14:00-15:00 slot: +20 points (neutral)
```

#### 3. Weekend/Evening Bonus (0-10 points)
```python
bonus = 0

if allow_weekends and slot.weekday() in [5, 6]:
    bonus += 5

if allow_evenings and 17:00 <= slot.time() < 21:00:
    bonus += 5

return bonus
```

### Example Score Calculation

**Scenario:**
```python
BookingRequest:
  preferred_start_date: Jan 15
  preferred_end_date: Jan 20
  preferred_times: ["10:00-12:00", "14:00-16:00"]
  avoid_times: ["09:00-09:30"]
  allow_weekends: True
  allow_evenings: False

TimeSlot: Jan 16, 10:00-11:00 (Wednesday)

Calculation:
  Date Match: 50 * (1 - 1/5) = 40 points  (1 day from start)
  Time Match: 40 points                    (in preferred block)
  Avoid Penalty: 0                         (no overlap)
  Weekend Bonus: 0                         (not weekend)
  
  Total W_C Score: 80 points
```

### Manual Review Flag
- If `total_score < 0`: Flag for manual review
- Logged as WARNING in system logs
- Indicates preferences are hard to match

---

## Atomic Multi-Slot Booking

### Problem
When a client books a session longer than 60 minutes (e.g., 90 or 120 minutes), multiple consecutive TimeSlots must be reserved. This creates a concurrency risk:

**Bad Scenario (Without Atomicity):**
```
Time: 10:00    Client A books 10:00-12:00 (needs slots A and B)
Time: 10:01    Client B books 11:00-13:00 (needs slots B and C)

Race condition:
- Both processes check slot B availability: AVAILABLE ✓
- Client A books slot A, then slot B
- Client B books slot B, then slot C
- RESULT: Slot B double-booked! ❌
```

### Solution: Atomic Transaction

All operations happen within a database transaction that either completes entirely or rolls back completely.

```python
BEGIN TRANSACTION
    # Step 1: Lock ALL required slots temporarily (5 min)
    lock_slots([slot_A, slot_B])
    
    # Step 2: Verify ALL slots are still available
    if any_slot_unavailable:
        ROLLBACK
        return "Conflict detected"
    
    # Step 3: Create Booking record
    booking = create_booking()
    
    # Step 4: Update ALL slots atomically
    updated = update_slots([slot_A, slot_B], booking_id=booking.id)
    
    # Step 5: CRITICAL CHECK
    if updated_count != expected_count:
        ROLLBACK  # Someone else booked a slot
        return "Concurrency conflict"
    
COMMIT  # Only if all steps succeeded
```

### Implementation Details

#### 1. Temporary Locking
```python
def _atomic_lock_slots(slot_ids):
    lock_until = now() + 5 minutes
    
    # Try to lock ALL slots in one query
    locked = db.query(TimeSlot).filter(
        TimeSlot.id.in_(slot_ids),
        TimeSlot.is_booked == False,
        TimeSlot.locked_until == None  # Not already locked
    ).update(locked_until=lock_until)
    
    # ALL must be locked, or fail
    return locked == len(slot_ids)
```

#### 2. Atomic Update with Verification
```python
# Update ALL slots in single SQL UPDATE statement
updated_count = db.query(TimeSlot).filter(
    TimeSlot.id.in_([slot_A_id, slot_B_id]),
    TimeSlot.is_booked == False  # Re-check availability
).update({
    'is_booked': True,
    'booking_id': booking.id
})

# CRITICAL: Verify ALL were updated
if updated_count != 2:
    raise IntegrityError("Concurrency conflict")
    # This triggers automatic ROLLBACK
```

#### 3. Transaction Context Manager
```python
@contextmanager
def atomic_booking(self):
    try:
        yield self.db
        self.db.commit()  # Success path
    except Exception as e:
        self.db.rollback()  # Undo everything
        logger.error(f"Transaction rolled back: {e}")
        raise
```

### Example: 90-Minute Booking

```python
# Client requests 90-minute session starting at 10:00
duration_minutes = 90
start_time = datetime(2024, 1, 15, 10, 0)

# System calculates: needs 2 slots (90 / 60 = 1.5 → 2)
required_slots = 2

# Find consecutive slots
available = [
    TimeSlot(id=123, start=10:00, end=11:00),  # Slot A
    TimeSlot(id=124, start=11:00, end=12:00)   # Slot B
]

# Atomic booking process
with atomic_booking():
    # Lock both slots
    locked = _atomic_lock_slots([123, 124])
    if not locked:
        raise ValueError("Slots no longer available")
    
    # Create booking
    booking = Booking(
        start_time=10:00,
        end_time=11:30,  # Only using 30 min of second slot
        duration_minutes=90
    )
    db.add(booking)
    db.flush()  # Get booking.id without committing
    
    # Update both slots
    updated = db.query(TimeSlot).filter(
        TimeSlot.id.in_([123, 124]),
        TimeSlot.is_booked == False
    ).update({
        'is_booked': True,
        'booking_id': booking.id
    })
    
    # Verify
    if updated != 2:
        raise IntegrityError()  # Triggers ROLLBACK
    
    # If we reach here: COMMIT
```

---

## Complete Booking Flow Example

### Scenario: Client Books 120-Minute Strength Training

**Step 1: Client Submits Request**
```javascript
// Frontend API call
POST /booking-requests/
{
  trainer_id: 456,
  session_type: "Strength Training",
  duration_minutes: 120,
  location: "Gym Studio",
  preferred_start_date: "2024-01-15",
  preferred_end_date: "2024-01-20",
  preferred_times: ["10:00-12:00", "14:00-16:00"],
  avoid_times: ["09:00-09:30"],
  allow_weekends: true,
  allow_evenings: false,
  special_requests: "Focus on compound movements"
}
```

**Step 2: System Creates BookingRequest**
```python
# Backend creates record
booking_request = BookingRequest(
    client_id=user.id,
    trainer_id=456,
    status=PENDING,
    expires_at=now() + 24 hours,
    ...
)
db.add(booking_request)
db.commit()

# Send email to trainer
send_email(trainer.email, "New Booking Request")
```

**Step 3: Trainer Views Request**
```javascript
// Frontend fetches scored slots
GET /booking-requests/123/scored-slots?max_results=5

Response:
{
  scored_slots: [
    {
      total_score: 90,
      breakdown: {
        date_match: 45,
        time_of_day_match: 40,
        avoid_time_penalty: 0,
        weekend_evening_bonus: 5
      },
      slot_id: 789,
      slot_start: "2024-01-16T10:00:00Z",
      consecutive_slot_ids: [789, 790]  // 120 min = 2 slots
    },
    // ... more options
  ]
}
```

**Step 4: Trainer Approves Best Slot**
```javascript
PUT /booking-requests/123/approve
{
  status: "APPROVED",
  confirmed_date: "2024-01-16T10:00:00Z",
  notes: "Looking forward to working with you!"
}
```

**Step 5: Atomic Booking Transaction**
```python
# Backend executes atomic operation
def approve_booking_request(request_id, trainer_id):
    with atomic_booking():
        # Get request
        request = db.query(BookingRequest).get(request_id)
        
        # Find required slots (2 for 120 min)
        slot_ids = find_consecutive_slots(
            trainer_id=trainer_id,
            start=request.confirmed_date,
            duration=120
        )
        # Result: [789, 790]
        
        # Lock slots
        if not atomic_lock_slots(slot_ids):
            raise ValueError("Slots unavailable")
        
        # Create booking
        booking = Booking(
            client_id=request.client_id,
            trainer_id=trainer_id,
            start_time=2024-01-16 10:00,
            end_time=2024-01-16 12:00,
            duration_minutes=120,
            status=CONFIRMED
        )
        db.add(booking)
        db.flush()
        
        # Update slots atomically
        updated = db.query(TimeSlot).filter(
            TimeSlot.id.in_([789, 790]),
            TimeSlot.is_booked == False
        ).update({
            'is_booked': True,
            'booking_id': booking.id
        })
        
        # Verify
        if updated != 2:
            raise IntegrityError("Conflict")
        
        # Create session
        session = Session(
            client_id=request.client_id,
            trainer_id=trainer_id,
            booking_id=booking.id,
            scheduled_date=2024-01-16 10:00,
            duration_minutes=120,
            status=CONFIRMED
        )
        db.add(session)
        
        # Update request
        request.status = APPROVED
        
        # Commit everything
        return booking
```

**Step 6: Client Receives Confirmation**
```javascript
// Frontend shows success
{
  booking_id: 789,
  status: "confirmed",
  message: "Booking approved and confirmed",
  confirmed_time: "2024-01-16T10:00:00Z",
  slots_booked: 2
}

// Email sent to client with details
```

---

## Error Handling & Logging

### Logging Levels

**DEBUG:** Slot finding, preference matching
```
DEBUG: Looking for 2 consecutive slots from 10:00 to 12:00
DEBUG: Found single slot: 789
DEBUG: Slot 790 is consecutive to 789
```

**INFO:** Successful operations
```
INFO: Successfully locked 2 time slots atomically: [789, 790]
INFO: Created Booking 456 in transaction
INFO: Booking 456 approved successfully. Transaction will be committed.
```

**WARNING:** Low scores, manual review needed
```
WARNING: Low W_C score detected for BookingRequest 123: Score=-30
Manual review recommended. Breakdown: {date_match: 10, avoid_time_penalty: -50}
```

**ERROR:** Transaction failures, conflicts
```
ERROR: ATOMIC OPERATION FAILED: Expected to update 2 slots, but only updated 1.
Rolling back transaction. Slot IDs: [789, 790]
Traceback (most recent call last):
  ...
sqlalchemy.exc.IntegrityError: Concurrency conflict
```

### Error Scenarios

#### 1. Concurrency Conflict
```
Situation: Two clients try to book overlapping slots

Result:
- First booking succeeds: COMMIT
- Second booking fails: ROLLBACK
- No partial bookings created
- Slots remain consistent

Client B sees: "Time slots are no longer available - another booking 
               may have been made simultaneously"
```

#### 2. Low W_C Score
```
Situation: Client preferences don't match well

Result:
- Slots still returned
- Flagged with requires_manual_review: true
- Logged as WARNING
- Trainer can still approve manually

System shows: "⚠️ Low preference match - manual review recommended"
```

#### 3. No Consecutive Slots
```
Situation: Client wants 120 min, but only 60-min gaps available

Result:
- System returns empty list
- Logged as INFO
- Suggests shorter sessions or different date

Client sees: "No available time slots found matching your duration"
```

---

## Key Design Patterns

### 1. Context Manager for Transactions
```python
with atomic_booking():
    # All database operations here
    # Automatic commit on success
    # Automatic rollback on exception
```

### 2. Two-Phase Locking
```python
# Phase 1: Lock
locked = acquire_locks(slots)

# Phase 2: Update
if locked:
    update_all_or_rollback(slots)
```

### 3. Optimistic Concurrency Control
```python
# Re-check availability before final update
updated = db.query(TimeSlot).filter(
    TimeSlot.is_booked == False  # Double-check
).update(...)
```

### 4. Idempotent Operations
```python
# Safe to retry
if booking_request.status == PENDING:
    approve()  # Only processes once
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/booking-requests/` | POST | Create new booking request |
| `/booking-requests/` | GET | List requests (filtered by status) |
| `/booking-requests/{id}` | GET | Get specific request details |
| `/booking-requests/{id}/approve` | PUT | Approve/reject request |
| `/booking-requests/{id}/scored-slots` | GET | Get W_C scored slots |
| `/bookings/` | GET | List confirmed bookings |
| `/bookings/{id}` | GET | Get booking details |
| `/bookings/{id}/cancel` | POST | Cancel booking |
| `/bookings/{id}/reschedule` | POST | Reschedule booking |
| `/time-slots/bulk-create` | POST | Create multiple slots |
| `/time-slots/trainer/{id}/available` | GET | Get available slots |

---

## Summary for AI Understanding

This booking system is production-ready with:

1. **Dual booking methods** for flexibility (direct + preference-based)
2. **W_C scoring algorithm** that ranks slots by preference match (0-100+ points)
3. **Atomic multi-slot operations** using database transactions
4. **Concurrency control** via temporary locks and verification
5. **Comprehensive error handling** with detailed logging
6. **Automatic rollback** on any failure to maintain data integrity
7. **Real-time availability** management
8. **Email notifications** at key stages
9. **Manual review flags** for edge cases
10. **Full audit trail** through logging

The system guarantees that multi-slot bookings are handled atomically - either all slots are booked together, or none are booked and the transaction rolls back completely. This prevents partial bookings and maintains database consistency even under high concurrent load.

