-- Create user_swipes table for tinder-like discovery
CREATE TABLE public.user_swipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  item_type public.item_type NOT NULL,
  external_id TEXT,
  liked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_swipes ENABLE ROW LEVEL SECURITY;

-- Policy: users manage own swipes
CREATE POLICY "Users manage own swipes"
ON public.user_swipes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Useful index to filter by user + lookup by title
CREATE INDEX idx_user_swipes_user_title ON public.user_swipes(user_id, title);
CREATE INDEX idx_user_swipes_user_liked ON public.user_swipes(user_id, liked);
