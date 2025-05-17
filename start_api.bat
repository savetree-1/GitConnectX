@echo off
echo Starting GitConnectX API...

:: Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH. Please install Python 3.9+.
    pause
    exit /b 1
)

:: Check if venv exists, if not create it
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Install dependencies if needed
if not exist venv\Lib\site-packages\flask (
    echo Installing dependencies...
    pip install -r requirements.txt
)

:: Start the API server
echo Starting the API server...
python run_app.py

:: Deactivate virtual environment when done
deactivate
