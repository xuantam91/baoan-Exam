-- SQL Migration script to upgrade database schema for Exam-App Lần 7
-- Create profiles table, trigger on auth.users registration, and manage roles

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('admin', 'teacher', 'student', 'parent')) NOT NULL DEFAULT 'student',
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow service_role insert/update on profiles" ON public.profiles FOR ALL TO service_role USING (true);

-- Auto sync auth.users inserts to public.profiles via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, class_id, student_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN new.raw_user_meta_data->>'class_id' IS NOT NULL AND (new.raw_user_meta_data->>'class_id') <> '' THEN (new.raw_user_meta_data->>'class_id')::uuid ELSE NULL END,
    CASE WHEN new.raw_user_meta_data->>'student_id' IS NOT NULL AND (new.raw_user_meta_data->>'student_id') <> '' THEN (new.raw_user_meta_data->>'student_id')::uuid ELSE NULL END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
