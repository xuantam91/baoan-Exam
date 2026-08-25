# Phương Án Kỹ Thuật (Tối Ưu): Tích Hợp Tính Năng Tạo Câu Hỏi AI Theo Bộ & Duyệt Theo Lượt Trực Tiếp Trên WebApp Exam

Tài liệu này đề xuất phương án **Tích hợp đồng bộ theo Bộ/Lượt tạo (Batch-Based Flow)** đưa tính năng tự động tạo câu hỏi từ tài liệu bằng AI vào trực tiếp giao diện quản trị của Website **BaoAn Exam**. Giao diện duyệt đề sẽ được gom cụm tập trung theo từng đợt tạo (ví dụ: bộ đề chương 4 lớp 12) giúp giáo viên dễ dàng kiểm duyệt, tránh tình trạng câu hỏi bị xé lẻ, khó tìm kiếm.

---

## 1. Sơ Đồ Lưu Trình Hệ Thống Tối Ưu Theo Bộ (Batch-Based Flowchart)

Mọi câu hỏi tự động sinh ra đều được quản lý theo nhóm (Lượt tạo/Bộ câu hỏi nháp) từ lúc AI tạo ra cho đến khi giáo viên phê duyệt thông qua cơ chế xử lý bất đồng bộ (Asynchronous Flow) kết hợp cập nhật thời gian thực (Realtime Update) để chống timeout:

### 1.1. Sơ Đồ Khối Hệ Thống Tổng Thể (Overall System Flowchart)

```mermaid
flowchart TD
    %% Định nghĩa các lớp màu sắc (Styling classes)
    classDef client fill:#E0F2FE,stroke:#0284C7,stroke-width:1.5px,color:#0369A1;
    classDef server fill:#FFF7ED,stroke:#EA580C,stroke-width:1.5px,color:#9A3412;
    classDef ai fill:#FEE2E2,stroke:#DC2626,stroke-width:1.5px,color:#991B1B;
    classDef db fill:#ECFDF5,stroke:#059669,stroke-width:1.5px,color:#065F46;
    classDef student fill:#F5F3FF,stroke:#7C3AED,stroke-width:1.5px,color:#5B21B6;

    %% Định nghĩa các Node để tránh lỗi cú pháp
    UserM([Giáo Viên / Admin])
    Streamlit["🐍 Streamlit Desktop App"]
    
    UserA([Giáo Viên / Admin])
    WebUI["🖥️ Giao diện Admin Web (Next.js)"]
    NextServer["⚙️ Next.js Server Action"]
    DB_Batch["💾 public.question_batches (status = processing)"]
    BgJob["⚙️ Background Job / Route Handler"]
    GeminiA["🤖 Google Gemini API"]
    DB_Success["💾 public.questions (status = draft) <br/> public.question_batches (status = pending)"]
    DB_Fail["💾 public.question_batches (status = failed)"]
    
    ReviewUI["🖥️ Giao diện Duyệt Chi Tiết"]
    DB_Approve["💾 DB Transaction: <br/> Chuyển status = approved <br/> cho Batch & Questions"]
    DB_Reject["🗑️ DB DELETE: <br/> Xóa Batch (Cascade xóa questions)"]
    
    ExamGen["⚙️ Next.js Sinh đề thi"]
    Student([👥 Học Sinh])

    %% =============================================
    %% LUỒNG 1: TẠO THỦ CÔNG (Streamlit Desktop App)
    %% =============================================
    subgraph FlowManual ["1. LUỒNG TẠO THỦ CÔNG (Streamlit Desktop App)"]
        UserM -->|Upload Đề & Chỉnh sửa trực tiếp| Streamlit
        Streamlit -->|Lưu trực tiếp approved, batch_id = null| DB_Approve
    end

    %% =============================================
    %% LUỒNG 2: TỰ ĐỘNG QUA WEB UI (Next.js + Gemini API)
    %% =============================================
    subgraph FlowWebAI ["2. LUỒNG TẠO TỰ ĐỘNG QUA WEB UI (AI sinh đề nháp)"]
        UserA -->|Upload File / Nhập Prompt & Tiêu đề| WebUI
        WebUI -->|Gọi Action tạo bộ đề| NextServer
        
        NextServer -->|INSERT Batch nhanh| DB_Batch
        DB_Batch -.->|Trả về batch_id ngay lập tức (~100ms)| WebUI
        
        NextServer -->|Kích hoạt xử lý ngầm| BgJob
        BgJob -->|Gửi tệp & Schema| GeminiA
        GeminiA -->|Phản hồi JSON câu hỏi| BgJob
        
        BgJob -->|Thành công| DB_Success
        BgJob -->|Thất bại| DB_Fail
    end
    
    %% =============================================
    %% PHẦN KIỂM DUYỆT TRUNG TÂM THEO BỘ
    %% =============================================
    subgraph CentralDB ["3. CƠ SỞ DỮ LIỆU & KIỂM DUYỆT TRUNG TÂM"]
        DB_Success -.->|Supabase Realtime / Polling| WebUI
        DB_Fail -.->|Supabase Realtime / Polling| WebUI
        
        WebUI -->|Xem & Chỉnh sửa / Xóa câu lỗi| ReviewUI
        
        ReviewUI -->|Click Duyệt Cả Bộ| DB_Approve
        ReviewUI -->|Click Từ Chối Cả Bộ| DB_Reject
    end

    %% =============================================
    %% LUỒNG HỌC SINH LÀM BÀI
    %% =============================================
    subgraph ExamFlow ["4. LUỒNG LÀM BÀI CỦA HỌC SINH"]
        DB_Approve -->|Lọc câu hỏi approved <br/> (Tận dụng Partial Index)| ExamGen
        ExamGen -->|Làm bài trực tuyến| Student
    end

    %% Gán class cho các node để đổi màu sắc
    class UserM,UserA,WebUI,ReviewUI client;
    class Streamlit,NextServer,BgJob,ExamGen server;
    class GeminiA ai;
    class DB_Batch,DB_Success,DB_Fail,DB_Approve,DB_Reject db;
    class Student student;
```

### 1.2. Biểu Đồ Tuần Tự Tương Tác (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    participant Teacher as Giáo Viên (Admin)
    participant Client as Giao diện Web (Client)
    participant NextServer as Next.js Server Action
    participant BgWorker as Background Route Handler (Worker)
    participant DB as Supabase DB
    participant Gemini as Gemini API

    Teacher->>Client: Tải tài liệu & Nhập tiêu đề -> Nhấn "Tạo đề bằng AI"
    Client->>NextServer: Gọi Server Action gửi thông tin bộ đề
    
    NextServer->>DB: Khởi tạo bộ đề (status = 'processing')
    DB-->>NextServer: Trả về batch_id
    
    %% Phản hồi nhanh để tránh Server Action Timeout
    NextServer-->>Client: Trả về batch_id ngay lập tức (~100ms)
    
    Note over Client: Client hiển thị màn hình chờ,<br/>đăng ký Supabase Realtime theo dõi batch_id

    %% Tiến trình gọi AI chạy bất đồng bộ
    NextServer->>BgWorker: Kích hoạt job xử lý tài liệu ngầm (background call)
    deactivate NextServer
    
    activate BgWorker
    BgWorker->>Gemini: Gửi tài liệu & JSON Schema yêu cầu sinh câu hỏi
    activate Gemini
    Note over Gemini: Gemini xử lý tài liệu dài<br/>(Mất từ 15s - 45s)
    Gemini-->>BgWorker: Trả về dữ liệu câu hỏi chuẩn JSON
    deactivate Gemini
    
    alt Xử lý thành công
        BgWorker->>DB: Lưu các câu hỏi nháp (status = 'draft', batch_id)
        BgWorker->>DB: Cập nhật batch (status = 'pending')
        DB-->>Client: [Realtime Event] Trạng thái batch đổi sang 'pending'
        Client->>Teacher: Hiển thị danh sách câu hỏi nháp để kiểm duyệt
    else Gặp lỗi (API error / File không đọc được)
        BgWorker->>DB: Cập nhật batch (status = 'failed', error_message)
        DB-->>Client: [Realtime Event] Trạng thái batch đổi sang 'failed'
        Client->>Teacher: Hiển thị thông báo lỗi chi tiết để xử lý lại
    end
    deactivate BgWorker

    %% Quy trình kiểm duyệt
    Note over Teacher, DB: Quy trình Giáo viên kiểm duyệt bộ đề nháp
    Teacher->>Client: Sửa đổi nội dung câu lỗi & Nhấn "Phê duyệt cả bộ"
    Client->>NextServer: Yêu cầu duyệt bộ đề (batch_id)
    activate NextServer
    NextServer->>DB: Thực thi TRANSACTION (Cập nhật batch & toàn bộ câu hỏi con sang 'approved')
    DB-->>NextServer: Thành công
    NextServer-->>Client: Phản hồi duyệt thành công
    deactivate NextServer
    Client->>Teacher: Cập nhật giao diện (Bộ đề đã đưa vào hoạt động)
```

---

## 2. Phương Án Thiết Kế Cơ Sở Dữ Liệu Tối Ưu (Database Schema Update)

Để gom cụm các câu hỏi theo từng lượt tạo, chúng ta tạo thêm bảng **`question_batches`** có hỗ trợ theo dõi trạng thái lỗi, đồng thời tạo các **Index** chuyên biệt nhằm tối ưu hóa hiệu năng truy vấn cho cả giáo viên và học sinh:

```sql
-- 1. Tạo bảng quản lý Lượt tạo bộ câu hỏi (Hỗ trợ cột ghi lỗi và đếm số lượng)
CREATE TABLE IF NOT EXISTS public.question_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                    -- Ví dụ: "Bộ đề Chương 4 Lớp 12: Sinh học di truyền"
    document_name TEXT,                     -- Tên tệp tài liệu tham khảo đã dùng để bóc tách
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' (chờ duyệt), 'processing' (đang sinh), 'approved' (đã duyệt cả bộ), 'failed' (sinh lỗi)
    error_message TEXT,                     -- Lưu thông tin lỗi chi tiết nếu Gemini API gặp sự cố
    total_questions INTEGER DEFAULT 0,       -- Tổng số câu hỏi mong muốn tạo trong đợt này
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tạo kiểu ENUM để định nghĩa các trạng thái của câu hỏi (nếu chưa có)
DO $$ BEGIN
    CREATE TYPE question_status AS ENUM ('draft', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Thêm các cột bổ sung vào bảng questions (Cấu hình ON DELETE CASCADE để tự động dọn dẹp khi từ chối bộ đề)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS status question_status DEFAULT 'approved'::question_status NOT NULL,
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.question_batches(id) ON DELETE CASCADE;

-- 4. TẠO CÁC INDEX TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN
-- Tăng tốc truy vấn và cập nhật trạng thái câu hỏi theo Batch (Dành cho Giáo viên duyệt đề)
CREATE INDEX IF NOT EXISTS idx_questions_batch_id ON public.questions(batch_id);

-- Partial Index: Tăng tốc truy vấn sinh đề thi cho học sinh (Bỏ qua hoàn toàn các câu hỏi nháp 'draft')
CREATE INDEX IF NOT EXISTS idx_questions_approved_subject_grade 
ON public.questions(subject_id, grade) 
WHERE status = 'approved';
```

---

## 3. Quy Trình Trực Quan Hóa Trên Giao Diện Kiểm Duyệt (UX/UI Workflow)

Thay vì hiển thị một danh sách hàng ngàn câu hỏi nháp nhỏ lẻ, giao diện duyệt câu hỏi `/admin/questions/approve` sẽ được tổ chức như sau:

### Bước 1: Giao diện Trang chủ Kiểm duyệt (Danh sách Bộ đề nháp)
Giáo viên nhìn thấy danh sách các **Lượt tạo bộ đề** hiển thị dưới dạng các thẻ thư mục lớn:
* 📂 **Bộ đề Chương 4 Lớp 12: Sinh học di truyền** 
  *(Tạo bởi: Nguyễn Văn A | Số lượng: 15 câu | Ngày tạo: 23/08/2026 | Tài liệu: `di_truyen_hoc.pdf`)* ➔ **[Nhấp để duyệt]**
* 📂 **Bài tập Dao động điều hòa - Vật Lý 11** 
  *(Tạo bởi: Trần Thị B | Số lượng: 10 câu | Ngày tạo: 22/08/2026 | Tài liệu: `chuong_1_ly.pdf`)* ➔ **[Nhấp để duyệt]**

### Bước 2: Trang chi tiết duyệt theo bộ (Batch Detail Review)
Khi giáo viên nhấp vào một bộ đề nháp:
1. Giao diện mở ra toàn bộ 10-15 câu hỏi thuộc đợt tạo đó xếp dọc xuống.
2. Giáo viên có thể sửa nhanh nội dung hoặc xóa bỏ các câu hỏi lỗi trong đợt sinh này.
3. Ở trên cùng trang web có nút lớn:
   * 💚 **`Phê Duyệt Cả Bộ`**: Nhấn vào nút này sẽ lập tức chạy lệnh cập nhật:
     ```sql
     -- Chuyển toàn bộ câu hỏi trong bộ này sang approved để học sinh làm được bài
     UPDATE public.questions SET status = 'approved' WHERE batch_id = 'BATCH_ID_HIEN_TAI';
     -- Đánh dấu bộ đề đã duyệt
     UPDATE public.question_batches SET status = 'approved' WHERE id = 'BATCH_ID_HIEN_TAI';
     ```
   * 🗑️ **`Từ Chối Cả Bộ`**: Xóa toàn bộ các câu hỏi sinh lỗi trong lượt tạo này để dọn dẹp database.

---

## 4. Đánh Giá Sự Ưu Việt Của Phương Án Gom Bộ (Batch-Based Benefits)

* **Nhận thức đúng đắn của bạn:** Phân tích của bạn hoàn toàn chính xác! Nếu để các câu hỏi nhỏ lẻ đẩy trực tiếp lên cơ sở dữ liệu mà không có cơ chế nhóm, giáo viên sẽ gặp cực kỳ nhiều khó khăn trong việc tìm kiếm, phân loại và duyệt hàng loạt.
* **Quản lý khoa học:** Gom nhóm theo Bộ đề phản ánh đúng tư duy thực tế của giáo viên (soạn bài theo chương/bài).
* **Tiết kiệm thời gian:** Thao tác phê duyệt/từ chối 15 câu hỏi chỉ gói gọn trong **1 click chuột** thay vì 15 lần click riêng lẻ.
