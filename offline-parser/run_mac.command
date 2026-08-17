#!/bin/bash

# Check if we are running in AppTranslocation (macOS security sandbox for downloaded files)
DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$DIR" == *"AppTranslocation"* ]]; then
    osascript -e 'display dialog "⚠️ Vui lòng di chuyển thư mục dự án ra ngoài thư mục Downloads (ví dụ: kéo thả vào thư mục Applications hoặc Desktop) trước khi mở, để tránh bị macOS hạn chế quyền ghi tệp!" buttons {"Đã hiểu"} default button 1 with icon caution'
    exit 1
fi

# Move to the script's directory
cd "$DIR"

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

# Self-healing: if .venv exists but streamlit was never installed, clean it up
if [ -d ".venv" ] && [ ! -f ".venv/bin/streamlit" ]; then
    echo "[HỆ THỐNG] Phát hiện môi trường ảo cũ bị lỗi hoặc chưa hoàn tất. Đang dọn dẹp..."
    rm -rf .venv
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

# Upgrade pip and package utilities to avoid compiling from source
echo "[2/3] Đang nâng cấp công cụ cài đặt thư viện (pip, setuptools)..."
python3 -m pip install --upgrade pip setuptools wheel

# Install/Upgrade dependencies
echo "Đang tải và cập nhật các thư viện phụ thuộc (chỉ sử dụng bản đóng gói sẵn)..."
python3 -m pip install -r requirements.txt --only-binary=:all:

# Launch Streamlit app
echo "[3/3] Đang kết nối AI & Khởi chạy máy chủ..."
echo ""
echo "=========================================================="
echo "[THÀNH CÔNG] Đang mở trình duyệt của bạn..."
echo "=========================================================="
streamlit run app.py
