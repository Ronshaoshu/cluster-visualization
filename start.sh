#!/bin/bash

# Kubernetes Cluster Visualization - Start Script
# This script starts both backend and frontend servers

echo "Starting Kubernetes Cluster Visualization Tool..."
echo "=================================================="

# Check if kubectl is configured
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

echo "Checking kubectl connection..."
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: kubectl is not configured or cannot connect to cluster"
    echo "Please configure kubectl first"
    exit 1
fi

echo "Kubectl is configured correctly"
echo ""

# Start backend in background
echo "Starting Python backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

python api.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "=================================================="
echo "Cluster Visualization is running!"
echo "Backend API: http://localhost:5000"
echo "Frontend UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=================================================="

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
