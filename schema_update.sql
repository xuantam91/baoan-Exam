-- SQL Migration script to upgrade database schema for Exam-App Lần 2

-- 1. Upgrade Questions Table
-- Add question_type: 'MultipleChoice', 'TrueFalse', 'FillIn', 'Essay'
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'MultipleChoice';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Upgrade Submissions Table
-- Add status: 'Graded' (fully auto-graded or manually graded) or 'Pending' (waiting for manual essay grading)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Graded';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_score NUMERIC(4, 2);
-- Stores detailed essay grading details: {"question-id": {"score": 2.0, "comment": "Good"}}
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS essay_grades JSONB DEFAULT '{}'::jsonb;

-- 3. Setup Supabase Storage Bucket for Question Images
-- Insert bucket record if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on Storage Objects (done by default in Supabase, but let's configure policies)
-- Note: Supabase Storage uses public policy configurations. Let's create policies for public access.
DO $$
BEGIN
    -- Select Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access on question-images' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access on question-images" ON storage.objects 
        FOR SELECT USING (bucket_id = 'question-images');
    END IF;

    -- Insert Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Insert Access on question-images' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Insert Access on question-images" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'question-images');
    END IF;

    -- Update Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Update Access on question-images' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Update Access on question-images" ON storage.objects 
        FOR UPDATE USING (bucket_id = 'question-images') WITH CHECK (bucket_id = 'question-images');
    END IF;

    -- Delete Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Delete Access on question-images' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Delete Access on question-images" ON storage.objects 
        FOR DELETE USING (bucket_id = 'question-images');
    END IF;
END
$$;
