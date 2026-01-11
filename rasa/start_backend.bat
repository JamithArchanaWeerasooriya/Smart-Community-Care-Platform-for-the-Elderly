@echo off

echo Starting Rasa AI backend...
start cmd /k "venv\Scripts\activate && cd backend && flask --app main.py --debug run"

echo ===============================
echo All services started
echo ===============================