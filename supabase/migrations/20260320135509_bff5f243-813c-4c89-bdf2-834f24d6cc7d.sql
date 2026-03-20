ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;