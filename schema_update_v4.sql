-- SQL Migration script to upgrade database schema for Exam-App Lần 4 (Chương & Bài)

-- 1. Create Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    grade TEXT NOT NULL, -- Grade level (e.g. "10", "11", "12")
    title TEXT NOT NULL, -- e.g. "Chương 1: Hệ hô hấp"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- e.g. "Bài 1: Cấu tạo phổi"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Upgrade Questions Table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

-- 4. Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_chapters_subject_grade ON chapters(subject_id, grade);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter_lesson ON questions(chapter_id, lesson_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
CREATE POLICY "Allow public read on chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Allow public read on lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Allow all actions on chapters" ON chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on lessons" ON lessons FOR ALL USING (true) WITH CHECK (true);
