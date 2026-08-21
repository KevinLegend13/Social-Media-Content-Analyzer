@echo off
echo ========================================
echo  Social Media Content Analyzer
echo ========================================
echo.

echo Starting backend (port 8000)...
start "Backend" cmd /k "cd /d C:\Users\Admin\Desktop\Social-Media-Content-Analyzer\backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo Starting frontend (port 5173)...
start "Frontend" cmd /k "cd /d C:\Users\Admin\Desktop\Social-Media-Content-Analyzer\frontend && npx vite --host 127.0.0.1 --port 5173"

echo.
echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  OPEN IN BROWSER:
echo  http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
