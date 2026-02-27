import { useEffect, useState } from "react";
import { Bookmark, Trash2, Film, Tv, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import type { Tables } from "@/integrations/supabase/types";

type WatchlistItem = Tables<"watchlist">;

const WatchlistPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "series">("all");

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removido da lista");
  };

  const handleToggleWatched = async (item: WatchlistItem) => {
    const { error } = await supabase.from("watchlist").update({ watched: !item.watched }).eq("id", item.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, watched: !i.watched } : i));
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
              <div key={i} className="card-cinema h-20 animate-pulse bg-secondary rounded-xl" />
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
              <div className="w-12 h-16 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
                {item.item_type === "movie" ? <Film size={20} className="text-muted-foreground" /> : <Tv size={20} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-display font-semibold text-sm truncate ${item.watched ? "line-through opacity-60" : ""}`}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.item_type === "movie" ? "Filme" : "Série"}
                  {item.watched && " • Assistido ✓"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleWatched(item)}
                  className={`p-2 rounded-lg transition-colors touch-target ${item.watched ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Check size={18} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors touch-target">
                  <Trash2 size={18} />
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
