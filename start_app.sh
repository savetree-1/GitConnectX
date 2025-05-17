#!/bin/bash

echo "Starting GitConnectX Application..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed. Please install Python 3.9+."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 14+."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
fi

# Function to start the API
start_api() {
    echo "[INFO] Starting API server..."
    source venv/bin/activate
    python3 run_app.py
}

# Function to start the frontend
start_frontend() {
    echo "[INFO] Starting frontend..."
    cd frontend
    npm run dev
}

# Start API in background
start_api &
API_PID=$!

# Wait for the API to start
echo "[INFO] Waiting for API to initialize..."
sleep 5

# Start frontend in background
start_frontend &
FRONTEND_PID=$!

# Success message
echo "[SUCCESS] GitConnectX application is starting!"
echo "- API should be running at: http://localhost:5000"
echo "- Frontend should be available at: http://localhost:3000"
echo
echo "[INFO] Press Ctrl+C to stop both servers."

# Wait for user to interrupt
trap "kill $API_PID $FRONTEND_PID; exit" INT
wait 