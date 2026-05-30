import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Share2, Lock, Globe, Trash2, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RecommendationCard from "@/components/RecommendationCard";

const CollectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [collectionData, setCollectionData] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      if (id === "default") {
        if (!user) {
          toast.error("Faça login para ver sua Watchlist.");
          return;
        }
        setIsOwner(true);
        setCollectionData({
          title: "Ver Mais Tarde",
          description: "Sua lista padrão de filmes e séries para assistir.",
          is_public: false
        });
        
        // Fetch classic watchlist
        const q = query(collection(db, "user_watchlist"), where("user_id", "==", user.uid));
        const snaps = await getDocs(q);
        const data: any[] = [];
        snaps.forEach(d => {
          data.push({ _docId: d.id, ...d.data() });
        });
        setMovies(data);
      } else {
        // Fetch custom collection
        const docRef = doc(db, "user_collections", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCollectionData(data);
          setMovies(data.movies || []);
          setIsOwner(user?.uid === data.user_id);
          
          if (!data.is_public && user?.uid !== data.user_id) {
            toast.error("Esta coleção é privada.");
            navigate("/collections");
          } else {
            setEditTitle(data.title);
            setEditDesc(data.description || "");
            setEditPublic(data.is_public);
          }
        } else {
          toast.error("Coleção não encontrada.");
          navigate("/collections");
        }
      }
      setLoading(false);
    };
    
    loadData();
  }, [id, user, navigate]);

  const shareCollection = async () => {
    if (!collectionData) return;
    const url = window.location.href;
    const text = `🍿 Dá uma olhada na coleção "${collectionData.title}" que eu criei!\n\n${url}`;
    
    try {
      if (navigator.share) {
        await navigator.share({ title: collectionData.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch (e: any) {
      if (e.name !== "AbortError") toast.error("Erro ao compartilhar.");
    }
  };

  const removeMovie = async (movieId: number, docId?: string) => {
    if (!isOwner) return;
    
    try {
      if (id === "default" && docId) {
        await deleteDoc(doc(db, "user_watchlist", docId));
        setMovies(prev => prev.filter(m => m._docId !== docId));
      } else {
        const newMovies = movies.filter(m => m.id !== movieId);
        await updateDoc(doc(db, "user_collections", id!), { movies: newMovies });
        setMovies(newMovies);
      }
      toast.success("Removido da coleção.");
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  const handleSaveEdit = async () => {
    if (editTitle.trim().length < 3) {
      toast.error("O título deve ter pelo menos 3 caracteres.");
      return;
    }
    try {
      await updateDoc(doc(db, "user_collections", id!), {
        title: editTitle.trim(),
        description: editDesc.trim(),
        is_public: editPublic
      });
      setCollectionData({ ...collectionData, title: editTitle.trim(), description: editDesc.trim(), is_public: editPublic });
      setIsEditing(false);
      toast.success("Coleção atualizada!");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const confirmDelete = async () => {
    if (id === "default") {
      try {
        await setDoc(doc(db, "user_settings", user!.uid), { hide_default_watchlist: true }, { merge: true });
        toast.success("Lista removida!");
        navigate("/collections");
      } catch {
        toast.error("Erro ao remover.");
      }
      return;
    }

    try {
      await deleteDoc(doc(db, "user_collections", id!));
      toast.success("Coleção excluída!");
      navigate("/collections");
    } catch {
      toast.error("Erro ao excluir coleção.");
    }
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      </PageShell>
    );
  }

  if (!collectionData) return null;

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          {collectionData.is_public && !isEditing && (
            <button onClick={shareCollection} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm hover:bg-accent/20 transition-colors">
              <Share2 size={16} /> Compartilhar
            </button>
          )}
          {isOwner && !isEditing && (
            <>
              {id !== "default" && (
                <button onClick={() => setIsEditing(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted transition-colors">
                  <Edit2 size={16} />
                </button>
              )}
              <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-8">
        {isEditing ? (
          <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Nome da Coleção" className="h-12 rounded-xl bg-secondary border-0 text-lg font-bold" />
            <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Descrição (opcional)" className="h-12 rounded-xl bg-secondary border-0 text-sm" />
            <div className="flex items-center gap-2">
              <button onClick={() => setEditPublic(true)} className={`flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${editPublic ? 'bg-accent border-accent text-accent-foreground' : 'bg-secondary border-border text-muted-foreground'}`}>
                <Globe size={14} /> Pública
              </button>
              <button onClick={() => setEditPublic(false)} className={`flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${!editPublic ? 'bg-secondary border-border text-secondary-foreground' : 'bg-transparent border-border text-muted-foreground'}`}>
                <Lock size={14} /> Privada
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsEditing(false)} className="flex-1 h-11 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm">Cancelar</button>
              <button onClick={handleSaveEdit} className="flex-1 h-11 rounded-xl bg-accent text-accent-foreground font-medium text-sm">Salvar Alterações</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold mb-2 leading-tight">{collectionData.title}</h1>
            {collectionData.description && (
              <p className="text-muted-foreground text-sm mb-3">{collectionData.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground flex items-center gap-1">
                {collectionData.is_public ? <Globe size={12} /> : <Lock size={12} />}
                {collectionData.is_public ? "Pública" : "Privada"}
              </span>
              <span className="text-xs text-muted-foreground">{movies.length} títulos</span>
            </div>
          </>
        )}
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhum filme nesta coleção ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {movies.map((m: any) => (
            <div key={m.id} className="relative group">
              <Link to={`/title/${m.type}/${m.id}`} className="block">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary border border-border">
                  {m.posterUrl ? (
                    <img src={m.posterUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem Capa</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <h3 className="font-display font-semibold text-xs text-white line-clamp-2">{m.title}</h3>
                  </div>
                </div>
              </Link>
              
              {isOwner && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMovie(m.id, m._docId); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="w-[90%] max-w-[400px] rounded-2xl bg-secondary border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-left">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-muted-foreground">
              {id === "default" 
                ? "Deseja ocultar a lista Ver Mais Tarde? Os filmes salvos não serão excluídos, mas a lista sumirá da sua tela." 
                : "Deseja excluir esta coleção? Esta ação não pode ser desfeita e todos os filmes nela serão removidos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:space-x-0 mt-4">
            <AlertDialogCancel className="mt-0 flex-1 h-12 rounded-xl bg-background border-border hover:bg-muted text-sm font-medium">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="mt-0 flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default CollectionDetailsPage;
