-- SQL Migration for Exam Variant Shuffling & Scrambling + Result Display Mode Configuration

-- 1. Create table public.exam_variants
CREATE TABLE IF NOT EXISTS public.exam_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    variant_code TEXT NOT NULL,                         -- Mã đề: '101', '102', '103'...
    question_ids JSONB NOT NULL,                        -- Mảng danh sách ID câu hỏi theo thứ tự hoán vị
    option_orders JSONB NOT NULL,                       -- Map: { [question_id]: [0, 2, 1, 3] } (thứ tự đáp án sau trộn)
    answer_key JSONB NOT NULL,                          -- Map: { [question_id]: 'A' | 'B' | 'C' | 'D' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_exam_variant UNIQUE(exam_id, variant_code)
);

-- 2. Create table public.student_exam_assignments
CREATE TABLE IF NOT EXISTS public.student_exam_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.exam_variants(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_exam_assignment UNIQUE(exam_id, student_id)
);

-- 3. Add columns to public.exams
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS is_shuffled BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS num_variants INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS result_display_mode TEXT DEFAULT 'show_answers' NOT NULL; -- 'show_answers' | 'score_only'

-- 4. Add columns to public.submissions
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS variant_code TEXT,
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.exam_variants(id) ON DELETE SET NULL;

-- 5. Enable RLS and setup policies
ALTER TABLE public.exam_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions on exam_variants" ON public.exam_variants;
CREATE POLICY "Allow all actions on exam_variants" ON public.exam_variants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions on student_exam_assignments" ON public.student_exam_assignments;
CREATE POLICY "Allow all actions on student_exam_assignments" ON public.student_exam_assignments FOR ALL USING (true) WITH CHECK (true);

-- 6. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_exam_variants_exam_id ON public.exam_variants(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_exam_id ON public.student_exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON public.student_exam_assignments(student_id);
