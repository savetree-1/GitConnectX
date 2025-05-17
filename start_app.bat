@echo off
echo Starting GitConnectX Application...

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs

:: Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.9+.
    pause
    exit /b 1
)

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 14+.
    pause
    exit /b 1
)

:: Start the API server
echo [INFO] Starting API server...
start cmd /k "title GitConnectX API && color 0B && call venv\Scripts\activate.bat && python run_app.py"

:: Wait for the API to start
echo [INFO] Waiting for API to initialize...
timeout /t 5 /nobreak > nul

:: Start the frontend
echo [INFO] Starting frontend...
start cmd /k "title GitConnectX Frontend && color 0A && cd frontend && npm run dev"

:: Success message
echo [SUCCESS] GitConnectX application is starting!
echo - API should be running at: http://localhost:5000
echo - Frontend should be available at: http://localhost:3000
echo.
echo [INFO] Check the terminal windows for any errors.
echo [INFO] Press any key to close this window...

pause > nul 