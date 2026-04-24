ALTER TABLE public.user_swipes
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS intensity int DEFAULT 3;