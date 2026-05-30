import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clapperboard, RotateCcw, Play, Dices } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc, limit } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { discoverTitles, genreMap, getTrending, providerMap } from "@/lib/tmdb";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import MoodSelector from "@/components/MoodSelector";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";
import TutorialOverlay from "@/components/TutorialOverlay";
import useEmblaCarousel from "embla-carousel-react";
import {
  buildUserProfile,
  filterRejected,
  rankRecommendations,
  isHighMatch,
  personalizationLabel,
  type SwipeRecord,
  type RankedRecommendation,
} from "@/lib/recommendationEngine";

const reverseGenreMap = Object.entries(genreMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<number, string>);

const HomePage = () => {
  const { user, profile, preferences } = useAuth();
  const navigate = useNavigate();
  const [mood, setMood] = useState({ time: "", mood: "", company: "" });
  const [recs, setRecs] = useState<RankedRecommendation[] | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (profile && profile.has_seen_tutorial === undefined) {
      setShowTutorial(true);
    }
  }, [profile]);
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);

  const [trending, setTrending] = useState<any[]>([]);
  const [watchlistPreview, setWatchlistPreview] = useState<any[]>([]);

  // Carrossel refs
  const [emblaRefTrending] = useEmblaCarousel({ dragFree: true });
  const [emblaRefWatchlist] = useEmblaCarousel({ dragFree: true });
  const [emblaRefRecs] = useEmblaCarousel({ dragFree: true });

  useEffect(() => {
    if (!user) return;
    
    // Load swipes
    (async () => {
      try {
        const q = query(collection(db, "user_swipes"), where("user_id", "==", user.uid), orderBy("created_at", "asc"));
        const snaps = await getDocs(q);
        const data: SwipeRecord[] = [];
        snaps.forEach(doc => data.push(doc.data() as SwipeRecord));
        setSwipes(data);
      } catch (e) {
        console.error(e);
      }
    })();

    // Load trending
    (async () => {
      try {
        const t = await getTrending();
        setTrending(t.slice(0, 10));
      } catch {}
    })();

    // Load watchlist preview
    (async () => {
      try {
        const q = query(collection(db, "watchlist"), where("user_id", "==", user.uid), orderBy("added_at", "desc"), limit(5));
        const snaps = await getDocs(q);
        const data: any[] = [];
        snaps.forEach(doc => data.push(doc.data()));
        setWatchlistPreview(data);
      } catch {}
    })();

  }, [user]);

  const profileData = useMemo(() => buildUserProfile(swipes), [swipes]);

  const stepsDone = useMemo(() => {
    let n = 0;
    if (mood.time) n += 1;
    if (mood.mood) n += 1;
    if (mood.company) n += 1;
    return n;
  }, [mood]);

  const canRecommend = stepsDone === 3;

  const personalize = (list: Recommendation[]): RankedRecommendation[] => {
    const filtered = filterRejected(list, swipes);
    const pool = filtered.length > 0 ? filtered : list;
    if (profileData.swipeCount < 5) {
      return pool.map((r) => ({ ...r, score: 0 }));
    }
    return rankRecommendations(pool, profileData);
  };

  const mapMoodToGenre = () => {
    const map: Record<string, number> = {
      "rir": genreMap["Comédia"],
      "chorar": genreMap["Drama"],
      "assustar": genreMap["Terror"],
      "aprender": genreMap["Documentário"],
      "romance": genreMap["Romance"],
      "acao": genreMap["Ação"]
    };
    return map[mood.mood] || "";
  };

  const executeRecommendation = async (forceRandom = false) => {
    setLoadingRecs(true);
    setRecs(null);

    try {
      let raw = [];
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

      if (forceRandom) {
        // Random fetch
        const page = Math.floor(Math.random() * 20) + 1;
        const type = Math.random() > 0.5 ? "movie" : "tv";
        raw = await discoverTitles(type, undefined, page, extraParams);
      } else {
        const targetGenre = mapMoodToGenre();
        const page = Math.floor(Math.random() * 3) + 1; 
        const isShort = mood.time === "1h";
        const type = isShort ? "tv" : "movie"; 
        raw = await discoverTitles(type, targetGenre ? String(targetGenre) : undefined, page, extraParams);
      }
      
      const mapped: Recommendation[] = raw.map((r: any) => ({
        id: r.id,
        title: r.title || r.name,
        type: r.media_type === "movie" ? "movie" : "series",
        reason: r.overview ? (r.overview.length > 120 ? r.overview.substring(0, 120) + "..." : r.overview) : "Altamente recomendado para seu humor atual.",
        tags: (r.genre_ids || []).map((id: number) => reverseGenreMap[id]).filter(Boolean),
        intensity: Math.round(r.vote_average / 2) || 3,
        posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : undefined,
      }));

      mapped.sort(() => Math.random() - 0.5);
      setRecs(personalize(mapped.slice(0, 10)));
      
      if(forceRandom) {
        toast.success("🎲 Sorteio realizado com sucesso!");
      }

    } catch {
      toast.error("Erro ao buscar recomendações.");
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSave = async (rec: Recommendation) => {
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
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const handleReset = () => {
    setMood({ time: "", mood: "", company: "" });
    setRecs(null);
  };

  const heroItem = trending[0];

  return (
    <PageShell>
      {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
      <div className="space-y-6 pb-6 pt-8">
        
        {/* HERO BANNER DINÂMICO */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => heroItem && navigate(`/title/${heroItem.media_type === 'movie' ? 'movie' : 'series'}/${heroItem.id}`)}
          className="relative overflow-hidden rounded-2xl px-5 py-6 text-white shadow-lg min-h-[220px] flex flex-col justify-end cursor-pointer group"
        >
          {/* Background Image (Backdrop) */}
          {heroItem?.backdrop_path ? (
            <div className="absolute inset-0 z-0">
              <img 
                src={`https://image.tmdb.org/t/p/w780${heroItem.backdrop_path}`} 
                alt="Banner" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0" style={{ background: "var(--gradient-midnight)" }} />
          )}

          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Clapperboard size={20} className="text-gold" />
                <span className="text-xs font-bold text-white tracking-wide uppercase drop-shadow-md">CineMatch</span>
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold leading-tight drop-shadow-lg">
              {heroItem ? heroItem.title || heroItem.name : "O que vamos assistir hoje?"}
            </h1>
            <p className="text-sm opacity-90 line-clamp-2 drop-shadow-md">
              {heroItem ? heroItem.overview : "Escolha tempo, humor e companhia — eu te dou o match."}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-sm">
                Top 1 de Hoje
              </span>
            </div>
          </div>
        </motion.section>

        {/* EM ALTA HOJE - CARROSSEL */}
        {trending.length > 1 && (
          <section>
            <h2 className="font-display text-base font-semibold mb-3 px-1">🔥 Em Alta Hoje</h2>
            <div className="overflow-hidden" ref={emblaRefTrending}>
              <div className="flex gap-3">
                {trending.slice(1).map((item) => (
                  <div key={item.id} className="flex-[0_0_120px] min-w-0">
                    <div 
                      onClick={() => navigate(`/title/${item.media_type === 'movie' ? 'movie' : 'series'}/${item.id}`)}
                      className="w-full aspect-[2/3] rounded-xl bg-secondary overflow-hidden shadow-sm relative cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      {item.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">{item.title || item.name}</div>
                      )}
                      <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium border border-white/10">
                        {Math.round(item.vote_average * 10)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SUA LISTA PREVIEW */}
        {watchlistPreview.length > 0 && (
          <section>
            <h2 className="font-display text-base font-semibold mb-3 px-1">🍿 Da Sua Lista</h2>
            <div className="overflow-hidden" ref={emblaRefWatchlist}>
              <div className="flex gap-3">
                {watchlistPreview.map((item, idx) => (
                  <div key={idx} className="flex-[0_0_100px] min-w-0">
                    <div 
                      onClick={() => navigate(`/title/${item.item_type}/${item.id}`)}
                      className="w-full aspect-[2/3] rounded-xl bg-secondary overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover opacity-90" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">{item.title}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SELETORES DE HUMOR */}
        <section className="rounded-2xl border bg-card/60 backdrop-blur p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
            <div>
              <h2 className="text-display text-base">Recomendação Guiada</h2>
              <p className="text-xs text-muted-foreground">Isso deixa a busca bem mais certeira.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => executeRecommendation(true)}
                title="Estou com Sorte"
                className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Dices size={16} />
              </button>
              <button
                onClick={handleReset}
                title="Limpar seleção"
                className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-muted transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <MoodSelector selected={mood} onChange={(key, value) => setMood((p) => ({ ...p, [key]: value }))} />
          
          <div className="mt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => executeRecommendation(false)}
              disabled={!canRecommend || loadingRecs}
              className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
                canRecommend ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" : "bg-secondary text-muted-foreground"
              }`}
            >
              {loadingRecs ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Me recomenda agora
                </>
              )}
            </motion.button>

            {/* Progress Bar inside button area */}
            <div className="mt-3 flex items-center justify-between gap-3 px-1">
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${(stepsDone / 3) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{stepsDone}/3</span>
            </div>
          </div>
        </section>

        {/* RESULTADOS EM CARROSSEL */}
        <AnimatePresence>
          {recs && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pb-10 pt-2">
              <div className="flex items-end justify-between mb-4 px-1">
                <div>
                  <h3 className="text-display text-lg">Seus Matches</h3>
                  <p className="text-xs text-muted-foreground">{personalizationLabel(profile)}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{recs.length} opções</span>
              </div>

              <div className="overflow-visible" ref={emblaRefRecs}>
                <div className="flex gap-4 px-1 pb-4">
                  {recs.map((rec, i) => (
                    <div key={`${rec.title}-${rec.type}`} className="flex-[0_0_85%] min-w-0">
                      <RecommendationCard
                        rec={rec}
                        index={i}
                        onSave={() => handleSave(rec)}
                        highMatch={isHighMatch(rec.score, profile)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default HomePage;
