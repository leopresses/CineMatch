
-- Create custom types
CREATE TYPE public.item_type AS ENUM ('movie', 'series');
CREATE TYPE public.session_status AS ENUM ('open', 'locked', 'canceled', 'done');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE public.attendance_status AS ENUM ('going', 'maybe', 'not_going');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User preferences
CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  favorite_genres TEXT[] DEFAULT '{}',
  disliked_genres TEXT[] DEFAULT '{}',
  content_limits JSONB DEFAULT '{}',
  streaming_services TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watchlist
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  title TEXT NOT NULL,
  external_id TEXT,
  poster_url TEXT,
  watched BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recommendation history
CREATE TABLE public.recommendation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_context JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON public.recommendation_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watch sessions
CREATE TABLE public.watch_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  item_type item_type,
  chosen_title TEXT,
  chosen_external_id TEXT,
  notes TEXT,
  status session_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;

-- Session invites
CREATE TABLE public.session_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.watch_sessions(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.session_invites ENABLE ROW LEVEL SECURITY;

-- Session attendees
CREATE TABLE public.session_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.watch_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'going',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;

-- Now create the helper function (all tables exist)
CREATE OR REPLACE FUNCTION public.is_session_participant(_user_id UUID, _session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.watch_sessions WHERE id = _session_id AND host_user_id = _user_id
    UNION ALL
    SELECT 1 FROM public.session_attendees WHERE session_id = _session_id AND user_id = _user_id
    UNION ALL
    SELECT 1 FROM public.session_invites WHERE session_id = _session_id AND (invitee_user_id = _user_id OR invitee_email = (SELECT email FROM auth.users WHERE id = _user_id))
  );
$$;

-- RLS for watch_sessions
CREATE POLICY "Host can manage sessions" ON public.watch_sessions FOR ALL USING (auth.uid() = host_user_id) WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Participants can view sessions" ON public.watch_sessions FOR SELECT USING (public.is_session_participant(auth.uid(), id));

-- RLS for session_invites
CREATE POLICY "Host/inviter manage invites" ON public.session_invites FOR ALL
  USING (auth.uid() = invited_by OR auth.uid() = (SELECT host_user_id FROM public.watch_sessions WHERE id = session_id))
  WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invitee can view own invites" ON public.session_invites FOR SELECT
  USING (invitee_user_id = auth.uid() OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "Invitee can update own invite" ON public.session_invites FOR UPDATE
  USING (invitee_user_id = auth.uid() OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS for session_attendees
CREATE POLICY "Attendees manage own" ON public.session_attendees FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = (SELECT host_user_id FROM public.watch_sessions WHERE id = session_id))
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants see attendees" ON public.session_attendees FOR SELECT
  USING (public.is_session_participant(auth.uid(), session_id));

-- Enable realtime for attendees
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_attendees;
