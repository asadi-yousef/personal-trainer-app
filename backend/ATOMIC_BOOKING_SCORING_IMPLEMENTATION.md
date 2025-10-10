# Atomic Multi-Slot Booking & W_C Scoring Implementation

## Overview

This document describes the implementation of the **Robust Client Preference Match (W_C) Score** logic and **Atomic Multi-Slot Booking Operations** with comprehensive error handling and data integrity guarantees.

## Table of Contents

1. [W_C Scoring System](#wc-scoring-system)
2. [Atomic Multi-Slot Booking](#atomic-multi-slot-booking)
3. [Database Models](#database-models)
4. [API Endpoints](#api-endpoints)
5. [Testing](#testing)
6. [Error Handling](#error-handling)

---

## W_C Scoring System

### Overview

The W_C (Client Match) score is a robust algorithm that ranks available time slots based on how well they match a client's preferences. The score ranges from negative values (poor match) to 100+ (excellent match).

### Score Components

| Component | Max Points | Description |
|-----------|-----------|-------------|
| **Date Match** | 50 | Proximity to preferred start date within date range |
| **Time of Day Match** | 40 | Alignment with preferred time blocks |
| **Avoid Time Penalty** | -50 | Penalty for overlapping with avoid times |
| **Weekend/Evening Bonus** | 10 | Bonus for weekend/evening if client allows |
| **Total Possible** | 100 | Perfect match score |

### Scoring Logic

#### 1. Date Match Score (Max 50 points)

```python
if slot_date not in [preferred_start_date, preferred_end_date]:
    return 0

days_from_start = (slot_date - preferred_start_date).days
total_range_days = (preferred_end_date - preferred_start_date).days

score = MAX_DATE_SCORE * (1 - days_from_start / total_range_days)
```

**Example:**
- Preferred range: Jan 1 - Jan 10 (10 days)
- Slot on Jan 1: `50 * (1 - 0/10) = 50 points`
- Slot on Jan 5: `50 * (1 - 4/10) = 30 points`
- Slot on Jan 10: `50 * (1 - 9/10) = 5 points`

#### 2. Time of Day Match Score (Max 40 points or -50 penalty)

```python
if slot overlaps with avoid_times:
    return 0, -50  # Apply penalty

if slot overlaps with preferred_times:
    return 40, 0   # Full points

return 20, 0       # Neutral if no preference specified
```

**Time Block Format:**
- Single time: `"10:00"` (exact time)
- Time range: `"10:00-12:00"` (block)
- Array: `["09:00-12:00", "14:00-17:00"]`

**Example:**
- Preferred times: `["10:00-12:00"]`
- Avoid times: `["09:00-09:30"]`
- Slot 10:00-11:00: +40 points (matches preferred)
- Slot 09:00-10:00: -50 points (overlaps avoid)
- Slot 14:00-15:00: +20 points (neutral)

#### 3. Weekend/Evening Bonus (Max 10 points)

```python
bonus = 0

if allow_weekends and slot.weekday() >= 5:  # Saturday=5, Sunday=6
    bonus += 5

if allow_evenings and 17:00 <= slot.time() < 21:00:
    bonus += 5

return bonus
```

### Manual Review Threshold

Slots with `W_C score < 0` are flagged for manual review:

```python
requires_manual_review = total_score < MIN_ACCEPTABLE_SCORE  # 0
```

This triggers logging:
```
WARNING: Low W_C score detected for BookingRequest 123 and TimeSlot 456: Score=-30. 
Manual review recommended. Breakdown: {date_match: 10, time_of_day_match: 0, 
avoid_time_penalty: -50, weekend_evening_bonus: 10}
```

### Usage Example

```python
from app.services.scoring_service import ScoringService

# Score a single slot
score_result = ScoringService.calculate_client_match_score(
    booking_request=request,
    time_slot=slot,
    additional_slots=None  # For multi-slot bookings
)

print(f"Total Score: {score_result['total_score']}")
print(f"Breakdown: {score_result['breakdown']}")
print(f"Requires Review: {score_result['requires_manual_review']}")

# Rank all available slots
scored_slots = ScoringService.rank_time_slots(
    booking_request=request,
    available_slots=slots,
    duration_minutes=90
)

best_slot = scored_slots[0]  # Highest scoring slot
```

---

## Atomic Multi-Slot Booking

### Problem Statement

When a client requests a session longer than 60 minutes (e.g., 90 or 120 minutes), multiple consecutive time slots must be booked together. This creates a **concurrency risk**:

**Scenario:**
1. Client A requests 10:00-12:00 (2 slots: 10-11, 11-12)
2. Client B requests 11:00-13:00 (2 slots: 11-12, 12-13)
3. Both processes start simultaneously
4. **Without atomic operations:** Both might book slot 11-12, creating data corruption

### Solution: Atomic Transaction

The implementation uses database transactions to ensure **all-or-nothing** booking:

```python
with self.atomic_booking():  # BEGIN TRANSACTION
    
    # Step 1: Create Booking record
    booking = Booking(...)
    db.add(booking)
    db.flush()  # Get ID but don't commit
    
    # Step 2 & 3: Update ALL slots atomically
    updated_count = db.query(TimeSlot).filter(
        TimeSlot.id.in_(slot_ids),
        TimeSlot.is_booked == False  # Double-check availability
    ).update({
        "is_booked": True,
        "booking_id": booking.id
    })
    
    # CRITICAL: Verify ALL slots were updated
    if updated_count != len(slot_ids):
        raise IntegrityError("Concurrency conflict detected")
    
    # If we reach here, commit transaction
    # If exception occurs, automatic ROLLBACK
```

### Transaction Flow

```
START TRANSACTION
    ├─ Lock slot A temporarily (5 min lock)
    ├─ Lock slot B temporarily (5 min lock)
    │
    ├─ Verify both slots still available?
    │   ├─ Yes: Continue
    │   └─ No: ROLLBACK (release all locks)
    │
    ├─ Create Booking record
    ├─ Update slot A: is_booked=True, booking_id=X
    ├─ Update slot B: is_booked=True, booking_id=X
    │
    ├─ Verify updates: expected=2, actual=?
    │   ├─ Match: COMMIT
    │   └─ No match: ROLLBACK
    │
COMMIT/ROLLBACK
```

### Key Features

#### 1. Temporary Locking (5-minute window)

```python
def _atomic_lock_slots(self, slot_ids: List[int]) -> bool:
    lock_until = datetime.now() + timedelta(minutes=5)
    
    locked_count = db.query(TimeSlot).filter(
        TimeSlot.id.in_(slot_ids),
        TimeSlot.is_available == True,
        TimeSlot.is_booked == False,
        or_(
            TimeSlot.locked_until.is_(None),
            TimeSlot.locked_until < datetime.now()
        )
    ).update({"locked_until": lock_until})
    
    # ALL slots must be locked, or fail
    return locked_count == len(slot_ids)
```

#### 2. Atomic Update with Verification

```python
# Update ALL slots in single query
updated_count = db.query(TimeSlot).filter(
    and_(
        TimeSlot.id.in_(slot_ids),
        TimeSlot.is_booked == False,  # Re-check availability
        or_(
            TimeSlot.locked_until.is_(None),
            TimeSlot.locked_until >= datetime.now()  # Our lock
        )
    )
).update({
    "is_booked": True,
    "booking_id": booking.id,
    "locked_until": None
}, synchronize_session=False)

# CRITICAL CHECK
if updated_count != len(slot_ids):
    raise IntegrityError(
        f"Only {updated_count}/{len(slot_ids)} slots available"
    )
```

#### 3. Automatic Rollback on Failure

The context manager handles rollback:

```python
@contextmanager
def atomic_booking(self):
    try:
        yield self.db
        self.db.commit()  # Only if no exception
    except Exception as e:
        self.db.rollback()  # Undo all changes
        logger.error(f"Transaction rolled back: {e}")
        raise
```

### Example Scenario

**Multi-slot booking for 90 minutes:**

```python
# Request: 10:00-11:30 (requires 2 slots)
booking_request = BookingRequest(
    duration_minutes=90,
    start_time=datetime(2024, 1, 15, 10, 0),
    end_time=datetime(2024, 1, 15, 11, 30)
)

# System finds consecutive slots
slot_ids = [
    123,  # 10:00-11:00
    124   # 11:00-12:00 (only using 30 min)
]

# Atomic approval
booking_service.approve_booking_request(
    booking_request_id=request.id,
    trainer_id=trainer.id,
    notes="Approved"
)

# Result:
# - Booking created with ID 456
# - Slot 123: is_booked=True, booking_id=456
# - Slot 124: is_booked=True, booking_id=456
# - Transaction committed atomically
```

---

## Database Models

### BookingRequest Model

```python
class BookingRequest(Base):
    __tablename__ = "booking_requests"
    
    # ... existing fields ...
    
    # Time preferences (JSON arrays)
    preferred_times = Column(Text)  # e.g., ["10:00-12:00", "14:00-16:00"]
    avoid_times = Column(Text)      # e.g., ["09:00-09:30"]
    
    # Specific requested time (for direct booking)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Preferences
    allow_weekends = Column(Boolean, default=True)
    allow_evenings = Column(Boolean, default=True)
```

### TimeSlot Model

```python
class TimeSlot(Base):
    __tablename__ = "time_slots"
    
    id = Column(Integer, primary_key=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    
    # Timing
    date = Column(DateTime(timezone=True))
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer, default=60)
    
    # Availability state
    is_available = Column(Boolean, default=True)
    is_booked = Column(Boolean, default=False)
    
    # Booking reference
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    
    # Concurrency control
    locked_until = Column(DateTime(timezone=True), nullable=True)
```

---

## API Endpoints

### 1. Get Scored Time Slots

**Endpoint:** `GET /booking-requests/{request_id}/scored-slots`

**Description:** Returns time slots ranked by W_C score

**Query Parameters:**
- `max_results` (optional, default=5): Maximum number of results

**Response:**
```json
{
  "request_id": 123,
  "scored_slots": [
    {
      "total_score": 95,
      "breakdown": {
        "date_match": 50,
        "time_of_day_match": 40,
        "avoid_time_penalty": 0,
        "weekend_evening_bonus": 5
      },
      "slot_id": 456,
      "slot_start": "2024-01-15T10:00:00Z",
      "requires_manual_review": false,
      "consecutive_slot_ids": [456, 457]
    }
  ],
  "scoring_info": {
    "max_date_score": 50,
    "max_time_score": 40,
    "max_bonus": 10,
    "avoid_penalty": -50,
    "best_score": 95
  }
}
```

### 2. Approve Booking Request (with Atomic Operations)

**Endpoint:** `PUT /booking-requests/{request_id}/approve`

**Request Body:**
```json
{
  "status": "APPROVED",
  "confirmed_date": "2024-01-15T10:00:00Z",
  "notes": "Looking forward to the session",
  "alternative_dates": []
}
```

**Response:**
```json
{
  "booking_id": 789,
  "booking_request_id": 123,
  "status": "confirmed",
  "message": "Booking approved and confirmed",
  "confirmed_time": "2024-01-15T10:00:00Z",
  "slots_booked": 2
}
```

**Error Response (Concurrency Conflict):**
```json
{
  "detail": "Failed to complete booking due to database conflict: Only 1/2 slots were available for booking. Transaction will be rolled back."
}
```

---

## Testing

### Running the Test Suite

```bash
cd backend
python test_atomic_booking_scoring.py
```

### Test Coverage

1. **W_C Scoring Algorithm**
   - Date proximity calculation
   - Time block matching
   - Avoid time penalties
   - Weekend/evening bonuses
   - Multi-slot combinations

2. **Atomic Multi-Slot Booking**
   - Single slot booking
   - Consecutive slot booking (90 min, 120 min)
   - Successful transactions
   - Failed transactions with rollback

3. **Concurrency Conflict Handling**
   - Two simultaneous requests for same slots
   - First succeeds, second fails gracefully
   - No partial bookings created
   - Database integrity verified

### Expected Output

```
=== Testing W_C Scoring Algorithm ===

Found 56 available slots

Top 5 Slots by W_C Score:
--------------------------------------------------------------------------------

1. Slot ID: 123
   Start Time: 2024-01-15T10:00:00Z
   Total W_C Score: 95
   Breakdown:
     - date_match: 50
     - time_of_day_match: 40
     - avoid_time_penalty: 0
     - weekend_evening_bonus: 5
   Multi-slot booking: [123, 124]

=== Testing Atomic Multi-Slot Booking ===

Attempting to approve booking request with atomic operations...

✓ Booking approved successfully!
  - Booking ID: 789
  - Status: confirmed
  - Confirmed Time: 2024-01-15T10:00:00Z
  - Slots Booked: 2

✓ Verification:
  - Booking exists: True
  - Number of slots booked: 2
  - All slots marked as booked: True
  - All slots linked to booking: True
```

---

## Error Handling

### 1. Transaction Failures

**Logged at ERROR level with full stack trace:**

```python
logger.error(
    f"ATOMIC OPERATION FAILED: Expected to update {len(slot_ids)} slots, "
    f"but only updated {updated_count}. Rolling back transaction. "
    f"Slot IDs: {slot_ids}",
    exc_info=True
)
```

### 2. Low W_C Scores

**Logged at WARNING level for manual review:**

```python
logger.warning(
    f"Low W_C score detected for BookingRequest {booking_request.id} "
    f"and TimeSlot {time_slot.id}: Score={total_score}. "
    f"Manual review recommended. Breakdown: {breakdown}"
)
```

### 3. Concurrency Conflicts

**Logged at ERROR level:**

```python
logger.error(
    f"Failed to atomically lock slots {slot_ids} for BookingRequest {booking_request_id}. "
    f"Possible concurrency conflict.",
    exc_info=True
)
```

### 4. Scoring Errors

**Logged at ERROR level with safe fallback:**

```python
try:
    score_result = ScoringService.calculate_client_match_score(...)
except Exception as e:
    logger.error(
        f"Error calculating W_C score: {str(e)}",
        exc_info=True
    )
    # Return zero score with manual review flag
    return {
        'total_score': 0,
        'requires_manual_review': True,
        'error': str(e)
    }
```

### Log Levels

- **DEBUG**: Slot finding, preference matching details
- **INFO**: Successful operations, slot locks, bookings
- **WARNING**: Low scores, partial lock failures
- **ERROR**: Transaction failures, exceptions

### Example Error Log

```
2024-01-15 10:30:45,123 ERROR [booking_service] ATOMIC OPERATION FAILED: Expected to update 2 slots, but only updated 1. Rolling back transaction. Slot IDs: [123, 124]
Traceback (most recent call last):
  File "app/services/booking_service.py", line 320, in approve_booking_request
    raise IntegrityError(...)
sqlalchemy.exc.IntegrityError: Concurrency conflict: Only 1/2 slots were available for booking

2024-01-15 10:30:45,124 INFO [booking_service] Transaction rolled back successfully
2024-01-15 10:30:45,125 INFO [booking_service] Unlocked 2 time slots
```

---

## Implementation Files

1. **`app/services/scoring_service.py`** - W_C scoring algorithm
2. **`app/services/booking_service.py`** - Atomic booking operations
3. **`app/routers/booking_requests.py`** - API endpoints
4. **`test_atomic_booking_scoring.py`** - Test suite

---

## Summary

This implementation provides:

✅ **Robust W_C Scoring** with comprehensive preference matching  
✅ **Atomic Multi-Slot Booking** with guaranteed data integrity  
✅ **Automatic Rollback** on concurrency conflicts  
✅ **Comprehensive Logging** for debugging and auditing  
✅ **Manual Review Flags** for edge cases  
✅ **Transaction Safety** using SQLAlchemy's context managers  
✅ **Extensive Testing** with real-world scenarios  

The system ensures that multi-slot bookings are handled atomically, preventing partial bookings and maintaining database consistency even under concurrent load.

