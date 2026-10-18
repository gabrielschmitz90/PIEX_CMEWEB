@echo off
cd /d "%~dp0"
python -m pip install -q -r requirements.txt
python database.py
echo.
echo API em http://127.0.0.1:8000  (documentacao em /docs)
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause