
-- Fix all RLS policies: recreate as PERMISSIVE (default) instead of RESTRICTIVE

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- recommendation_history
DROP POLICY IF EXISTS "Users view own history" ON public.recommendation_history;
CREATE POLICY "Users manage own history" ON public.recommendation_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- session_attendees
DROP POLICY IF EXISTS "Attendees manage own" ON public.session_attendees;
DROP POLICY IF EXISTS "Participants see attendees" ON public.session_attendees;
CREATE POLICY "Attendees manage own" ON public.session_attendees FOR ALL USING ((auth.uid() = user_id) OR (auth.uid() = (SELECT host_user_id FROM watch_sessions WHERE id = session_attendees.session_id))) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants see attendees" ON public.session_attendees FOR SELECT USING (public.is_session_participant(auth.uid(), session_id));

-- session_invites
DROP POLICY IF EXISTS "Host/inviter manage invites" ON public.session_invites;
DROP POLICY IF EXISTS "Invitee can update own invite" ON public.session_invites;
DROP POLICY IF EXISTS "Invitee can view own invites" ON public.session_invites;
CREATE POLICY "Host inviter manage invites" ON public.session_invites FOR ALL USING ((auth.uid() = invited_by) OR (auth.uid() = (SELECT host_user_id FROM watch_sessions WHERE id = session_invites.session_id))) WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invitee can update own invite" ON public.session_invites FOR UPDATE USING ((invitee_user_id = auth.uid()) OR (invitee_email = ((SELECT email FROM auth.users WHERE id = auth.uid()))::text));
CREATE POLICY "Invitee can view own invites" ON public.session_invites FOR SELECT USING ((invitee_user_id = auth.uid()) OR (invitee_email = ((SELECT email FROM auth.users WHERE id = auth.uid()))::text));

-- user_preferences
DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_preferences;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- watch_sessions
DROP POLICY IF EXISTS "Host can manage sessions" ON public.watch_sessions;
DROP POLICY IF EXISTS "Participants can view sessions" ON public.watch_sessions;
CREATE POLICY "Host can manage sessions" ON public.watch_sessions FOR ALL USING (auth.uid() = host_user_id) WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Participants can view sessions" ON public.watch_sessions FOR SELECT USING (public.is_session_participant(auth.uid(), id));

-- watchlist
DROP POLICY IF EXISTS "Users manage own watchlist" ON public.watchlist;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create user_backups table
CREATE TABLE IF NOT EXISTS public.user_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own backups" ON public.user_backups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Ensure handle_new_user trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
