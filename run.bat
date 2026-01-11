@echo off

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Starting Backend...
start cmd /k "cd backend && nodemon"

echo ===============================
echo Backend and Frontend servers are running.
echo ===============================