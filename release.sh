#!/bin/bash

# Check if version argument is provided
if [ -z "$1" ]; then
    echo "Lỗi: Vui lòng nhập số phiên bản (Ví dụ: ./release.sh v1.0.0)"
    exit 1
fi

VERSION=$1

echo "=========================================================="
echo "   TIẾN HÀNH PHÁT HÀNH PHIÊN BẢN (RELEASE TAG): $VERSION"
echo "=========================================================="
echo ""

# 1. Check if there are uncommitted changes and commit them
if [ -n "$(git status --porcelain)" ]; then
    echo "[!] Phát hiện các thay đổi chưa được lưu. Tiến hành commit tự động..."
    git add .
    git commit -m "chore: chuẩn bị phát hành phiên bản $VERSION"
fi

# 2. Push latest changes to main branch
echo "[1/3] Đang đồng bộ các commit mới nhất lên nhánh chính (main)..."
git push origin main
if [ $? -ne 0 ]; then
    echo "[ERROR] Không thể đẩy code lên GitHub. Vui lòng kiểm tra lại mạng hoặc tài khoản."
    exit 1
fi

# 3. Create tag locally (overwrite if exists)
echo "[2/3] Đang gắn nhãn phiên bản cục bộ ($VERSION)..."
git tag -d "$VERSION" 2>/dev/null
git tag -a "$VERSION" -m "BaoAn Exam Release $VERSION"

# 4. Push tag to GitHub
echo "[3/3] Đang đồng bộ nhãn phiên bản lên GitHub..."
git push origin "$VERSION"
if [ $? -ne 0 ]; then
    echo "[ERROR] Không thể đẩy Tag lên GitHub."
    exit 1
fi

echo ""
echo "=========================================================="
echo "[THÀNH CÔNG] Đã phát hành phiên bản $VERSION lên GitHub!"
echo "Bạn có thể truy cập kho lưu trữ GitHub để xem Nhãn này."
echo "=========================================================="
