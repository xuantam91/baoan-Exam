#!/bin/bash

# Move to the script's directory
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "   ỨNG DỤNG BÓC TÁCH ĐỀ THI OFFLINE BAOAN ĐANG KHỞI ĐỘNG"
echo "=========================================================="
echo ""
echo ">>> Vui lòng GIỮ NGUYÊN cửa sổ này và ĐỢI"
echo "    cho đến khi trang web tự động mở ra trên trình duyệt."
echo "----------------------------------------------------------"
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
        echo "[ERROR] Không thể khởi tạo .venv!"
        read -p "Nhấn Enter để thoát..."
        exit 1
    fi
else
    echo "[1/3] Đã kiểm tra môi trường ảo Python (.venv)."
fi

# Activate virtual environment
source .venv/bin/activate

# Install/Upgrade dependencies
echo "[2/3] Đang kiểm tra và tự động cập nhật các thư viện phụ thuộc..."
pip install -r requirements.txt

# Launch Streamlit app
echo "[3/3] Đang kết nối AI & Khởi chạy máy chủ..."
echo ""
echo "=========================================================="
echo "[THÀNH CÔNG] Đang mở trình duyệt của bạn..."
echo "=========================================================="
streamlit run app.py
