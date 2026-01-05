@echo off

echo Installing(Frontend)...
start cmd /c "cd frontend && npm install"

echo Installing(Backend)...
start cmd /c "cd backend && npm i -g nodemon && npm install"

echo Installing (Savindu Parts(Rasa))...
start cmd /k "cd rasa && py -m venv venv && venv\Scripts\activate & pip install --upgrade pip && pip install flask flask-cors rasa==3.6.20"

echo ===============================
echo Installed successfully
echo ===============================