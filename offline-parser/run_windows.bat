@echo off
title BaoAn Exam - Offline Parser
echo ==========================================================
echo    UNG DUNG BOC TACH DE THI OFFLINE BAOAN DANG KHOI DONG
echo ==========================================================
echo.
echo ^>^> Vui long GIU NGUYEN cua so nay va DOI
echo    cho den khi trang web tu dong mo ra tren trinh duyet.
echo ----------------------------------------------------------
echo.

:: Move to the directory of the batch file
cd /d "%~dp0"

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Khong tim thay Python tren he thong!
    echo Vui long tai va cai dat Python tu trang chu: https://www.python.org/downloads/
    echo Luu y: Tich chon vao o "Add Python to PATH" khi cai dat.
    echo.
    pause
    exit /b
)

:: Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo [1/3] Dang tao moi truong ao Python (.venv)...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Khong the khoi tao .venv! Vui long kiem tra lai quyen truy cap.
        pause
        exit /b
      )
) else (
    echo [1/3] Da kiem tra moi truong ao Python (.venv).
)

:: Activate virtual environment
call .venv\Scripts\activate

:: Install/Upgrade dependencies
echo [2/3] Dang kiem tra va tu dong cap nhat cac thu vien phu thuoc...
pip install -r requirements.txt

:: Launch Streamlit app
echo [3/3] Dang ket noi AI ^& Khoi chay may chu...
echo.
echo ==========================================================
echo [THANH CONG] Dang mo trinh duyet cua ban...
echo ==========================================================
streamlit run app.py

pause
