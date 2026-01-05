@echo off

echo Installing(Frontend)...
start cmd /c "cd frontend && npm install"

echo Installing(Backend)...
start cmd /c "cd backend && npm i -g nodemon && npm install"

echo ===============================
echo Installed successfully
echo ===============================