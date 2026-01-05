@echo off

echo Installing (Savindu Parts(Rasa))...
start cmd /c "py -m venv venv && venv\Scripts\activate & pip install --upgrade pip & pip install flask flask-cors rasa==3.6.20"

echo ===============================
echo Installed successfully
echo ===============================