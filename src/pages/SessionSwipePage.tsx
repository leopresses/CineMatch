import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, PartyPopper, Calendar, MapPin, Trophy, X } from "lucide-react";
import { getTrending, discoverTitles, genreMap, providerMap } from "@/lib/tmdb";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import SwipeCard from "@/components/SwipeCard";
import type { Recommendation } from "@/components/RecommendationCard";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const reverseGenreMap = Object.entries(genreMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<number, string>);

const SessionSwipePage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, preferences } = useAuth();
  
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  // Rate Limiter Frontend
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  
  // Matches state
  const [currentMatch, setCurrentMatch] = useState<any>(null); // For popup
  const [matchesVault, setMatchesVault] = useState<string[]>([]); // Array of movie IDs
  const [showVault, setShowVault] = useState(false);

  useEffect(() => {
    if (!sessionId || !user) return;

    // Load session info
    const loadData = async () => {
      const d = await getDoc(doc(db, "watch_sessions", sessionId));
      let theme = null;
      if(d.exists()) {
        const data = d.data();
        setSessionInfo(data);
        theme = data.theme;
      }

      try {
        let t;
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

        if (theme) {
          t = await discoverTitles("movie", String(theme), 1, extraParams);
        } else {
          t = await getTrending();
        }
        
        const mapped: Recommendation[] = t.map((r: any) => ({
          id: r.id,
          title: r.title || r.name,
          type: r.media_type === "movie" ? "movie" : "series",
          reason: r.overview ? (r.overview.length > 100 ? r.overview.substring(0,100)+"..." : r.overview) : "",
          tags: (r.genre_ids || []).map((id: number) => reverseGenreMap[id]).filter(Boolean),
          intensity: Math.round(r.vote_average / 2) || 3,
          posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : undefined,
        }));
        setRecs(mapped);
      } catch {
        toast.error("Erro ao buscar filmes.");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const q = query(collection(db, "session_votes"), where("session_id", "==", sessionId), where("vote", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const votesByMovie: Record<number, Set<string>> = {};
      const newMatches: string[] = [];
      
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if(!votesByMovie[d.movie_id]) votesByMovie[d.movie_id] = new Set();
        votesByMovie[d.movie_id].add(d.user_id);

        if (votesByMovie[d.movie_id].size >= 2) {
          newMatches.push(d.movie_id);
        }
      });

      setMatchesVault(prev => {
        const addedMatches = newMatches.filter(m => !prev.includes(m));
        if (addedMatches.length > 0) {
          // New match found!
          const latestMatchId = addedMatches[0];
          setCurrentMatch(latestMatchId);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        return Array.from(new Set([...prev, ...newMatches]));
      });
    });

    return () => unsubscribe();
  }, [sessionId, user]);

  const handleSwipe = async (liked: boolean) => {
    if (isProcessingSwipe) return;
    setIsProcessingSwipe(true);
    
    if (!user || !sessionId || currentIndex >= recs.length) {
      setIsProcessingSwipe(false);
      return;
    }

    const currentItem = recs[currentIndex];
    
    // Optimistically advance
    setCurrentIndex(prev => prev + 1);

    // Save vote to DB
    try {
      await addDoc(collection(db, "session_votes"), {
        session_id: sessionId,
        user_id: user.uid,
        movie_id: currentItem.id,
        movie_title: currentItem.title,
        vote: liked,
        created_at: new Date().toISOString()
      });
    } catch {
      toast.error("Erro ao registrar voto.");
    } finally {
      setTimeout(() => setIsProcessingSwipe(false), 300);
    }
  };

  const currentRec = recs[currentIndex];
  const matchedMovie = recs.find(r => r.id === currentMatch);
  const vaultMovies = recs.filter(r => matchesVault.includes(String(r.id)) || matchesVault.includes(r.id as any));

  return (
    <PageShell>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-semibold leading-tight line-clamp-1">{sessionInfo?.title || "Sala de Match"}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1">
              <Flame size={10} className="text-accent" /> Ao vivo
            </p>
          </div>
          {matchesVault.length > 0 && (
            <button 
              onClick={() => setShowVault(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 font-bold text-xs border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
            >
              <Trophy size={14} />
              {matchesVault.length}
            </button>
          )}
        </div>

        {/* EVENT CARD */}
        {(sessionInfo?.date_time || sessionInfo?.location) && (
          <div className="flex flex-wrap gap-3 mb-6 p-3 rounded-2xl bg-secondary/50 border border-border">
            {sessionInfo.date_time && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Calendar size={14} className="text-accent" /> {sessionInfo.date_time}
              </div>
            )}
            {sessionInfo.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapPin size={14} className="text-accent" /> {sessionInfo.location}
              </div>
            )}
            {sessionInfo.theme && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Flame size={14} className="text-accent" /> Tema filtrado
              </div>
            )}
          </div>
        )}

        {/* SWIPE AREA */}
        <div className="relative flex-1 w-full max-w-sm mx-auto flex flex-col justify-center">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentIndex >= recs.length ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <PartyPopper size={28} className="text-accent" />
              </div>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">Fim da fila!</h2>
              <p className="text-sm">Aguarde seus amigos terminarem de votar para ver se deu match.</p>
            </div>
          ) : (
            <div className="relative w-full h-[60vh] max-h-[600px] perspective-1000">
              {recs.slice(currentIndex, currentIndex + 3).reverse().map((rec, idx) => {
                const stackOffset = recs.slice(currentIndex, currentIndex + 3).length - 1 - idx;
                return (
                  <SwipeCard
                    key={`${rec.id}-${idx}`}
                    rec={rec}
                    onSwipe={handleSwipe}
                    isTop={stackOffset === 0}
                    stackOffset={stackOffset}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* SWIPE CONTROLS */}
        {!loading && currentIndex < recs.length && (
          <div className="flex justify-center gap-8 py-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(false)}
              disabled={isProcessingSwipe}
              className="w-16 h-16 rounded-full bg-card border-2 border-rose-400 flex items-center justify-center shadow-md hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              <X size={28} className="text-rose-500" strokeWidth={3} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(true)}
              disabled={isProcessingSwipe}
              className="w-16 h-16 rounded-full bg-card border-2 border-emerald-400 flex items-center justify-center shadow-md hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
            >
              <Check size={28} className="text-emerald-500" strokeWidth={3} />
            </motion.button>
          </div>
        )}
      </div>

      {/* MATCH POPUP (NEW MATCH) */}
      <AnimatePresence>
        {currentMatch && matchedMovie && !showVault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="flex flex-col items-center max-w-sm w-full"
            >
              <h1 className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,0,85,0.5)]">
                É um Match!
              </h1>
              <p className="text-sm text-white/80 mb-6">Vocês concordaram em assistir a isso:</p>
              
              <div className="w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-accent mb-6">
                {matchedMovie.posterUrl ? (
                  <img src={matchedMovie.posterUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">Sem Imagem</div>
                )}
              </div>

              <h2 className="font-display text-2xl font-bold mb-8">{matchedMovie.title}</h2>

              <div className="flex w-full gap-3">
                <button onClick={() => setCurrentMatch(null)} className="flex-1 h-12 rounded-xl bg-white/10 font-medium hover:bg-white/20 transition-colors">
                  Continuar Votando
                </button>
                <button onClick={() => navigate(`/title/${matchedMovie.type}/${matchedMovie.id}`)} className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground font-bold hover:brightness-110 shadow-lg shadow-accent/20 transition-all">
                  Ver Filme
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MATCHES VAULT (DRAWER) */}
      <AnimatePresence>
        {showVault && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col p-5"
          >
            <div className="flex items-center justify-between mb-6 pt-4">
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Cofre de Matches
              </h1>
              <button onClick={() => setShowVault(false)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-20 hide-scrollbar">
              {vaultMovies.map(movie => (
                <div key={movie.id} onClick={() => navigate(`/title/${movie.type}/${movie.id}`)} className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-border cursor-pointer group">
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center text-xs">Sem Capa</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{movie.title}</h3>
                  </div>
                </div>
              ))}
              {vaultMovies.length === 0 && (
                <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">
                  Nenhum match ainda. Continuem votando!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default SessionSwipePage;
