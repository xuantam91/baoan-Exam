
Mảnh ghép 1: Prompt tạo App Offline Bóc tách Đề (Chạy bằng Python)
Bạn là chuyên gia lập trình Python, Streamlit và Google Gemini AI.
Nhiệm vụ của bạn là viết một ứng dụng Desktop nội bộ (Local Web App) dùng Streamlit để giúp tôi tự động hóa việc bóc tách câu hỏi từ file đề thi và đẩy lên database Supabase.

### 1. CÔNG NGHỆ VÀ THƯ VIỆN
- Ngôn ngữ: Python 3.10+
- Giao diện: Streamlit
- AI: Thư viện `google-genai` (sử dụng model `gemini-1.5-pro` hoặc `gemini-1.5-flash`). Hỗ trợ upload file PDF/Ảnh.
- Database: `supabase-py`

### 2. CẤU TRÚC DATABASE (SUPABASE) SẼ TƯƠNG TÁC
Bạn cần kết nối đến Supabase và tương tác với các bảng sau:
- `subjects`: id, name
- `classes`: id, name, grade
- `questions`: id, subject_id, grade, content, options (jsonb), correct_answer, explanation, difficulty.

### 3. LUỒNG HOẠT ĐỘNG CỦA ỨNG DỤNG (UI/UX)
1. **Sidebar:** 
   - Form nhập API Key (Gemini API, Supabase URL, Supabase Key) hoặc load từ file `.env`.
   - Nút "Tải dữ liệu danh mục": Lấy danh sách Môn học (từ `subjects`) và Lớp (từ `classes`) để đưa vào các Dropdown list chọn cấu hình.
2. **Khu vực Xử lý (Main Area):**
   - Chọn Lớp (Grade) và Môn học (Subject) cho file chuẩn bị tải lên.
   - Cho phép upload file PDF hoặc Ảnh chụp.
   - Nút "Bóc tách AI": Khi bấm, gửi file lên Gemini kèm System Prompt ép kiểu trả về JSON Array (gồm: content, options (A/B/C/D), correct_answer, explanation, difficulty). Chú ý yêu cầu AI giữ nguyên mã LaTeX cho các công thức.
3. **Khu vực Kiểm duyệt (Human-in-the-loop):**
   - Đọc JSON trả về và hiển thị thành các form chỉnh sửa trực tiếp trên giao diện Streamlit (dùng st.text_area cho nội dung, st.selectbox cho đáp án).
4. **Đồng bộ Database:**
   - Nút "Đẩy lên Hệ thống": Duyệt qua danh sách câu hỏi đã được sửa chữa, dùng Supabase client thực hiện Insert vào bảng `questions` kèm `subject_id` và `grade` tương ứng.

Hãy cung cấp cho tôi: File `requirements.txt` và mã nguồn chi tiết cho `app.py`.

Mảnh ghép 2: Prompt tạo Web App Online (Deploy lên Vercel)
Bạn là một chuyên gia Full-stack Developer (Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase).
Nhiệm vụ của bạn là xây dựng nền tảng Web Thi Trắc Nghiệm Trực Tuyến dành cho giáo viên và học sinh, ĐƯỢC THIẾT KẾ ĐỂ DEPLOY LÊN VERCEL.
(Lưu ý: Không code tính năng dùng AI bóc tách đề vì đã có app nội bộ đảm nhiệm).

### 1. CẤU TRÚC DATABASE BẮT BUỘC (DÙNG SUPABASE)
Bạn cần tạo các model/type và viết Server Actions tương tác với các bảng sau:
1. `subjects`: id, name (VD: Toán, Lý, Hóa), description.
2. `classes`: id, name (VD: 10A1, 11B), grade.
3. `students`: id, name, email, phone, class_id (Foreign Key -> classes.id).
4. `questions`: id, subject_id, grade, content, options (jsonb), correct_answer, explanation, difficulty.
5. `exams`: id (uuid), title, subject_id, class_id (nullable nếu là đề thi chung), duration_minutes, question_ids (mảng id câu hỏi lấy từ bảng questions), created_at.
6. `submissions`: id, exam_id, student_id, answers (jsonb - đáp án học sinh chọn), score, correct_count, submitted_at.

### 2. TÍNH NĂNG DÀNH CHO GIÁO VIÊN (ADMIN DASHBOARD)
Xây dựng giao diện quản trị có Sidebar điều hướng:
- **Quản lý Cấu hình:** 
  - CRUD (Thêm/Sửa/Xóa) danh sách Môn học và Lớp học.
  - Quản lý Học sinh: Thêm học sinh vào từng Lớp (hỗ trợ nhập form tay, lý tưởng nhất là có tính năng import file CSV/Excel).
- **Quản lý Đề thi:**
  - Khởi tạo đề mới: Giáo viên nhập Tên bài thi, chọn Lớp, chọn Môn, nhập Số lượng câu hỏi và Thời gian làm bài. Server tự động query random N câu hỏi từ bảng `questions` theo đúng môn/lớp và lưu thành 1 bản ghi vào `exams`.
  - Phân phối đề: Mỗi đề thi có 1 URL tĩnh (VD: `/exam/[exam_id]`) kèm nút "Copy Link" để dán qua Zalo.
  - Gửi Email tự động: Nút "Gửi đề cho lớp" -> Hệ thống truy xuất danh sách email học sinh trong Lớp đó và dùng API Email (Nodemailer hoặc Resend) gửi hàng loạt link làm bài.
- **Thống kê điểm:** Giao diện xem danh sách học sinh đã nộp bài, điểm số, và xem chi tiết câu đúng/sai của từng bài nộp.

### 3. TÍNH NĂNG DÀNH CHO HỌC SINH (GIAO DIỆN LÀM BÀI - MOBILE FRIENDLY)
- **Trang thi `/exam/[exam_id]`:**
  - Cổng xác thực: Học sinh chỉ cần nhập Email hoặc Số điện thoại. Hệ thống kiểm tra trong bảng `students`, nếu khớp thì cho phép vào thi và hiển thị "Xin chào [Tên học sinh]".
  - Giao diện làm bài: Có đồng hồ đếm ngược (Countdown Timer). Hiển thị các câu hỏi dạng Radio button. BẮT BUỘC dùng thư viện `react-katex` để render các công thức Toán học.
  - Xử lý nộp bài: Tự động submit khi hết giờ hoặc bấm nộp. 
- **Chấm điểm (Server-side logic):**
  - Tính số câu đúng, tính điểm (thang 10), lưu kết quả vào `submissions`.
  - Ngay lập tức gọi API gửi email báo điểm chi tiết (Điểm, số câu đúng/sai) về email của học sinh đó.

### 4. TỐI ƯU HÓA DEPLOY LÊN VERCEL
1. Tạo file `.env.example` liệt kê đầy đủ các biến môi trường (Supabase keys, Email SMTP/API keys).
2. Tối ưu Server Actions để xử lý logic nhanh gọn, tránh lỗi timeout của Vercel.
3. Viết một file `README.md` ngắn gọn hướng dẫn 3 bước deploy source code này lên Vercel.

Hãy cung cấp cấu trúc thư mục và mã nguồn chi tiết cho các trang (Pages) và các Server Actions.
