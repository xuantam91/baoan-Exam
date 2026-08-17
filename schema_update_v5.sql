-- SQL Migration script to upgrade database schema for Exam-App Lần 5 (Hạn nộp bài thi)

-- 1. Add due_at column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS due_at TIMESTAMP WITH TIME ZONE;
