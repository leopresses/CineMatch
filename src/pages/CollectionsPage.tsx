import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Library, Film, Lock, Globe, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserCollection {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  movies: any[];
  created_at: string;
}

const CollectionsPage = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showDefault, setShowDefault] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Check if user has hidden the default watchlist
    getDoc(doc(db, "user_settings", user.uid)).then(d => {
      if (d.exists() && d.data().hide_default_watchlist) {
        setShowDefault(false);
      }
    });

    const q = query(collection(db, "user_collections"), where("user_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: UserCollection[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as UserCollection);
      });
      // Sort locally by created_at desc to avoid Firebase Index requirements
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setCollections(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching collections:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    if (newTitle.trim().length < 3) {
      toast.error("O título deve ter pelo menos 3 caracteres.");
      return;
    }
    setCreating(true);
    try {
      await addDoc(collection(db, "user_collections"), {
        user_id: user.uid,
        title: newTitle.trim(),
        description: newDesc.trim(),
        is_public: isPublic,
        movies: [],
        created_at: new Date().toISOString()
      });
      toast.success("Coleção criada!");
      setNewTitle("");
      setNewDesc("");
      setShowCreate(false);
    } catch (error) {
      toast.error("Erro ao criar coleção.");
    } finally {
      setCreating(false);
    }
  };

  const deleteCollection = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Deseja excluir esta coleção?")) return;
    try {
      await deleteDoc(doc(db, "user_collections", id));
      toast.success("Coleção excluída!");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: "collection" | "default", id?: string }>({ isOpen: false, type: "collection" });

  const confirmDelete = async () => {
    if (deleteConfirm.type === "default") {
      try {
        await setDoc(doc(db, "user_settings", user!.uid), { hide_default_watchlist: true }, { merge: true });
        setShowDefault(false);
        toast.success("Lista removida!");
      } catch {
        toast.error("Erro ao remover.");
      }
    } else if (deleteConfirm.id) {
      try {
        await deleteDoc(doc(db, "user_collections", deleteConfirm.id));
        toast.success("Coleção excluída!");
      } catch {
        toast.error("Erro ao excluir.");
      }
    }
    setDeleteConfirm({ ...deleteConfirm, isOpen: false });
  };

  return (
    <PageShell title="Coleções" subtitle="Suas listas de filmes">
      <div className="space-y-4">
        
        <motion.button 
          whileTap={{ scale: 0.97 }} 
          onClick={() => setShowCreate(!showCreate)} 
          className="w-full btn-gold flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Criar nova coleção
        </motion.button>

        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }} 
              className="overflow-hidden"
            >
              <div className="card-cinema space-y-3">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nome da Coleção (ex: Top 5 Terror)" className="h-12 rounded-xl bg-secondary border-0 text-base" />
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" className="h-12 rounded-xl bg-secondary border-0 text-sm" />
                
                <div className="flex items-center gap-2 px-1 pb-2">
                  <button 
                    onClick={() => setIsPublic(true)} 
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${isPublic ? 'bg-accent border-accent text-accent-foreground' : 'bg-transparent border-border text-muted-foreground'}`}
                  >
                    <Globe size={14} /> Pública
                  </button>
                  <button 
                    onClick={() => setIsPublic(false)} 
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${!isPublic ? 'bg-secondary border-border text-secondary-foreground' : 'bg-transparent border-border text-muted-foreground'}`}
                  >
                    <Lock size={14} /> Privada
                  </button>
                </div>

                <button onClick={handleCreate} disabled={creating || newTitle.trim().length < 3} className="w-full btn-gold text-sm h-11 disabled:opacity-50">
                  {creating ? "Criando..." : "Criar Coleção"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Default Watchlist */}
          {showDefault && (
            <Link to="/collection/default" className="card-cinema p-0 overflow-hidden group">
              <div className="aspect-[4/3] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex flex-col items-center justify-center relative">
                <Library size={32} className="text-indigo-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-sm leading-tight text-white">Ver Mais Tarde</h3>
                    <p className="text-[10px] text-white/70">Lista Padrão</p>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm({ isOpen: true, type: "default" }); }}
                    className="p-1.5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </Link>
          )}

          {/* User Collections */}
          {collections.map(col => {
            const hasMovies = col.movies && col.movies.length > 0;
            const topPosters = col.movies ? col.movies.slice(0, 3) : [];
            
            return (
              <Link key={col.id} to={`/collection/${col.id}`} className="card-cinema p-0 overflow-hidden group">
                <div className="aspect-[4/3] bg-secondary relative flex items-center justify-center overflow-hidden">
                  {hasMovies ? (
                    <div className="absolute inset-0 flex">
                      {topPosters.map((m, i) => (
                        <div key={m.id} className="flex-1 h-full relative" style={{ zIndex: 3 - i }}>
                          <img src={m.posterUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Film size={32} className="text-muted-foreground/30 mb-2 group-hover:scale-110 transition-transform" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-3">
                    <h3 className="font-display font-semibold text-sm leading-tight text-white drop-shadow-md">{col.title || "Sem título"}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-white/70 font-medium">
                          {col.movies?.length || 0} títulos
                        </p>
                        {!col.is_public && <Lock size={10} className="text-white/50" />}
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm({ isOpen: true, type: "collection", id: col.id }); }}
                        className="p-1.5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[1,2].map(i => <div key={i} className="card-cinema p-0 aspect-[4/3] animate-shimmer bg-secondary" />)}
          </div>
        )}

      </div>

      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm({ ...deleteConfirm, isOpen: false })}>
        <AlertDialogContent className="w-[90%] max-w-[400px] rounded-2xl bg-secondary border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-left">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-muted-foreground">
              {deleteConfirm.type === "default" 
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

export default CollectionsPage;
