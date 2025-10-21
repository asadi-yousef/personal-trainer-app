from app.database import get_db
from app.services.optimal_schedule_service import OptimalScheduleService
from sqlalchemy.orm import Session

def test_optimal_algorithm():
    db: Session = next(get_db())
    service = OptimalScheduleService(db)

    print('=== TESTING OPTIMAL SCHEDULE ALGORITHM ===')
    result = service.generate_optimal_schedule(trainer_id=1)

    print(f'Proposed entries: {len(result["proposed_entries"])}')
    print(f'Rejected requests: {len(result["rejected_requests"])}')
    print(f'Message: {result["message"]}')

    print('\n=== APPROVED REQUESTS ===')
    for entry in result['proposed_entries']:
        print(f'Request {entry["booking_request_id"]}: {entry["start_time"]} - {entry["end_time"]} ({entry["training_type"]})')

    print('\n=== REJECTED REQUESTS ===')
    for entry in result['rejected_requests']:
        print(f'Request {entry["booking_request_id"]}: {entry["start_time"]} - {entry["end_time"]} ({entry["training_type"]}) - {entry.get("reason", "No reason")}')

    print('\n=== STATISTICS ===')
    stats = result['statistics']
    print(f'Total requests: {stats["total_requests"]}')
    print(f'Scheduled requests: {stats["scheduled_requests"]}')
    print(f'Unscheduled requests: {stats["unscheduled_requests"]}')
    print(f'Total hours: {stats["total_hours"]}')
    print(f'Scheduling efficiency: {stats["scheduling_efficiency"]}%')

    db.close()

if __name__ == "__main__":
    test_optimal_algorithm()
