import { useEffect, useState, useCallback } from "react";
import { Plus, Users, Copy, Check, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import type { Tables } from "@/integrations/supabase/types";

type WatchSession = Tables<"watch_sessions">;
type SessionAttendee = Tables<"session_attendees">;

const SessionsPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WatchSession[]>([]);
  const [attendeesMap, setAttendeesMap] = useState<Record<string, SessionAttendee[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newChosenTitle, setNewChosenTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watch_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("fetch sessions error:", error.message, error.details, error.hint);
      setLoading(false);
      return;
    }
    if (data) {
      setSessions(data);
      // Fetch attendees for all sessions in parallel
      const attendeeResults = await Promise.all(
        data.map((s) => supabase.from("session_attendees").select("*").eq("session_id", s.id))
      );
      const map: Record<string, SessionAttendee[]> = {};
      data.forEach((s, i) => {
        map[s.id] = attendeeResults[i].data || [];
      });
      setAttendeesMap(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Realtime attendees
  useEffect(() => {
    const channel = supabase
      .channel("session-attendees-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "session_attendees" }, (payload) => {
        const record = payload.new as SessionAttendee | undefined;
        if (record) {
          setAttendeesMap((prev) => {
            const list = prev[record.session_id] || [];
            const existing = list.findIndex((a) => a.id === record.id);
            if (existing >= 0) {
              const updated = [...list];
              updated[existing] = record;
              return { ...prev, [record.session_id]: updated };
            }
            return { ...prev, [record.session_id]: [...list, record] };
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreate = async () => {
    if (!user) return;
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle.length < 3) {
      toast.error("O nome da sessão deve ter pelo menos 3 caracteres.");
      return;
    }
    setCreating(true);
    try {
      // Step 1: Create the session
      const { data: session, error: sessionErr } = await supabase.from("watch_sessions").insert({
        host_user_id: user.id,
        title: trimmedTitle,
        chosen_title: newChosenTitle.trim() || null,
      }).select().single();

      if (sessionErr) {
        console.error("Session create error:", sessionErr.message, sessionErr.details, sessionErr.hint);
        throw sessionErr;
      }

      // Step 2: Host auto-joins + create invite token (in parallel)
      const [attendeeRes, inviteRes] = await Promise.all([
        supabase.from("session_attendees").insert({
          session_id: session.id,
          user_id: user.id,
          status: "going",
        }),
        supabase.from("session_invites").insert({
          session_id: session.id,
          invited_by: user.id,
        }).select().single(),
      ]);

      if (attendeeRes.error) console.error("Attendee error:", attendeeRes.error.message);
      if (inviteRes.error) console.error("Invite error:", inviteRes.error.message);

      toast.success("Sessão criada!");
      setNewTitle("");
      setNewChosenTitle("");
      setShowCreate(false);
      fetchSessions();
    } catch (err: any) {
      toast.error("Não foi possível criar sua sessão. Tente novamente.");
      console.error("Create session full error:", err);
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = async (sessionId: string) => {
    const { data } = await supabase
      .from("session_invites")
      .select("invite_token")
      .eq("session_id", sessionId)
      .limit(1)
      .single();
    if (data) {
      const link = `${window.location.origin}/sessions?invite=${data.invite_token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(sessionId);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const lockSession = async (sessionId: string) => {
    const { error } = await supabase.from("watch_sessions").update({ status: "locked" }).eq("id", sessionId);
    if (error) { toast.error("Erro ao travar"); return; }
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, status: "locked" } : s));
    toast.success("Sessão travada!");
  };

  const statusLabel = (s: string) => {
    switch (s) { case "open": return "Aberta"; case "locked": return "Travada"; case "canceled": return "Cancelada"; case "done": return "Concluída"; default: return s; }
  };

  const attendanceLabel = (s: string) => {
    switch (s) { case "going": return "Vou"; case "maybe": return "Talvez"; case "not_going": return "Não vou"; default: return s; }
  };

  return (
    <PageShell title="Sessões" subtitle="Assista com amigos">
      <div className="space-y-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(!showCreate)} className="w-full btn-gold flex items-center justify-center gap-2">
          <Plus size={18} />
          Criar nova sessão
        </motion.button>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="card-cinema space-y-3">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nome da sessão (mín. 3 caracteres)" className="h-12 rounded-xl bg-secondary border-0 text-base" />
                <Input value={newChosenTitle} onChange={(e) => setNewChosenTitle(e.target.value)} placeholder="Título escolhido (opcional)" className="h-12 rounded-xl bg-secondary border-0 text-base" />
                <button onClick={handleCreate} disabled={creating || newTitle.trim().length < 3} className="w-full btn-gold text-sm h-11 disabled:opacity-50">
                  {creating ? "Criando..." : "Criar sessão"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="card-cinema h-24 animate-pulse bg-secondary rounded-xl" />)}
          </div>
        )}

        {!loading && sessions.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">Nenhuma sessão ainda</p>
            <p className="text-muted-foreground text-xs">Crie uma sessão e convide amigos!</p>
          </div>
        )}

        {sessions.map((session) => {
          const attendees = attendeesMap[session.id] || [];
          const isHost = session.host_user_id === user?.id;

          return (
            <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-cinema space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-sm">{session.title}</h3>
                  {session.chosen_title && <p className="text-xs text-muted-foreground mt-0.5">🎬 {session.chosen_title}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  session.status === "open" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {statusLabel(session.status)}
                </span>
              </div>

              {attendees.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Confirmados ({attendees.length})</p>
                  <div className="flex gap-1 flex-wrap">
                    {attendees.map((a) => (
                      <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {attendanceLabel(a.status)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isHost && (
                <div className="flex gap-2">
                  <button onClick={() => copyInviteLink(session.id)} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors touch-target">
                    {copiedToken === session.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedToken === session.id ? "Copiado!" : "Copiar convite"}
                  </button>
                  {session.status === "open" && (
                    <button onClick={() => lockSession(session.id)} className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors touch-target">
                      <Lock size={14} />
                      Travar
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
};

export default SessionsPage;
