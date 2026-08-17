-- SQL Script to initialize Supabase Database Schema for Exam-App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade TEXT NOT NULL, -- Grade level (e.g. "10", "11", "12")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE RESTRICT,
    grade TEXT NOT NULL,
    content TEXT NOT NULL, -- LaTeX format supported (e.g., $E = mc^2$)
    options JSONB NOT NULL, -- Format: {"A": "Option text A", "B": "Option text B", "C": "Option text C", "D": "Option text D"}
    correct_answer TEXT NOT NULL, -- "A", "B", "C", or "D"
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL, -- Nullable if general public exam
    duration_minutes INTEGER NOT NULL,
    question_ids UUID[] NOT NULL, -- Array of question UUIDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- Format: {"question-uuid-1": "A", "question-uuid-2": "C"}
    score NUMERIC(4, 2) NOT NULL, -- Scale of 10
    correct_count INTEGER NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes to optimize querying performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_grade ON questions(subject_id, grade);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_subject ON exams(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);

-- Enable Row Level Security (RLS) or disable as per development convenience
-- For convenience in development, we'll keep it open but you can add RLS policies later.
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for simplified setup)
CREATE POLICY "Allow public read on subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read on classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public read on students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read on questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public read on exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Allow public read on submissions" ON submissions FOR SELECT USING (true);

-- Create public insert/update/delete policies for development
CREATE POLICY "Allow all actions on subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on exams" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
