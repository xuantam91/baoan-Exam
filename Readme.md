# Hệ Thống Quản Lý & Thi Trắc Nghiệm BaoAn Exam

Hệ thống **BaoAn Exam** là giải pháp số hóa giáo dục toàn diện tích hợp Trí tuệ nhân tạo (AI), bao gồm hai cấu phần chính hoạt động độc lập nhưng đồng bộ hóa dữ liệu thông qua cơ sở dữ liệu Supabase:

1. **Web App Online (`online-exam/`)**: Nền tảng học tập trực tuyến dành cho Giáo viên, Học sinh và Quản trị viên (chạy trên Next.js 14 App Router, triển khai trực tiếp lên Vercel).
2. **Offline Parser App (`offline-parser/`)**: Công cụ bóc tách đề thi offline bằng AI chạy trên môi trường local (Streamlit + Gemini AI) giúp giáo viên trích xuất câu hỏi từ file Word/PDF và tải lên ngân hàng câu hỏi.

---

## 📂 Cấu trúc dự án
```text
BaoAn-Exam/
├── online-exam/          # Source code Next.js (Web Online)
│   ├── src/app/          # Pages & Server Actions
│   ├── src/components/   # Logo, LanguagePicker, ThemePicker, ContactBubble...
│   └── .env.local        # File cấu hình môi trường của Web App
├── offline-parser/       # Source code Streamlit (Bóc tách đề Offline)
│   ├── app.py            # Ứng dụng Streamlit chính
│   ├── run_mac.command   # Trình chạy tự động click-to-run dành cho macOS
│   ├── run_windows.bat   # Trình chạy tự động click-to-run dành cho Windows
│   └── .env              # File cấu hình API Key & Database của app offline
└── Readme.md             # Hướng dẫn vận hành này
```

---

## 🛠️ Hướng dẫn vận hành cục bộ (Local Development)

### 1. Cấu phần 1: Web App Online (Next.js)

#### Yêu cầu hệ thống:
* Đã cài đặt **Node.js (phiên bản 18+)** và **npm**.

#### Các bước thiết lập và khởi chạy:
1. Di chuyển vào thư mục dự án Next.js:
   ```bash
   cd online-exam
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env.local` từ file `.env.example` và điền thông số kết nối:
   * `NEXT_PUBLIC_SUPABASE_URL`: Đường dẫn API Supabase.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Mã khóa public anon của Supabase.
   * `SUPABASE_SERVICE_ROLE_KEY`: Mã Service Role kết nối admin Supabase.
   * `RESEND_API_KEY`: API gửi mail tự động từ Resend (hoặc cấu hình SMTP Mailer).
   * `GEMINI_API_KEY`: API Key của Google Gemini AI để hỗ trợ chấm tự luận.
4. Chạy server phát triển (Local Development Server):
   ```bash
   npm run dev
   ```
   * Mở trình duyệt truy cập: `http://localhost:3000`

---

### 2. Cấu phần 2: Mảnh ghép bóc tách đề thi Offline (Streamlit)

#### Yêu cầu hệ thống:
* Đã cài đặt **Python 3.10 trở lên** trên máy.

#### Cách chạy thông thường:
1. Di chuyển vào thư mục:
   ```bash
   cd offline-parser
   ```
2. Tạo môi trường ảo và cài đặt thư viện:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # Trên Windows dùng: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Tạo file cấu hình `.env` chứa API Key của Gemini và Supabase.
4. Khởi chạy ứng dụng:
   ```bash
   streamlit run app.py
   ```
   * Mở trình duyệt truy cập: `http://localhost:8501`

---

## 📦 Đóng gói & Phân phối App Offline cho Mac & Windows (Portable Pack)

Để chia sẻ công cụ bóc tách đề offline sang máy tính của giáo viên khác **mà không yêu cầu họ phải biết lập trình hay tự gõ lệnh**, thư mục `offline-parser` đã được tích hợp sẵn các trình chạy tự động 1-click (Portable Runners):

### 🖥️ Hướng dẫn cho người dùng Windows:
1. Copy toàn bộ thư mục `offline-parser` (bao gồm code, `.env`, và file `run_windows.bat`) sang máy Windows cần sử dụng.
2. Đảm bảo máy tính đó đã cài đặt Python.
3. Kích đúp chuột (Double click) vào file **`run_windows.bat`**.
4. Script sẽ tự động:
   * Khởi tạo môi trường ảo Python cô lập `.venv` cục bộ bên trong thư mục.
   * Cài đặt tự động các thư viện trong `requirements.txt` vào môi trường ảo.
   * Khởi chạy server và tự động mở giao diện bóc tách đề thi trên trình duyệt.

### 🍎 Hướng dẫn cho người dùng macOS:
1. Copy toàn bộ thư mục `offline-parser` sang máy Mac cần sử dụng.
2. Kích đúp chuột (Double click) vào file **`run_mac.command`**.
3. Script sẽ tự động thiết lập môi trường ảo, cài đặt thư viện và khởi chạy Streamlit lên trình duyệt Safari/Chrome.
*(Lưu ý: Nếu macOS báo lỗi bảo mật không chạy được file .command, mở Terminal gõ `chmod +x run_mac.command` là có thể kích đúp chạy bình thường).*

---

## 🚀 Quy trình đồng bộ Git & Deploy lên Vercel

### 1. Đồng bộ mã nguồn lên GitHub
Khi bạn thực hiện thay đổi và muốn đẩy mã nguồn lên GitHub, sử dụng các lệnh chuẩn sau:
```bash
# Xem trạng thái thay đổi
git status

# Thêm tất cả thay đổi vào hàng đợi commit
git add .

# Ghi nhận thay đổi kèm mô tả
git commit -m "feat: mô tả chi tiết các cập nhật mới"

# Đẩy code lên nhánh chính
git push origin main
```

### 2. Triển khai Vercel tự động (Auto-Deployment)
* Dự án Next.js (`online-exam`) đã được liên kết với nền tảng Vercel.
* **Mỗi khi bạn đẩy mã nguồn lên GitHub bằng lệnh `git push origin main`, Vercel sẽ tự động phát hiện, tải mã nguồn mới và tiến hành biên dịch (build), triển khai (deploy) lại trang web trong vòng 1-2 phút.**
* Bạn không cần thực hiện thêm bất cứ thao tác deploy thủ công nào trên Vercel. Chỉ cần kiểm tra trạng thái Build thành công trên trang quản trị Vercel Dashboard của bạn.
* Đảm bảo đã khai báo đầy đủ các biến môi trường tại mục **Settings -> Environment Variables** trên trang quản trị Vercel trùng khớp với các khóa trong file `.env.local`.
