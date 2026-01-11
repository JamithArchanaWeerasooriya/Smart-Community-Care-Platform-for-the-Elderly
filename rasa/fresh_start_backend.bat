@echo off
echo ================================
echo Training Rasa Model
echo ================================

REM Activate virtual environment
call venv\Scripts\activate

REM Remove old models
if exist backend\models rmdir /s /q backend\models
if exist rasa\models rmdir /s /q rasa\models

REM Train model
cd rasa
rasa train
cd ..

echo ================================
echo Moving trained model to backend
echo ================================

mkdir backend\models
move rasa\models\*.gz backend\models\

echo ================================
echo Renaming model
echo ================================

cd backend\models
ren *.gz model.gz

echo ================================
echo Starting Backend Server
echo ================================

cd ..
cd backend
flask --app main.py --debug run

pause