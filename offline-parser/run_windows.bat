@echo off
title BaoAn Exam - Offline Parser
echo ==========================================================
echo       KHOI DONG HE THONG TAO DE THI OFFLINE BAOAN
echo ==========================================================
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
)

:: Activate virtual environment
echo [2/3] Dang kich hoat moi truong ao (.venv)...
call .venv\Scripts\activate

:: Install/Upgrade dependencies
echo [3/3] Dang kiem tra va tu dong cai dat cac thu vien...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Co loi xay ra khi cai dat thu vien. Dang thu lai...
    pip install -r requirements.txt
)

:: Launch Streamlit app
echo.
echo ==========================================================
echo [THANH CONG] Dang khoi chay ung dung tren trinh duyet...
echo ==========================================================
streamlit run app.py

pause
