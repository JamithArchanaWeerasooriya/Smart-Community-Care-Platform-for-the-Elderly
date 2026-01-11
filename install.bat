@echo off

echo Installing(Frontend)...
cd frontend
call npm install

echo Installing(Backend)...
cd ..
cd backend
call npm i -g nodemon
call npm install
cd ..

echo ===============================
echo Installed successfully
echo ===============================

pause