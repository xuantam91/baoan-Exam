import os
import shutil
import subprocess
from PIL import Image, ImageDraw

def create_icon_image():
    # Create a high-res 1024x1024 base image for the macOS app icon
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Rounded Rect with Gradient-like color
    # Mac icons usually have a padding
    padding = 80
    box = [padding, padding, size - padding, size - padding]
    
    # Draw rounded rect (indigo-to-violet representation)
    draw.rounded_rectangle(box, radius=180, fill=(99, 102, 241, 255))
    
    # 2. Draw a graduation cap (Education)
    # Rhombus top
    cap_top = [
        (512, 320),  # Top
        (800, 460),  # Right
        (512, 600),  # Bottom
        (224, 460)   # Left
    ]
    draw.polygon(cap_top, fill=(255, 255, 255, 255))
    
    # Cap body
    body_poly = [
        (350, 520),
        (350, 620),
        (512, 680),
        (674, 620),
        (674, 520),
        (512, 600)
    ]
    draw.polygon(body_poly, fill=(243, 244, 246, 255))
    
    # Gold Tassel
    draw.line([(512, 460), (512, 640), (450, 690)], fill=(245, 158, 11, 255), width=24)
    draw.ellipse([430, 680, 470, 720], fill=(245, 158, 11, 255))

    # 3. Draw a gold AI Star in top right corner
    star_center = (750, 270)
    # Simple 4-point sparkle star
    draw.polygon([
        (star_center[0], star_center[1] - 60),
        (star_center[0] + 18, star_center[1] - 18),
        (star_center[0] + 60, star_center[1]),
        (star_center[0] + 18, star_center[1] + 18),
        (star_center[0], star_center[1] + 60),
        (star_center[0] - 18, star_center[1] + 18),
        (star_center[0] - 60, star_center[1]),
        (star_center[0] - 18, star_center[1] - 18)
    ], fill=(245, 158, 11, 255))

    os.makedirs('icon.iconset', exist_ok=True)
    
    # Save standard macOS icon sizes
    sizes = [
        (16, 'icon_16x16.png'),
        (32, 'icon_16x16@2x.png'), # 32px
        (32, 'icon_32x32.png'),
        (64, 'icon_32x32@2x.png'), # 64px
        (128, 'icon_128x128.png'),
        (256, 'icon_128x128@2x.png'), # 256px
        (256, 'icon_256x256.png'),
        (512, 'icon_256x256@2x.png'), # 512px
        (512, 'icon_512x512.png'),
        (1024, 'icon_512x512@2x.png') # 1024px
    ]
    
    for s, name in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join('icon.iconset', name))
        
    print("Generated iconset successfully.")

def build_app_bundle():
    app_name = "BaoAnExamOffline.app"
    contents_dir = os.path.join(app_name, "Contents")
    macos_dir = os.path.join(contents_dir, "MacOS")
    resources_dir = os.path.join(contents_dir, "Resources")
    app_src_dir = os.path.join(resources_dir, "app")
    
    # Clean previous builds
    if os.path.exists(app_name):
        shutil.rmtree(app_name)
        
    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)
    os.makedirs(app_src_dir, exist_ok=True)
    
    # 1. Compile .icns icon file
    create_icon_image()
    subprocess.run(["iconutil", "-c", "icns", "icon.iconset", "-o", os.path.join(resources_dir, "icon.icns")])
    # Clean temporary iconset folder
    shutil.rmtree("icon.iconset")
    
    # 2. Write Info.plist
    info_plist_content = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>English</string>
    <key>CFBundleExecutable</key>
    <string>BaoAnExamOffline</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>CFBundleIdentifier</key>
    <string>com.baoan.exam.offline</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>BaoAn Exam Offline</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
"""
    with open(os.path.join(contents_dir, "Info.plist"), "w", encoding="utf-8") as f:
        f.write(info_plist_content)
        
    # 3. Create macOS executable launcher script
    # It will activate python env, install reqs, and launch streamlit automatically.
    launcher_content = """#!/bin/bash
# Resolve absolute path to the app resource directory
DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$DIR/../Resources/app"

cd "$APP_DIR"

clear
echo "=========================================================="
echo "      KHỞI ĐỘNG HỆ THỐNG TẠO ĐỀ THI OFFLINE BAOAN"
echo "=========================================================="
echo ""

# Check python3
if ! command -v python3 &> /dev/null; then
    osascript -e 'display dialog "Không tìm thấy Python 3 trên hệ thống! Vui lòng cài đặt Python từ python.org." buttons {"OK"} default button 1 with icon stop'
    exit 1
fi

# Create virtual environment if missing
if [ ! -d ".venv" ]; then
    echo "Đang khởi tạo môi trường ảo Python (.venv)..."
    python3 -m venv .venv
fi

# Activate
source .venv/bin/activate

# Install requirements
echo "Đang kiểm tra và cài đặt các thư viện phụ thuộc..."
pip install -r requirements.txt

# Run Streamlit
echo "Đang khởi chạy ứng dụng offline..."
streamlit run app.py
"""
    launcher_path = os.path.join(macos_dir, "BaoAnExamOffline")
    with open(launcher_path, "w", encoding="utf-8") as f:
        f.write(launcher_content)
        
    # Make launcher executable
    os.chmod(launcher_path, 0o755)
    
    # 4. Copy app files into Resources/app
    files_to_copy = ["app.py", "requirements.txt", ".env", "import_demo.py"]
    for f in files_to_copy:
        if os.path.exists(f):
            shutil.copy(f, app_src_dir)
            
    # Copy subdirectories
    dirs_to_copy = ["temp_images"]
    for d in dirs_to_copy:
        if os.path.exists(d):
            shutil.copytree(d, os.path.join(app_src_dir, d), dirs_exist_ok=True)
            
    print(f"\n[SUCCESS] macOS App Bundle built successfully: {app_name}")
    print("You can double click this app to run it, drag it to Applications, or copy it to other Macs!")

if __name__ == "__main__":
    build_app_bundle()
