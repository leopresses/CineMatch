import { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut, ChevronRight, Pencil, Check, X, Camera, Film, Library, Users, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import { genreMap } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";

const allGenres = Object.keys(genreMap);

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Dashboard State
  const [stats, setStats] = useState({ saved: 0, collections: 0, sessions: 0 });
  const [favGenres, setFavGenres] = useState<string[]>([]);
  
  // Edit Genres State
  const [isEditingGenres, setIsEditingGenres] = useState(false);
  const [tempGenres, setTempGenres] = useState<string[]>([]);
  const [savingGenres, setSavingGenres] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, "profiles", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name) setName(data.name);
        else setName(user.displayName || user.email?.split("@")[0] || "");
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.favorite_genres) setFavGenres(data.favorite_genres);
      }
    };

    const fetchStats = async () => {
      try {
        const wlQ = query(collection(db, "user_watchlist"), where("user_id", "==", user.uid));
        const colQ = query(collection(db, "user_collections"), where("user_id", "==", user.uid));
        const sessQ = query(collection(db, "session_attendees"), where("user_id", "==", user.uid));

        const [wlSnap, colSnap, sessSnap] = await Promise.all([
          getDocs(wlQ), getDocs(colQ), getDocs(sessQ)
        ]);

        setStats({
          saved: wlSnap.size,
          collections: colSnap.size,
          sessions: sessSnap.size
        });
      } catch (err) {
        console.error("Erro ao buscar estatísticas", err);
      }
    };

    fetchProfile();
    fetchStats();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), { name: name.trim() });
      toast.success("Nome atualizado!");
    } catch {
      toast.error("Erro ao salvar nome");
    }
    setEditingName(false);
    setSavingName(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Use JPG, PNG ou WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${user.uid}/avatar.${ext}`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "profiles", user.uid), { avatar_url: publicUrl });

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openGenreEdit = () => {
    setTempGenres([...favGenres]);
    setIsEditingGenres(true);
  };

  const toggleGenre = (genre: string) => {
    setTempGenres(prev => {
      if (prev.includes(genre)) return prev.filter(g => g !== genre);
      if (prev.length >= 4) {
        toast.info("Você pode escolher no máximo 4 gêneros favoritos.");
        return prev;
      }
      return [...prev, genre];
    });
  };

  const saveGenres = async () => {
    if (!user) return;
    setSavingGenres(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), { favorite_genres: tempGenres });
      setFavGenres(tempGenres);
      toast.success("DNA Cinéfilo atualizado!");
      setIsEditingGenres(false);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSavingGenres(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <PageShell title="Perfil">
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden shadow-xl border-4 border-background">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-muted-foreground" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all border-2 border-background"
          >
            {uploadingAvatar ? (
              <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-48 rounded-xl bg-secondary border-0 text-base text-center shadow-inner"
              autoFocus
            />
            <button onClick={handleSaveName} disabled={savingName} className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-accent-foreground hover:brightness-110 transition-colors shadow-md">
              <Check size={18} />
            </button>
            <button onClick={() => setEditingName(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-muted transition-colors shadow-sm">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 mt-4 group touch-target px-2 py-1 rounded-lg hover:bg-secondary/50 transition-colors">
            <h2 className="font-display text-2xl font-bold">{name || "Usuário"}</h2>
            <Pencil size={14} className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card-cinema flex flex-col items-center justify-center text-center p-4">
          <Film size={20} className="text-accent mb-2 opacity-80" />
          <p className="font-display text-xl font-bold">{stats.saved}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Salvos</p>
        </div>
        <div className="card-cinema flex flex-col items-center justify-center text-center p-4">
          <Library size={20} className="text-indigo-400 mb-2 opacity-80" />
          <p className="font-display text-xl font-bold">{stats.collections}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Coleções</p>
        </div>
        <div className="card-cinema flex flex-col items-center justify-center text-center p-4">
          <Users size={20} className="text-emerald-400 mb-2 opacity-80" />
          <p className="font-display text-xl font-bold">{stats.sessions}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sessões</p>
        </div>
      </div>

      {/* DNA Cinéfilo */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-rose-500" />
            <h3 className="font-display font-semibold text-sm">DNA Cinéfilo</h3>
          </div>
          {favGenres.length > 0 && (
            <button onClick={openGenreEdit} className="text-[11px] text-accent font-medium hover:underline flex items-center gap-1">
              <Pencil size={10} /> Editar
            </button>
          )}
        </div>

        {favGenres.length === 0 ? (
          <button 
            onClick={openGenreEdit}
            className="w-full card-cinema border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center py-6 hover:bg-secondary/80 transition-colors"
          >
            <p className="text-sm font-medium mb-1">Qual o seu estilo?</p>
            <p className="text-xs text-muted-foreground mb-3 text-center">Escolha até 4 gêneros favoritos<br/>para mostrar no seu perfil.</p>
            <div className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
              Definir DNA Cinéfilo
            </div>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favGenres.map(g => (
              <span key={g} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-full shadow-sm">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 mt-auto pb-4">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl touch-target transition-colors text-foreground bg-secondary hover:bg-muted shadow-sm"
        >
          <Settings size={18} className="text-muted-foreground" />
          <span className="flex-1 text-left text-sm font-medium">Preferências e streaming</span>
          <ChevronRight size={16} className="text-muted-foreground/50" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl touch-target transition-colors text-red-500 bg-red-500/10 hover:bg-red-500/20 shadow-sm"
        >
          <LogOut size={18} />
          <span className="flex-1 text-left text-sm font-medium">Sair da conta</span>
        </button>
      </div>

      {/* Edit Genres Drawer */}
      <AnimatePresence>
        {isEditingGenres && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-10 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h2 className="font-display text-lg font-bold">Seus Gêneros Favoritos</h2>
                <p className="text-xs text-muted-foreground">Escolha até 4 opções ({tempGenres.length}/4)</p>
              </div>
              <button onClick={() => setIsEditingGenres(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 overflow-y-auto hide-scrollbar pb-4">
              {allGenres.map(genre => {
                const isSelected = tempGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isSelected 
                        ? "bg-rose-500 text-white border-rose-500 shadow-md scale-105" 
                        : "bg-secondary text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 mt-auto border-t border-border flex-shrink-0">
              <button 
                onClick={saveGenres} 
                disabled={savingGenres || tempGenres.length === 0}
                className="w-full btn-gold text-sm h-12 shadow-lg disabled:opacity-50"
              >
                {savingGenres ? "Salvando..." : "Salvar DNA Cinéfilo"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default ProfilePage;
