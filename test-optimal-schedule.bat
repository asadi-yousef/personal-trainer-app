@echo off
echo ============================================
echo  Testing Optimal Schedule Generator
echo ============================================
echo.

cd backend

echo Step 1: Running database migration...
alembic upgrade head
echo.

echo Step 2: Creating test data and running optimization...
python test_optimal_schedule.py %1
echo.

echo ============================================
echo  Test Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Open: http://localhost:3000/trainer/optimal-schedule
echo   2. Login as a trainer
echo   3. View the optimized schedule
echo.
pause





