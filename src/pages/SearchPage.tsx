import { useState, useEffect } from "react";
import { Search, Plus, Film, Tv, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import { searchTitles } from "@/lib/tmdb";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";

const SearchPage = () => {
  const { user } = useAuth();
  const [queryTerm, setQueryTerm] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Custom add
  const [customTitle, setCustomTitle] = useState("");
  const [customType, setCustomType] = useState<"movie" | "series">("movie");
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [queryTerm]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    const fetchSearch = async () => {
      setLoading(true);
      try {
        const raw = await searchTitles(debouncedQuery);
        const mapped: Recommendation[] = raw.map((r: any) => ({
          id: r.id,
          title: r.title || r.name,
          type: r.media_type === "movie" ? "movie" : "series",
          reason: r.overview ? (r.overview.length > 120 ? r.overview.substring(0, 120) + "..." : r.overview) : "",
          tags: [],
          intensity: Math.round(r.vote_average / 2) || 3,
          posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : undefined,
        }));
        setResults(mapped);
      } catch {
        toast.error("Erro na busca.");
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
  }, [debouncedQuery]);

  const handleAddCustom = async () => {
    if (!customTitle.trim()) { toast.error("Informe o título"); return; }
    if (!user) return;
    setSavingCustom(true);
    try {
      await addDoc(collection(db, "watchlist"), {
        user_id: user.uid,
        item_type: customType,
        title: customTitle.trim(),
        added_at: new Date().toISOString(),
        watched: false
      });
      toast.success(`"${customTitle}" adicionado à sua lista!`);
      setCustomTitle("");
      setShowAddForm(false);
    } catch {
      toast.error("Erro ao adicionar. Tente novamente.");
    } finally {
      setSavingCustom(false);
    }
  };

  const handleSaveResult = async (rec: Recommendation) => {
    if (!user) return;
    try {
      const q = query(collection(db, "watchlist"), where("user_id", "==", user.uid), where("title", "==", rec.title));
      const snaps = await getDocs(q);
      if (snaps.empty) {
        await addDoc(collection(db, "watchlist"), {
          user_id: user.uid,
          item_type: rec.type,
          title: rec.title,
          poster_url: rec.posterUrl || null,
          added_at: new Date().toISOString(),
          watched: false
        });
        toast.success(`"${rec.title}" salvo na sua lista!`);
      } else {
        toast.info("Item já está na lista.");
      }
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  return (
    <PageShell title="Buscar" subtitle="Encontre filmes e séries">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={queryTerm}
            onChange={(e) => setQueryTerm(e.target.value)}
            placeholder="Buscar título..."
            className="pl-10 h-12 rounded-xl bg-secondary border-0 text-base"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-border font-medium text-sm hover:bg-secondary transition-colors touch-target"
        >
          <Plus size={18} />
          Adicionar manualmente à lista
        </motion.button>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card-cinema space-y-3">
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Nome do filme ou série"
                  className="h-12 rounded-xl bg-secondary border-0 text-base"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setCustomType("movie")}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all ${
                      customType === "movie" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Film size={16} />
                    Filme
                  </button>
                  <button
                    onClick={() => setCustomType("series")}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all ${
                      customType === "series" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Tv size={16} />
                    Série
                  </button>
                </div>
                <button onClick={handleAddCustom} disabled={savingCustom} className="w-full btn-gold text-sm h-11 disabled:opacity-50">
                  {savingCustom ? "Salvando..." : "Adicionar à lista"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-accent" />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3 pb-10 mt-4">
            {results.map((rec, i) => (
              <RecommendationCard
                key={`${rec.title}-${i}`}
                rec={rec}
                index={i}
                onSave={() => handleSaveResult(rec)}
              />
            ))}
          </div>
        )}

        {!queryTerm && !showAddForm && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Search size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Busque por título ou adicione manualmente
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default SearchPage;
