# Hướng dẫn Deploy Web App Thi Trắc Nghiệm Trực Tuyến lên Vercel

Ứng dụng web này được phát triển bằng **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** và **Resend** để gửi email tự động. Hệ thống được tối ưu hóa hoàn toàn để deploy mượt mà lên **Vercel** chỉ trong 3 bước cơ bản.

---

## 3 Bước Deploy Lên Vercel

### Bước 1: Thiết Lập Database Trên Supabase
1. Đăng ký/Đăng nhập tài khoản miễn phí trên [Supabase](https://supabase.com).
2. Tạo một Project mới.
3. Trong trang Dashboard của dự án, truy cập vào menu **SQL Editor** ở thanh sidebar bên trái.
4. Copy toàn bộ nội dung trong file [schema.sql](../schema.sql) ở thư mục gốc của dự án này, dán vào cửa sổ biên tập SQL của Supabase và bấm **Run**. Các bảng, khóa ngoại, chỉ mục và chính sách bảo mật (RLS) sẽ được khởi tạo hoàn tất.

### Bước 2: Đẩy Mã Nguồn Lên GitHub
1. Tạo một repository mới trên tài khoản GitHub cá nhân của bạn.
2. Initialize Git trong thư mục chứa dự án này (nếu chưa thực hiện) và push mã nguồn lên repository vừa tạo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Exam Online App"
   git branch -M main
   git remote add origin <url-repository-cua-ban>
   git push -u origin main
   ```

### Bước 3: Deploy Và Cấu Hình Trên Vercel
1. Truy cập vào [Vercel](https://vercel.com) và kết nối với tài khoản GitHub của bạn.
2. Nhấn nút **Add New** -> **Project** và chọn repository bạn vừa đẩy lên ở Bước 2.
3. Trong phần cấu hình trước khi deploy, hãy mở rộng mục **Environment Variables** và cấu hình đầy đủ các biến môi trường sau (Giá trị lấy từ Supabase Settings -> API và tài khoản Resend.com):
   - `NEXT_PUBLIC_SUPABASE_URL`: Đường dẫn URL dự án Supabase của bạn.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Mã Anon key công khai của Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Mã Service role key bảo mật cao của Supabase (dùng trong Server Actions).
   - `RESEND_API_KEY`: API Key đăng ký miễn phí từ [Resend](https://resend.com) để gửi email báo điểm.
   - `EMAIL_FROM`: Tên và email người gửi (Ví dụ: `Hệ thống Thi trắc nghiệm <onboarding@resend.dev>`).
4. Nhấn nút **Deploy**. Vercel sẽ tự động build và cung cấp cho bạn một domain trực tuyến miễn phí!

---

## Biến môi trường mẫu (.env.local)

Khi phát triển hoặc chạy thử dưới Local, hãy tạo file `.env.local` trong thư mục `online-exam/` với định dạng giống file `.env.example` và điền đầy đủ các khóa kết nối tương tự như trên Vercel.

Chạy ứng dụng ở môi trường local:
```bash
npm run dev
```
Truy cập ứng dụng tại địa chỉ: `http://localhost:3000`
