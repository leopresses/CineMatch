import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, Flame, RefreshCw, Film, Tv, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc } from "firebase/firestore";
import { discoverTitles, genreMap, providerMap } from "@/lib/tmdb";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import SwipeCard from "@/components/SwipeCard";
import TrailerModal from "@/components/TrailerModal";
import type { Recommendation } from "@/components/RecommendationCard";
import { getTrailer } from "@/lib/tmdb";
import {
  buildUserProfile,
  filterRejected,
  rankRecommendations,
  personalizationLabel,
  type SwipeRecord,
} from "@/lib/recommendationEngine";

// Reverse map to get genre name by id
const reverseGenreMap = Object.entries(genreMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<number, string>);

const CATEGORIES = [
  { name: "Ação", id: 28 },
  { name: "Aventura", id: 12 },
  { name: "Animação", id: 16 },
  { name: "Comédia", id: 35 },
  { name: "Crime", id: 80 },
  { name: "Documentário", id: 99 },
  { name: "Drama", id: 18 },
  { name: "Fantasia", id: 14 },
  { name: "Ficção Científica", id: 878 },
  { name: "Terror", id: 27 },
  { name: "Mistério", id: 9648 },
  { name: "Romance", id: 10749 },
  { name: "Suspense", id: 53 },
];

const SwipePage = () => {
  const { user, preferences } = useAuth();
  const [cards, setCards] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setSeenTitles] = useState<Set<string>>(new Set());
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Trailer states
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerTitle, setTrailerTitle] = useState("");

  // Rewind state
  const [lastSwipe, setLastSwipe] = useState<{ swipeId?: string, watchlistId?: string, cardIndex: number } | null>(null);

  // Rate Limiter Frontend
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

  const profile = useMemo(() => buildUserProfile(swipes), [swipes]);

  const loadCards = async (currentPage: number, currentFilter: string, currentGenre: number | null) => {
    setLoading(true);

    let history: SwipeRecord[] = [];
    if (user) {
      try {
        const q = query(
          collection(db, "user_swipes"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "asc")
        );
        const snaps = await getDocs(q);
        snaps.forEach(d => history.push(d.data() as SwipeRecord));
        setSwipes(history);
        setSeenTitles(new Set(history.map(s => s.title)));
      } catch (e) {
        console.error("Erro ao ler histórico", e);
      }
    }

    // Fetch TMDB
    let rawPool: any[] = [];
    try {
      const genresStr = currentGenre ? String(currentGenre) : undefined;
      
      let extraParams: Record<string, string | number> = {};
      if (preferences) {
        if (preferences.disliked_genres?.length > 0) {
          extraParams.without_genres = preferences.disliked_genres.map((g: string) => genreMap[g]).filter(Boolean).join(",");
        }
        if (preferences.streaming_services?.length > 0) {
          extraParams.with_watch_providers = preferences.streaming_services.map((s: string) => providerMap[s]).filter(Boolean).join("|");
          extraParams.watch_region = "BR";
        }
      }

      if (currentFilter === "all" || currentFilter === "movie") {
        const movies = await discoverTitles("movie", genresStr, currentPage, extraParams);
        rawPool = [...rawPool, ...movies];
      }
      if (currentFilter === "all" || currentFilter === "tv") {
        const series = await discoverTitles("tv", genresStr, currentPage, extraParams);
        rawPool = [...rawPool, ...series];
      }
    } catch {
      toast.error("Erro ao buscar recomendações do TMDB.");
    }

    let pool: Recommendation[] = rawPool.map((r: any) => ({
      title: r.title || r.name,
      type: r.media_type === "movie" ? "movie" : "series",
      reason: r.overview ? (r.overview.length > 120 ? r.overview.substring(0, 120) + "..." : r.overview) : "Altamente recomendado para você.",
      tags: (r.genre_ids || []).map((id: number) => reverseGenreMap[id]).filter(Boolean),
      intensity: Math.round(r.vote_average / 2) || 3,
      posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : undefined,
      id: r.id 
    }));

    pool.sort(() => Math.random() - 0.5);

    const seen = new Set(history.map((s) => s.title));
    let fresh = pool.filter((r) => !seen.has(r.title));
    fresh = filterRejected(fresh, history);

    const candidates = fresh.length > 0 ? fresh : pool;
    const localProfile = buildUserProfile(history);
    const ranked = localProfile.swipeCount >= 5 ? rankRecommendations(candidates, localProfile) : candidates;

    setCards(ranked);
    setIndex(0);
    setLoading(false);
  };

  useEffect(() => {
    loadCards(page, filterType, activeGenre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, filterType, activeGenre]);

  const handleRefresh = () => {
    setPage(p => p + 1);
  };

  const handleSwipe = async (liked: boolean) => {
    if (isProcessingSwipe) return;
    setIsProcessingSwipe(true);
    
    const current = cards[index];
    if (!current) {
      setIsProcessingSwipe(false);
      return;
    }

    setIndex((i) => i + 1);
    setSeenTitles((s) => new Set(s).add(current.title));

    setSwipes((prev) => [
      ...prev,
      {
        title: current.title,
        liked,
        tags: current.tags || [],
        intensity: current.intensity || 3,
        created_at: new Date().toISOString(),
      },
    ]);

    if (!user) return;

    try {
      let swipeId;
      let watchlistId;

      const swipeRef = await addDoc(collection(db, "user_swipes"), {
        user_id: user.uid,
        title: current.title,
        item_type: current.type,
        liked,
        tags: current.tags || [],
        intensity: current.intensity || 3,
        created_at: new Date().toISOString()
      });
      swipeId = swipeRef.id;

      if (liked) {
        // Simple duplicate check before adding
        const q = query(collection(db, "watchlist"), where("user_id", "==", user.uid), where("title", "==", current.title));
        const snaps = await getDocs(q);
        if (snaps.empty) {
          const wRef = await addDoc(collection(db, "watchlist"), {
            user_id: user.uid,
            title: current.title,
            item_type: current.type,
            poster_url: current.posterUrl || null,
            watched: false,
            added_at: new Date().toISOString()
          });
          watchlistId = wRef.id;
          toast.success(`❤️ ${current.title} adicionado à lista`);
        }
      }

      setLastSwipe({ swipeId, watchlistId, cardIndex: index });

    } catch {
      console.error("Erro ao salvar swipe");
    } finally {
      // Cooldown de 300ms para evitar flood/rodos (Rate Limit Frontend)
      setTimeout(() => setIsProcessingSwipe(false), 300);
    }
  };

  const handleRewind = async () => {
    if (!lastSwipe) return;
    
    // Voltar index
    setIndex(lastSwipe.cardIndex);
    const cardTitle = cards[lastSwipe.cardIndex].title;
    
    // Remover do set de vistos local
    setSeenTitles((s) => {
      const newSet = new Set(s);
      newSet.delete(cardTitle);
      return newSet;
    });

    // Remover do histórico local de swipes
    setSwipes((prev) => prev.slice(0, -1));

    // Deletar do banco de dados (Best effort)
    if (user) {
      try {
        import("firebase/firestore").then(async ({ doc, deleteDoc }) => {
          if (lastSwipe.swipeId) await deleteDoc(doc(db, "user_swipes", lastSwipe.swipeId));
          if (lastSwipe.watchlistId) await deleteDoc(doc(db, "watchlist", lastSwipe.watchlistId));
        });
      } catch (e) {
        console.error("Erro ao dar rewind no banco", e);
      }
    }

    setLastSwipe(null);
  };

  const handlePlayTrailer = async (rec: Recommendation) => {
    const url = await getTrailer(rec.id, rec.type);
    if (url) {
      setTrailerUrl(url.split("v=")[1]);
      setTrailerTitle(rec.title);
      setShowTrailer(true);
    } else {
      toast.error("Trailer não encontrado.");
    }
  };

  const remaining = cards.slice(index, index + 3);
  const isFinished = !loading && index >= cards.length;

  return (
    <PageShell>
      <div className="pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={22} className="text-accent" />
            <h1 className="text-display text-2xl">Descobrir</h1>
          </div>
          
          {/* FIlterBar Simples */}
          <div className="flex bg-secondary p-1 rounded-lg">
            <button onClick={() => { setFilterType("all"); setPage(1); }} className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${filterType === "all" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Todos</button>
            <button onClick={() => { setFilterType("movie"); setPage(1); }} className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${filterType === "movie" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><Film size={14} className="inline mr-1"/>Filmes</button>
            <button onClick={() => { setFilterType("tv"); setPage(1); }} className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${filterType === "tv" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><Tv size={14} className="inline mr-1"/>Séries</button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 pt-2 hide-scrollbar">
          <button 
            onClick={() => { setActiveGenre(null); setPage(1); }} 
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${activeGenre === null ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}
          >
            Tudo
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setActiveGenre(cat.id); setPage(1); }} 
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${activeGenre === cat.id ? "bg-accent border-accent text-accent-foreground" : "bg-card border-border hover:bg-secondary"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-1">
          Arraste para os lados ou dê <strong className="text-accent">2 toques</strong> para curtir.
        </p>
        <p className="text-xs text-accent font-medium mb-4">{personalizationLabel(profile)}</p>

        {/* Stack area */}
        <div className="relative w-full mx-auto" style={{ aspectRatio: "3 / 4", maxWidth: 380 }}>
          {loading ? (
            <div className="absolute inset-0 rounded-3xl border bg-card flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isFinished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 rounded-3xl border bg-card flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold">Acabaram as recomendações 😢</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Aprendi um pouco sobre seu gosto. Quer gerar mais sugestões?
              </p>
              <button
                onClick={handleRefresh}
                className="btn-gold mt-5 inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Gerar mais
              </button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {remaining
                .slice()
                .reverse()
                .map((rec, i) => {
                  const stackOffset = remaining.length - 1 - i;
                  const isTop = stackOffset === 0;
                  return (
                    <SwipeCard
                      key={`${rec.title}-${index + stackOffset}`}
                      rec={rec}
                      onSwipe={handleSwipe}
                      onPlayTrailer={handlePlayTrailer}
                      isTop={isTop}
                      stackOffset={stackOffset}
                    />
                  );
                })}
            </AnimatePresence>
          )}
        </div>

        {/* Action buttons */}
        {!loading && !isFinished && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRewind}
              disabled={!lastSwipe}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${lastSwipe ? "bg-card border-yellow-400/50 hover:bg-yellow-500/10 shadow-md" : "bg-secondary/50 border-border opacity-50"}`}
              aria-label="Desfazer"
            >
              <RotateCcw size={20} className={lastSwipe ? "text-yellow-500" : "text-muted-foreground"} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(false)}
              disabled={isProcessingSwipe}
              className="w-16 h-16 rounded-full bg-card border-2 border-rose-400 flex items-center justify-center shadow-md hover:bg-rose-500/10 transition-colors disabled:opacity-50"
              aria-label="Não gostei"
            >
              <X size={28} className="text-rose-500" strokeWidth={3} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(true)}
              disabled={isProcessingSwipe}
              className="w-16 h-16 rounded-full bg-card border-2 border-emerald-400 flex items-center justify-center shadow-md hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              aria-label="Gostei"
            >
              <Heart size={26} className="text-emerald-500 fill-emerald-500" />
            </motion.button>
          </div>
        )}

        {!loading && !isFinished && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {cards.length - index} sugestões restantes
          </p>
        )}
        {trailerUrl && (
          <TrailerModal
            videoId={trailerUrl}
            title={trailerTitle}
            open={showTrailer}
            onClose={() => setShowTrailer(false)}
          />
        )}
      </div>
    </PageShell>
  );
};

export default SwipePage;
