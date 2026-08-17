-- SQL Migration to create system_settings table for contact configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read on system_settings" ON public.system_settings;
CREATE POLICY "Allow public read on system_settings" ON public.system_settings FOR SELECT USING (true);

-- Allow all actions for service role (admin scripts/actions)
DROP POLICY IF EXISTS "Allow service role all on system_settings" ON public.system_settings;
CREATE POLICY "Allow service role all on system_settings" ON public.system_settings FOR ALL TO service_role USING (true);

-- Insert default contact configuration if not exists
INSERT INTO public.system_settings (key, value)
VALUES (
    'contacts',
    '{"phone": "0978888777", "zalo": "https://zalo.me", "facebook": "https://facebook.com"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
