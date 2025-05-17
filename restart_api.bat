@echo off
echo Restarting GitConnectX API with new routes...

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Stop any running instances (optional, may need admin rights)
:: taskkill /f /im python.exe /fi "WINDOWTITLE eq GitConnectX API"

:: Clear cache files
echo Clearing Python cache files...
del /s /q *.pyc >nul 2>&1
rmdir /s /q __pycache__ >nul 2>&1
rmdir /s /q api\__pycache__ >nul 2>&1
rmdir /s /q backend\__pycache__ >nul 2>&1
rmdir /s /q backend\api\__pycache__ >nul 2>&1
rmdir /s /q backend\api\routes\__pycache__ >nul 2>&1

echo Cache cleared.

:: Start the API server
echo Starting the API server...
python run_app.py

:: Deactivate virtual environment when done
deactivate 