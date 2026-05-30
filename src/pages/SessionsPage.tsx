import { useEffect, useState } from "react";
import { Plus, Users, Copy, Check, Lock, Unlock, Play, Share2, MapPin, Calendar, Film, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import { genreMap } from "@/lib/tmdb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface WatchSession {
  id: string;
  host_user_id: string;
  title: string;
  chosen_title: string | null;
  status: string;
  theme: number | null;
  date_time: string | null;
  location: string | null;
  created_at: string;
}

interface SessionAttendee {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
}

const SessionsPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WatchSession[]>([]);
  const [attendeesMap, setAttendeesMap] = useState<Record<string, SessionAttendee[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTheme, setNewTheme] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Realtime Sessions
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "watch_sessions"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: WatchSession[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as WatchSession);
      });
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Realtime Attendees
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "session_attendees"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, SessionAttendee[]> = {};
      snapshot.forEach(docSnap => {
        const attendee = { id: docSnap.id, ...docSnap.data() } as SessionAttendee;
        if (!map[attendee.session_id]) map[attendee.session_id] = [];
        map[attendee.session_id].push(attendee);
      });
      setAttendeesMap(map);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle Invite Link automatically
  useEffect(() => {
    if (!user || !inviteToken) return;
    const processInvite = async () => {
      try {
        const q = query(collection(db, "session_invites"), where("invite_token", "==", inviteToken));
        const snaps = await getDocs(q);
        if (!snaps.empty) {
          const sessionId = snaps.docs[0].data().session_id;
          
          const attQ = query(collection(db, "session_attendees"), where("session_id", "==", sessionId), where("user_id", "==", user.uid));
          const attSnaps = await getDocs(attQ);
          
          if (attSnaps.empty) {
            await addDoc(collection(db, "session_attendees"), {
              session_id: sessionId,
              user_id: user.uid,
              status: "going"
            });
            toast.success("Você entrou na sessão com sucesso!");
          }
        } else {
          toast.error("Convite inválido ou expirado.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        searchParams.delete("invite");
        setSearchParams(searchParams);
      }
    };
    processInvite();
  }, [user, inviteToken, searchParams, setSearchParams]);

  const handleCreate = async () => {
    if (!user) return;
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle.length < 3) {
      toast.error("O nome da sessão deve ter pelo menos 3 caracteres.");
      return;
    }
    setCreating(true);
    try {
      const sessionRef = await addDoc(collection(db, "watch_sessions"), {
        host_user_id: user.uid,
        title: trimmedTitle,
        chosen_title: null,
        status: "open",
        theme: newTheme,
        date_time: newDate.trim() || null,
        location: newLocation.trim() || null,
        created_at: new Date().toISOString()
      });

      await addDoc(collection(db, "session_attendees"), {
        session_id: sessionRef.id,
        user_id: user.uid,
        status: "going"
      });

      const inviteToken = Math.random().toString(36).substring(2, 10);
      await addDoc(collection(db, "session_invites"), {
        session_id: sessionRef.id,
        invited_by: user.uid,
        invite_token: inviteToken
      });

      toast.success("Sessão criada!");
      setNewTitle("");
      setNewTheme(null);
      setNewDate("");
      setNewLocation("");
      setShowCreate(false);
    } catch (err: any) {
      toast.error("Não foi possível criar sua sessão. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const shareInviteLink = async (sessionId: string, sessionTitle: string) => {
    try {
      const q = query(collection(db, "session_invites"), where("session_id", "==", sessionId));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        const data = snaps.docs[0].data();
        const link = `${window.location.origin}/sessions?invite=${data.invite_token}`;
        const text = `🎥 Te convidei para a Sessão Pipoca: *${sessionTitle}*!\n\nClique no link para entrarmos na sala e escolhermos o filme juntos:\n${link}`;
        
        if (navigator.share) {
          await navigator.share({
            title: "Sessão Pipoca",
            text: text
          });
        } else {
          await navigator.clipboard.writeText(text);
          setCopiedToken(sessionId);
          toast.success("Convite copiado para área de transferência!");
          setTimeout(() => setCopiedToken(null), 2000);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error("Erro ao compartilhar convite.");
      }
    }
  };

  const toggleLockSession = async (sessionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "locked" : "open";
      await updateDoc(doc(db, "watch_sessions", sessionId), { status: newStatus });
      toast.success(newStatus === "locked" ? "Sessão travada com sucesso!" : "Sessão destravada! Convites liberados.");
    } catch {
      toast.error("Erro ao alterar o status da sessão.");
    }
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteDoc(doc(db, "watch_sessions", sessionToDelete));
      toast.success("Sessão excluída!");
    } catch {
      toast.error("Erro ao excluir sessão.");
    }
    setSessionToDelete(null);
  };

  const statusLabel = (s: string) => {
    switch (s) { case "open": return "Aberta"; case "locked": return "Travada"; case "canceled": return "Cancelada"; case "done": return "Concluída"; default: return s; }
  };

  const attendanceLabel = (s: string) => {
    switch (s) { case "going": return "Vou"; case "maybe": return "Talvez"; case "not_going": return "Não vou"; default: return s; }
  };

  const mySessions = sessions.filter(session => {
    if (session.host_user_id === user?.uid) return true;
    const attendees = attendeesMap[session.id] || [];
    return attendees.some(a => a.user_id === user?.uid);
  });

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
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                    <Input value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="Ex: Sexta, 20h" className="h-12 pl-10 rounded-xl bg-secondary border-0 text-sm" />
                  </div>
                  <div className="relative flex-1">
                    <MapPin size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                    <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Ex: Minha Casa" className="h-12 pl-10 rounded-xl bg-secondary border-0 text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground ml-1">Tema da sessão (Opcional):</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    <button onClick={() => setNewTheme(null)} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${newTheme === null ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}>Tudo</button>
                    <button onClick={() => setNewTheme(genreMap["Ação"])} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${newTheme === genreMap["Ação"] ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}>Ação</button>
                    <button onClick={() => setNewTheme(genreMap["Comédia"])} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${newTheme === genreMap["Comédia"] ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}>Comédia</button>
                    <button onClick={() => setNewTheme(genreMap["Terror"])} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${newTheme === genreMap["Terror"] ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}>Terror</button>
                    <button onClick={() => setNewTheme(genreMap["Romance"])} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${newTheme === genreMap["Romance"] ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}>Romance</button>
                    <button onClick={() => setNewTheme(genreMap["Família"])} className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${newTheme === genreMap["Família"] ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}>Família</button>
                  </div>
                </div>

                <button onClick={handleCreate} disabled={creating || newTitle.trim().length < 3} className="w-full btn-gold text-sm h-11 disabled:opacity-50 mt-2">
                  {creating ? "Criando..." : "Criar sessão"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="card-cinema h-24 animate-shimmer bg-secondary rounded-xl" />)}
          </div>
        )}

        {!loading && mySessions.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">Nenhuma sessão ainda</p>
            <p className="text-muted-foreground text-xs">Crie uma sessão e convide amigos!</p>
          </div>
        )}

        {mySessions.map((session) => {
          const attendees = attendeesMap[session.id] || [];
          const isHost = session.host_user_id === user?.uid;

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

              <div className="flex flex-col gap-2">
                {isHost && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button onClick={() => shareInviteLink(session.id, session.title)} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors touch-target min-w-[100px]">
                      {copiedToken === session.id ? <Check size={14} /> : <Share2 size={14} />}
                      {copiedToken === session.id ? "Copiado!" : "Convidar"}
                    </button>
                    {(session.status === "open" || session.status === "locked") && (
                      <button onClick={() => toggleLockSession(session.id, session.status)} className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors touch-target min-w-[100px]">
                        {session.status === "open" ? <Lock size={14} /> : <Unlock size={14} />}
                        {session.status === "open" ? "Travar" : "Destravar"}
                      </button>
                    )}
                    <button onClick={() => setSessionToDelete(session.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors touch-target">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                
                <Link 
                  to={`/session/${session.id}/swipe`}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:brightness-110 transition-colors shadow-lg shadow-accent/20"
                >
                  <Play size={14} className="fill-current" />
                  Entrar na Sala de Match
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent className="w-[90%] max-w-[400px] rounded-2xl bg-secondary border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-left">Excluir sessão?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-muted-foreground">
              Deseja realmente excluir esta sessão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:space-x-0 mt-4">
            <AlertDialogCancel className="mt-0 flex-1 h-12 rounded-xl bg-background border-border hover:bg-muted text-sm font-medium">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="mt-0 flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default SessionsPage;
