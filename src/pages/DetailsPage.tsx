import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar, Bookmark, Play, Plus, Library, X, Send, MessageSquare } from "lucide-react";
import { getDetails, getCredits, getSimilar, getTrailer, getWatchProviders } from "@/lib/tmdb";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import { motion, AnimatePresence } from "framer-motion";
import TrailerModal from "@/components/TrailerModal";
import useEmblaCarousel from "embla-carousel-react";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";
import { genreMap } from "@/lib/tmdb";

const reverseGenreMap = Object.entries(genreMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<number, string>);

const DetailsPage = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [details, setDetails] = useState<any>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [similar, setSimilar] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);

  // Ratings State
  const [ratings, setRatings] = useState<any[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Collections Drawer State
  const [showSaveDrawer, setShowSaveDrawer] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [itemToSave, setItemToSave] = useState<{type: "movie"|"tv", title: string, posterPath?: string, id: number} | null>(null);
  const [showDefault, setShowDefault] = useState(true);

  const [emblaRefCast] = useEmblaCarousel({ dragFree: true });
  const [emblaRefSimilar] = useEmblaCarousel({ dragFree: true });

  useEffect(() => {
    if (!id || !type) return;

    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0); // Scroll top on new id
      const tmdbType = type === "series" ? "tv" : (type as "movie" | "tv");
      try {
        const det = await getDetails(Number(id), tmdbType);
        setDetails(det);

        const creds = await getCredits(Number(id), tmdbType);
        setCast(creds.cast?.slice(0, 10) || []);

        const sim = await getSimilar(Number(id), tmdbType);
        const mappedSim: Recommendation[] = sim.map((r: any) => ({
          id: r.id,
          title: r.title || r.name,
          type: type as any,
          reason: "Baseado no que você está vendo agora.",
          tags: (r.genre_ids || []).map((gid: number) => reverseGenreMap[gid]).filter(Boolean),
          intensity: Math.round(r.vote_average / 2) || 3,
          posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : undefined,
        }));
        setSimilar(mappedSim.slice(0, 10));

        const trailer = await getTrailer(Number(id), tmdbType);
        if (trailer) {
          setTrailerUrl(trailer.split("v=")[1]);
        } else {
          setTrailerUrl(null);
        }

        const provs = await getWatchProviders(Number(id), tmdbType);
        setProviders(provs);

        const ratingsQ = query(collection(db, "user_ratings"), where("item_id", "==", Number(id)));
        const ratingsSnap = await getDocs(ratingsQ);
        const ratingsData = ratingsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
        setRatings(ratingsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        if (user) {
          const myReview = ratingsData.find((r: any) => r.user_id === user.uid);
          if (myReview) setHasReviewed(true);
        }

      } catch {
        toast.error("Erro ao carregar detalhes.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCollections = async () => {
      if (!user) return;
      
      const userSettingsSnap = await getDoc(doc(db, "user_settings", user.uid));
      if (userSettingsSnap.exists() && userSettingsSnap.data().hide_default_watchlist) {
        setShowDefault(false);
      }

      const q = query(collection(db, "user_collections"), where("user_id", "==", user.uid));
      const snaps = await getDocs(q);
      const data = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
      setCollections(data);
    };

    fetchData();
    fetchCollections();
  }, [id, type, user]);

  const handleSaveClick = (itemType: "movie" | "tv", title: string, posterPath?: string, itemId?: number) => {
    if (!user) {
      toast.error("Faça login para salvar!");
      return;
    }
    setItemToSave({ type: itemType, title, posterPath, id: itemId || Number(id) });
    setShowSaveDrawer(true);
  };

  const saveToClassicWatchlist = async () => {
    if (!user || !itemToSave) return;
    try {
      const q = query(collection(db, "user_watchlist"), where("user_id", "==", user.uid), where("title", "==", itemToSave.title));
      const snaps = await getDocs(q);
      if (snaps.empty) {
        await addDoc(collection(db, "user_watchlist"), {
          user_id: user.uid,
          item_type: itemToSave.type,
          title: itemToSave.title,
          poster_url: itemToSave.posterPath ? `https://image.tmdb.org/t/p/w500${itemToSave.posterPath}` : null,
          added_at: new Date().toISOString(),
          watched: false
        });
        toast.success("Salvo em Ver Mais Tarde!");
      } else {
        toast.info("Item já está na lista.");
      }
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setShowSaveDrawer(false);
    }
  };

  const saveToCollection = async (collectionId: string, colMovies: any[]) => {
    if (!user || !itemToSave) return;
    if (colMovies.some(m => m.id === itemToSave.id)) {
      toast.info("Item já está nesta coleção.");
      setShowSaveDrawer(false);
      return;
    }
    
    try {
      const newMovie = {
        id: itemToSave.id,
        title: itemToSave.title,
        type: itemToSave.type,
        posterUrl: itemToSave.posterPath ? `https://image.tmdb.org/t/p/w500${itemToSave.posterPath}` : null,
      };
      await updateDoc(doc(db, "user_collections", collectionId), {
        movies: [...colMovies, newMovie]
      });
      toast.success("Adicionado à coleção!");
    } catch {
      toast.error("Erro ao adicionar.");
    } finally {
      setShowSaveDrawer(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error("Faça login para avaliar!");
      return;
    }
    if (userRating === 0) {
      toast.error("Dê uma nota de 1 a 5 estrelas!");
      return;
    }
    setSubmittingReview(true);
    try {
      const profileSnap = await getDoc(doc(db, "profiles", user.uid));
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
      
      const newReview = {
        item_id: Number(id),
        item_type: type,
        user_id: user.uid,
        user_name: profileData.name || user.displayName || "Usuário",
        avatar_url: profileData.avatar_url || null,
        rating: userRating,
        review: reviewText,
        created_at: new Date().toISOString()
      };
      await addDoc(collection(db, "user_ratings"), newReview);
      setRatings(prev => [newReview, ...prev]);
      setHasReviewed(true);
      toast.success("Avaliação enviada!");
    } catch {
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!details) return <PageShell>Não encontrado.</PageShell>;

  const title = details.title || details.name;
  const releaseYear = (details.release_date || details.first_air_date)?.substring(0, 4);
  const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : (details.number_of_seasons ? `${details.number_of_seasons} Temporadas` : "");

  return (
    <PageShell>
      <div className="pb-10 -mx-5 -mt-6">
        {/* Backdrop Header */}
        <div className="relative w-full h-[350px] bg-secondary">
          {details.backdrop_path ? (
            <img 
              src={`https://image.tmdb.org/t/p/w780${details.backdrop_path}`} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-10 left-5 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 -mt-20 relative z-10 space-y-6">
          <div className="flex gap-4">
            <div className="w-28 h-40 rounded-xl overflow-hidden shadow-xl bg-secondary flex-shrink-0 border-2 border-background">
              {details.poster_path && (
                <img src={`https://image.tmdb.org/t/p/w500${details.poster_path}`} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="pt-8">
              <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                {releaseYear && <span className="flex items-center gap-1"><Calendar size={12}/>{releaseYear}</span>}
                {runtime && <span className="flex items-center gap-1"><Clock size={12}/>{runtime}</span>}
                <span className="flex items-center gap-1 text-accent"><Star size={12} className="fill-accent"/> {Number(details.vote_average).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleSaveClick(type as any, title, details.poster_path, Number(id))}
              className="flex-1 h-12 bg-secondary text-secondary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
            >
              <Bookmark size={18} /> Salvar na Lista
            </button>
            {trailerUrl && (
              <button 
                onClick={() => setShowTrailer(true)}
                className="flex-1 h-12 bg-accent text-accent-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-colors"
              >
                <Play size={18} className="fill-current" /> Ver Trailer
              </button>
            )}
          </div>

          <div>
            <h3 className="font-display font-semibold mb-2">Sinopse</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{details.overview || "Sem sinopse disponível."}</p>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-3">Onde Assistir</h3>
            {providers.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {providers.map((p: any) => (
                  <div key={p.provider_id} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md border border-border">
                      <img src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-cinema bg-secondary/20 p-4 border border-dashed border-muted-foreground/30 text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  👀 Parece que esse título está escondido a sete chaves. <br/>
                  Hora de preparar a pipoca e torcer para ele chegar logo aos streamings!
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {details.genres?.map((g: any) => (
              <span key={g.id} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                {g.name}
              </span>
            ))}
          </div>

          <hr className="border-border" />

          {/* Seção de Avaliações */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-accent" />
              <h3 className="font-display font-semibold">Avaliações da Comunidade</h3>
            </div>

            {!hasReviewed && (
              <div className="card-cinema mb-6 bg-secondary/30 p-4 border border-border">
                <p className="text-sm font-medium mb-3">Já assistiu? Deixe sua nota!</p>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 touch-target"
                    >
                      <Star 
                        size={24} 
                        className={`transition-colors ${(hoverRating || userRating) >= star ? "fill-accent text-accent" : "text-muted-foreground"}`} 
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Escreva uma resenha curta (opcional)..."
                      className="w-full bg-secondary border-0 rounded-xl p-3 text-sm min-h-[80px] mb-3 focus:ring-1 focus:ring-accent outline-none resize-none"
                    />
                    <button 
                      onClick={submitReview}
                      disabled={submittingReview}
                      className="w-full btn-gold h-10 text-sm flex items-center justify-center gap-2"
                    >
                      <Send size={14} /> {submittingReview ? "Enviando..." : "Publicar Avaliação"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {ratings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação ainda. Seja o primeiro!</p>
              ) : (
                ratings.map((rev: any, idx) => (
                  <div key={idx} className="card-cinema p-4 bg-background border border-border flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                      {rev.avatar_url ? (
                        <img src={rev.avatar_url} alt={rev.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">{rev.user_name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{rev.user_name}</span>
                        <div className="flex items-center gap-0.5 text-accent">
                          <Star size={12} className="fill-accent" />
                          <span className="text-xs font-medium">{rev.rating}.0</span>
                        </div>
                      </div>
                      {rev.review && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{rev.review}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-border" />

          {cast.length > 0 && (
            <div>
              <h3 className="font-display font-semibold mb-3">Elenco</h3>
              <div className="overflow-hidden -mx-5 px-5" ref={emblaRefCast}>
                <div className="flex gap-3">
                  {cast.map((actor) => (
                    <div 
                      key={actor.id} 
                      onClick={() => navigate(`/actor/${actor.id}`)}
                      className="flex-[0_0_80px] min-w-0 flex flex-col items-center text-center cursor-pointer hover:opacity-80 transition-opacity touch-target"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary mb-2 border border-border">
                        {actor.profile_path ? (
                          <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{actor.name.charAt(0)}</div>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold leading-tight line-clamp-1">{actor.name}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {similar.length > 0 && (
            <div>
              <h3 className="font-display font-semibold mb-3">Títulos Similares</h3>
              <div className="overflow-hidden -mx-5 px-5" ref={emblaRefSimilar}>
                <div className="flex gap-4 pb-4">
                  {similar.map((rec, i) => (
                    <div key={`${rec.id}-${i}`} className="flex-[0_0_85%] min-w-0">
                      <RecommendationCard
                        rec={rec}
                        index={i}
                        onSave={() => handleSaveClick(rec.type, rec.title, rec.posterUrl?.split("w500")[1], rec.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {trailerUrl && (
        <TrailerModal
          videoId={trailerUrl}
          title={title}
          open={showTrailer}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* SAVE DRAWER */}
      <AnimatePresence>
        {showSaveDrawer && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Salvar em...</h2>
              <button onClick={() => setShowSaveDrawer(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto hide-scrollbar">
              {showDefault && (
                <button 
                  onClick={saveToClassicWatchlist}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Library size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Ver Mais Tarde</h3>
                    <p className="text-[10px] text-muted-foreground">Sua watchlist padrão</p>
                  </div>
                </button>
              )}

              {collections.map(col => (
                <button 
                  key={col.id}
                  onClick={() => saveToCollection(col.id, col.movies || [])}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-accent overflow-hidden border border-border">
                    {col.movies && col.movies.length > 0 && col.movies[0].posterUrl ? (
                      <img src={col.movies[0].posterUrl} className="w-full h-full object-cover opacity-50" />
                    ) : (
                      <Library size={18} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{col.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{col.movies?.length || 0} títulos</p>
                  </div>
                </button>
              ))}

              <button 
                onClick={() => { setShowSaveDrawer(false); navigate("/collections"); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-muted-foreground/30 hover:bg-secondary/50 transition-colors text-left mt-2"
              >
                <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-muted-foreground">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Nova Coleção</h3>
                  <p className="text-[10px] text-muted-foreground">Ir para as coleções</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default DetailsPage;
