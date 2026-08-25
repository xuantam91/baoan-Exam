-- SQL Migration to create question_batches and optimize questions table

-- 1. Create table public.question_batches
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

-- 2. Create ENUM for question_status (if not exists)
DO $$ BEGIN
    CREATE TYPE question_status AS ENUM ('draft', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add columns to public.questions with cascade delete
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS status question_status DEFAULT 'approved'::question_status NOT NULL,
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.question_batches(id) ON DELETE CASCADE;

-- 4. Enable Row Level Security (RLS) for question_batches
ALTER TABLE public.question_batches ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for question_batches (Development style, matching schema.sql)
DROP POLICY IF EXISTS "Allow all actions on question_batches" ON public.question_batches;
CREATE POLICY "Allow all actions on question_batches" ON public.question_batches FOR ALL USING (true) WITH CHECK (true);

-- 6. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_questions_batch_id ON public.questions(batch_id);

CREATE INDEX IF NOT EXISTS idx_questions_approved_subject_grade 
ON public.questions(subject_id, grade) 
WHERE status = 'approved';
