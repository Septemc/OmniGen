@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==============================
echo   OmniGen Dev Start
echo ==============================
echo.
echo [1/2] Frontend: localhost:3558
echo [2/2] Backend:  localhost:3001
echo.

start "Frontend" cmd /k "cd /d %~dp0 && npm run dev"
start "Backend"  cmd /k "cd /d %~dp0server && set PROMPTS_PASSWORD=b4Hqn2sVt45CBphZLT84 && npx tsx index.ts"

echo All services started. Close this window to stop.
echo.
pause
