@echo off

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Starting Backend...
start cmd /k "cd backend && nodemon"

echo Starting Rasa AI backend...
start cmd /k "cd rasa && venv\Scripts\activate && cd backend && flask --app main.py --debug run"

echo ===============================
echo All services started
echo ===============================