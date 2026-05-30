import { useEffect, useState } from "react";
import { Bookmark, Trash2, Film, Tv, Check, Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";

interface WatchlistItem {
  id: string;
  title: string;
  item_type: "movie" | "series";
  watched: boolean;
  added_at: string;
  poster_url?: string | null;
  rating?: number;
}

const WatchlistPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "series">("all");

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "watchlist"),
        where("user_id", "==", user.uid),
        orderBy("added_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data: WatchlistItem[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as WatchlistItem);
      });
      setItems(data);
    } catch (e) {
      console.error("Erro ao carregar lista", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "watchlist", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Removido da lista");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleToggleWatched = async (item: WatchlistItem) => {
    try {
      await updateDoc(doc(db, "watchlist", item.id), { watched: !item.watched });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, watched: !i.watched } : i));
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleRating = async (item: WatchlistItem, rating: number) => {
    try {
      await updateDoc(doc(db, "watchlist", item.id), { rating });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, rating } : i));
      toast.success("Avaliação salva!");
    } catch {
      toast.error("Erro ao salvar avaliação.");
    }
  };

  const filtered = items.filter((i) => filter === "all" || i.item_type === filter);

  return (
    <PageShell title="Minha Lista" subtitle="Seus filmes e séries salvos">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "movie", "series"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {f === "all" ? "Todos" : f === "movie" ? "Filmes" : "Séries"}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-cinema h-20 animate-shimmer bg-secondary rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bookmark size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">
              {items.length === 0 ? "Sua lista está vazia" : "Nenhum item neste filtro"}
            </p>
            <p className="text-muted-foreground text-xs">Salve recomendações ou adicione manualmente</p>
          </div>
        )}

        {/* Items */}
        <AnimatePresence>
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="card-cinema flex items-center gap-3"
            >
              <div className="w-16 h-24 rounded-lg bg-secondary flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                {item.poster_url ? (
                  <img src={item.poster_url} className={`w-full h-full object-cover transition-all ${item.watched ? 'grayscale opacity-70' : ''}`} />
                ) : (
                  item.item_type === "movie" ? <Film size={20} className="text-muted-foreground" /> : <Tv size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className={`font-display font-semibold text-base line-clamp-2 ${item.watched ? "line-through opacity-60" : ""}`}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.item_type === "movie" ? "Filme" : "Série"}
                  {item.watched && " • Assistido"}
                </p>

                {item.watched && (
                  <div className="flex items-center gap-1 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleRating(item, i + 1)}
                        className="touch-target p-1 -m-1"
                      >
                        <Star 
                          size={16} 
                          className={`transition-colors ${item.rating && item.rating > i ? "text-gold fill-gold" : "text-border"}`} 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-between self-stretch py-1">
                <button
                  onClick={() => handleToggleWatched(item)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors touch-target ${item.watched ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  <Check size={16} strokeWidth={item.watched ? 3 : 2} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors touch-target">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default WatchlistPage;
