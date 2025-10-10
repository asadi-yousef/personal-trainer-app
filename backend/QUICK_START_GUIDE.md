# Quick Start Guide: W_C Scoring & Atomic Booking

## Overview

This project now includes:
1. **W_C Scoring System** - Ranks time slots by client preference match
2. **Atomic Multi-Slot Booking** - Ensures data integrity for multi-hour sessions

---

## Quick Usage

### 1. Get Scored Time Slots (API)

```bash
# Get top 5 slots ranked by W_C score
curl -X GET "http://localhost:8000/booking-requests/123/scored-slots?max_results=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "scored_slots": [
    {
      "total_score": 95,
      "breakdown": {
        "date_match": 50,
        "time_of_day_match": 40,
        "avoid_time_penalty": 0,
        "weekend_evening_bonus": 5
      },
      "slot_id": 456
    }
  ]
}
```

### 2. Use Scoring in Python

```python
from app.services.scoring_service import ScoringService

# Score a single slot
score = ScoringService.calculate_client_match_score(
    booking_request=request,
    time_slot=slot
)

print(f"Score: {score['total_score']}")
print(f"Details: {score['breakdown']}")
```

### 3. Book with Atomic Operations

```python
from app.services.booking_service import BookingService

service = BookingService(db)

# This automatically handles multi-slot bookings atomically
result = service.approve_booking_request(
    booking_request_id=123,
    trainer_id=456,
    notes="Approved"
)

# If ANY slot is unavailable, the ENTIRE transaction rolls back
```

---

## W_C Score Components

| Component | Points | When Applied |
|-----------|--------|-------------|
| Date Match | 0-50 | Closer to preferred date = higher |
| Time Match | 40 | Slot in preferred time blocks |
| Avoid Penalty | -50 | Slot overlaps avoid times |
| Weekend Bonus | +5 | Weekend slot & client allows |
| Evening Bonus | +5 | Evening slot & client allows |

---

## Multi-Slot Booking Example

**Scenario:** Client wants 90-minute session

```python
# System automatically:
1. Finds 2 consecutive 60-min slots (Slot A: 10-11, Slot B: 11-12)
2. Locks BOTH slots temporarily
3. Creates booking record
4. Updates BOTH slots atomically:
   - If both succeed: COMMIT
   - If one fails: ROLLBACK everything
```

**Guarantees:**
- ✅ Never creates partial bookings
- ✅ Automatic rollback on conflicts
- ✅ Maintains database consistency

---

## Testing

```bash
cd backend
python test_atomic_booking_scoring.py
```

**Tests:**
1. W_C scoring with various preferences
2. Single-slot bookings
3. Multi-slot bookings (90min, 120min)
4. Concurrency conflict handling
5. Rollback verification

---

## Error Handling

### Low Scores (Manual Review)

Slots with score < 0 are flagged:

```python
{
  "total_score": -30,
  "requires_manual_review": true
}
```

### Concurrency Conflicts

```python
# Automatically logged and handled
"ATOMIC OPERATION FAILED: Expected 2 slots, updated 1"
# Transaction automatically rolled back
```

---

## Key Files

1. `app/services/scoring_service.py` - Scoring logic
2. `app/services/booking_service.py` - Atomic operations
3. `app/routers/booking_requests.py` - API endpoints
4. `test_atomic_booking_scoring.py` - Test suite
5. `ATOMIC_BOOKING_SCORING_IMPLEMENTATION.md` - Full docs

---

## Common Scenarios

### Scenario 1: Client Prefers Mornings, Avoids Early

```python
BookingRequest(
    preferred_times=["10:00-12:00"],  # Morning preference
    avoid_times=["09:00-09:30"],      # Too early
    allow_weekends=True,
    allow_evenings=False
)

# Result:
# - 10:00-11:00 slot: +90 points (date=50, time=40)
# - 09:00-10:00 slot: -30 points (date=20, avoid=-50)
```

### Scenario 2: 120-Minute Session

```python
BookingRequest(
    duration_minutes=120  # Requires 2 consecutive 60-min slots
)

# Atomic booking:
# 1. Find: [slot_10-11, slot_11-12]
# 2. Lock both
# 3. Create booking
# 4. Update both OR rollback all
```

### Scenario 3: Concurrency Test

```python
# Two clients want same 90-min slot simultaneously
Client A requests: 10:00-11:30
Client B requests: 10:30-12:00

# Both need slot 11:00-12:00

# Result:
# - First to acquire lock: SUCCESS
# - Second attempt: ROLLBACK (conflict detected)
# - No partial bookings created
```

---

## Best Practices

1. **Always check `requires_manual_review` flag**
   ```python
   if score['requires_manual_review']:
       notify_admin(booking_request)
   ```

2. **Handle rollback gracefully**
   ```python
   try:
       booking_service.approve_booking_request(...)
   except ValueError as e:
       if "conflict" in str(e).lower():
           return "Time slot no longer available"
   ```

3. **Use scoring before approval**
   ```python
   # Get best slots first
   scored = service.find_best_slots_with_scoring(request, trainer_id)
   best_slot = scored[0]
   
   # Then approve with highest score
   if best_slot['total_score'] >= 50:
       service.approve_booking_request(...)
   ```

---

## Configuration

### Time Buckets (in `scoring_service.py`)

```python
TIME_BUCKETS = {
    'morning': (time(8, 0), time(12, 0)),
    'afternoon': (time(14, 0), time(17, 0)),
    'evening': (time(17, 0), time(21, 0))
}
```

### Score Thresholds

```python
MAX_DATE_SCORE = 50
MAX_TIME_SCORE = 40
MAX_WEEKEND_EVENING_BONUS = 10
AVOID_TIME_PENALTY = -50
MIN_ACCEPTABLE_SCORE = 0  # Below this = manual review
```

### Lock Duration

```python
LOCK_DURATION_MINUTES = 5  # Temporary slot lock
```

---

## Monitoring

### Logs to Watch

```bash
# Low scores requiring review
grep "Low W_C score detected" logs/app.log

# Atomic operation failures
grep "ATOMIC OPERATION FAILED" logs/app.log

# Successful bookings
grep "Booking.*approved successfully" logs/app.log
```

### Database Queries

```sql
-- Check for orphaned locks (should be rare)
SELECT * FROM time_slots 
WHERE locked_until < NOW() AND is_booked = false;

-- Verify atomic bookings (all slots should link)
SELECT booking_id, COUNT(*) as slot_count
FROM time_slots 
WHERE booking_id IS NOT NULL
GROUP BY booking_id
HAVING slot_count != (
    SELECT duration_minutes / 60 
    FROM bookings 
    WHERE id = time_slots.booking_id
);
```

---

## Troubleshooting

### Issue: All scores are negative

**Cause:** Avoid times overlap with most available slots

**Solution:** Review client's avoid_times, may be too restrictive

### Issue: Transaction rollbacks frequently

**Cause:** High concurrency, multiple clients booking same slots

**Solution:** This is expected behavior - system is working correctly

### Issue: No slots returned

**Cause:** No consecutive slots available for multi-slot booking

**Solution:** Trainer needs to create more time slots or use shorter sessions

---

For detailed documentation, see `ATOMIC_BOOKING_SCORING_IMPLEMENTATION.md`

