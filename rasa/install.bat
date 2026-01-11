@echo off

echo Installing (Savindu Parts(Rasa))...

call py -m venv venv
call venv\Scripts\activate
call pip install --upgrade pip
call pip install flask flask-cors rasa==3.6.20

echo ===============================
echo Installed successfully
echo ===============================

pause