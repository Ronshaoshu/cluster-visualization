@echo off
REM Kubernetes Cluster Visualization - Start Script (Windows)
REM This script starts both backend and frontend servers

echo Starting Kubernetes Cluster Visualization Tool...
echo ==================================================

REM Check if kubectl is configured
where kubectl >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: kubectl is not installed or not in PATH
    exit /b 1
)

echo Checking kubectl connection...
kubectl cluster-info >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: kubectl is not configured or cannot connect to cluster
    echo Please configure kubectl first
    exit /b 1
)

echo Kubectl is configured correctly
echo.

REM Start backend
echo Starting Python backend...
cd backend

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate
pip install -q -r requirements.txt

start /B python api.py
echo Backend started

cd ..
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend...
cd frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

start /B npm run dev
echo Frontend started

cd ..

echo.
echo ==================================================
echo Cluster Visualization is running!
echo Backend API: http://localhost:5000
echo Frontend UI: http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo ==================================================

pause
