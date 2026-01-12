@echo off
echo ============================================
echo TESSOLVE EXECUTIVE PORTAL - SETUP SCRIPT
echo ============================================
echo.

REM Check if PostgreSQL is running
echo Step 1: Checking PostgreSQL connection...
echo.

REM Navigate to backend
cd backend

REM Create virtual environment if not exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Step 2: Installing Python dependencies...
pip install -r requirements.txt

REM Run seed script
echo.
echo Step 3: Setting up database and seeding data...
python scripts/seed_data.py

echo.
echo Step 4: Starting backend server...
echo Backend will run on http://localhost:8000
echo API docs available at http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

start cmd /k "cd /d %CD% && venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

REM Navigate to frontend
cd ..\frontend

echo.
echo Step 5: Installing frontend dependencies...
call npm install

echo.
echo Step 6: Starting frontend server...
echo Frontend will run on http://localhost:3000
echo.

npm run dev
