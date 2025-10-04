@echo off
echo Starting FitConnect Backend Server...
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting the server...
python -m app.main

pause


