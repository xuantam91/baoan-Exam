-- SQL Migration script to upgrade database schema for Exam-App Lần 6
-- Add max_attempts, grading_policy and is_sent columns to exams table

ALTER TABLE exams ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS grading_policy TEXT DEFAULT 'highest';
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT false;
