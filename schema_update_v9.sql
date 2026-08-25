-- SQL Migration to create exam_templates table
CREATE TABLE IF NOT EXISTS public.exam_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 45 NOT NULL,
    easy_count INTEGER DEFAULT 0 NOT NULL,
    medium_count INTEGER DEFAULT 0 NOT NULL,
    hard_count INTEGER DEFAULT 0 NOT NULL,
    mc_count INTEGER DEFAULT 0 NOT NULL,
    tf_count INTEGER DEFAULT 0 NOT NULL,
    fill_count INTEGER DEFAULT 0 NOT NULL,
    essay_count INTEGER DEFAULT 0 NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.exam_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own templates
DROP POLICY IF EXISTS "Allow authenticated select on exam_templates" ON public.exam_templates;
CREATE POLICY "Allow authenticated select on exam_templates" 
ON public.exam_templates FOR SELECT 
TO authenticated 
USING (true); -- Let all authenticated teachers view all templates, or restrict using: auth.uid() = created_by

-- Allow authenticated users to insert templates
DROP POLICY IF EXISTS "Allow authenticated insert on exam_templates" ON public.exam_templates;
CREATE POLICY "Allow authenticated insert on exam_templates" 
ON public.exam_templates FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Or: auth.uid() = created_by

-- Allow authenticated users to delete their own templates
DROP POLICY IF EXISTS "Allow authenticated delete on exam_templates" ON public.exam_templates;
CREATE POLICY "Allow authenticated delete on exam_templates" 
ON public.exam_templates FOR DELETE 
TO authenticated 
USING (true); -- Or: auth.uid() = created_by

-- Also allow service role full access
DROP POLICY IF EXISTS "Allow service role all on exam_templates" ON public.exam_templates;
CREATE POLICY "Allow service role all on exam_templates" ON public.exam_templates FOR ALL TO service_role USING (true);
