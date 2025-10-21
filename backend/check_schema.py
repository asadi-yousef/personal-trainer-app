#!/usr/bin/env python3

from app.database import engine
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    
    print('=== booking_requests columns ===')
    for col in inspector.get_columns('booking_requests'):
        print(f'{col["name"]}: {col["type"]}')
    
    print('\n=== bookings columns ===')
    for col in inspector.get_columns('bookings'):
        print(f'{col["name"]}: {col["type"]}')
    
    print('\n=== trainers columns ===')
    for col in inspector.get_columns('trainers'):
        print(f'{col["name"]}: {col["type"]}')

if __name__ == "__main__":
    check_schema()
























