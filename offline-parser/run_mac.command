#!/bin/bash

# Move to the script's directory
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "      KHỞI ĐỘNG HỆ THỐNG TẠO ĐỀ THI OFFLINE BAOAN"
echo "=========================================================="
echo ""

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Không tìm thấy Python 3 trên hệ thống!"
    echo "Vui lòng tải và cài đặt Python từ: https://www.python.org/downloads/"
    echo ""
    read -p "Nhấn Enter để thoát..."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "[1/3] Đang tạo môi trường ảo Python (.venv)..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Không thể khởi tạo .venv! Thử cài đặt python3-venv nếu dùng Linux."
        read -p "Nhấn Enter để thoát..."
        exit 1
    fi
fi

# Activate virtual environment
echo "[2/3] Đang kích hoạt môi trường ảo (.venv)..."
source .venv/bin/activate

# Install/Upgrade dependencies
echo "[3/3] Đang kiểm tra và tự động cài đặt các thư viện..."
python3 -m pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[WARNING] Có lỗi xảy ra khi cài đặt thư viện. Đang thử lại..."
    pip install -r requirements.txt
fi

# Launch Streamlit app
echo ""
echo "=========================================================="
echo "[THÀNH CÔNG] Đang khởi chạy ứng dụng trên trình duyệt..."
echo "=========================================================="
streamlit run app.py
