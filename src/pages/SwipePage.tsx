import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, Flame, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import SwipeCard from "@/components/SwipeCard";
import { sanitizeRecommendation } from "@/lib/sanitize";
import type { Recommendation } from "@/components/RecommendationCard";
import {
  buildUserProfile,
  filterRejected,
  rankRecommendations,
  personalizationLabel,
  type SwipeRecord,
} from "@/lib/recommendationEngine";

const fallbackRecs: Recommendation[] = [
  {
    title: "Tudo em Todo Lugar ao Mesmo Tempo",
    type: "movie",
    reason: "Uma aventura criativa e emocionante perfeita para qualquer momento.",
    tags: ["Ação", "Comédia", "Sci-Fi"],
    intensity: 4,
  },
  {
    title: "Fleabag",
    type: "series",
    reason: "Humor inteligente e tocante para quando você quer algo leve.",
    tags: ["Comédia", "Drama"],
    intensity: 2,
  },
  {
    title: "Parasita",
    type: "movie",
    reason: "Suspense brilhante que te prende do início ao fim.",
    tags: ["Thriller", "Drama"],
    intensity: 5,
  },
  {
    title: "The Bear",
    type: "series",
    reason: "Intensidade e paixão na cozinha — impossível parar de assistir.",
    tags: ["Drama", "Comédia"],
    intensity: 4,
  },
  {
    title: "Coco",
    type: "movie",
    reason: "Emocionante e colorido, perfeito para toda a família.",
    tags: ["Animação", "Família"],
    intensity: 1,
  },
  {
    title: "Interestelar",
    type: "movie",
    reason: "Épico de ficção científica sobre amor, tempo e exploração.",
    tags: ["Sci-Fi", "Drama"],
    intensity: 5,
  },
  {
    title: "Dark",
    type: "series",
    reason: "Mistério alemão complexo que mexe com viagem no tempo.",
    tags: ["Mistério", "Sci-Fi"],
    intensity: 5,
  },
];

const SwipePage = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seenTitles, setSeenTitles] = useState<Set<string>>(new Set());

  const enrichWithPosters = async (recs: Recommendation[]): Promise<Recommendation[]> => {
    try {
      const { data, error } = await supabase.functions.invoke("enrich-titles", {
        body: { titles: recs.map((r) => ({ title: r.title, type: r.type })) },
      });
      if (error || !data?.results) return recs;
      return recs.map((r, i) => ({ ...r, posterUrl: data.results[i]?.poster_url || r.posterUrl }));
    } catch {
      return recs;
    }
  };

  const loadCards = useCallback(
    async (showToast = false) => {
      setLoading(true);
      setIndex(0);

      // 1) Get already-swiped titles to filter out
      let alreadySeen = new Set<string>();
      if (user) {
        const { data: swiped } = await supabase
          .from("user_swipes")
          .select("title")
          .eq("user_id", user.id);
        alreadySeen = new Set((swiped || []).map((s) => s.title));
        setSeenTitles(alreadySeen);
      }

      // 2) Try IA recommendation
      let pool: Recommendation[] = [];
      try {
        const { data, error } = await supabase.functions.invoke("recommend", {
          body: {
            context: { time: "qualquer", mood: "descobrir", company: "qualquer" },
          },
        });
        if (!error && data && !data.error && Array.isArray(data.recommendations)) {
          pool = data.recommendations
            .map((r: Recommendation) => sanitizeRecommendation(r) as Recommendation)
            .filter((r: Recommendation) => r.title.length > 0);
        }
      } catch {
        // ignore — fallback
      }

      if (pool.length === 0) {
        pool = fallbackRecs;
        if (showToast) toast.message("Usando descobertas offline.");
      }

      // 3) Filter out already-swiped
      const fresh = pool.filter((r) => !alreadySeen.has(r.title));
      const finalList = fresh.length > 0 ? fresh : pool;

      const enriched = await enrichWithPosters(finalList);
      setCards(enriched);
      setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleSwipe = async (liked: boolean) => {
    const current = cards[index];
    if (!current) return;

    setIndex((i) => i + 1);
    setSeenTitles((s) => new Set(s).add(current.title));

    if (!user) return;

    try {
      // Save swipe
      await supabase.from("user_swipes").insert({
        user_id: user.id,
        title: current.title,
        item_type: current.type,
        liked,
      });

      // If liked, also add to watchlist (idempotent attempt)
      if (liked) {
        await supabase.from("watchlist").insert({
          user_id: user.id,
          title: current.title,
          item_type: current.type,
          poster_url: current.posterUrl || null,
        });
        toast.success(`❤️ ${current.title} adicionado à lista`);
      }
    } catch {
      // silently ignore duplicate watchlist inserts etc.
    }
  };

  const remaining = cards.slice(index, index + 3);
  const isFinished = !loading && index >= cards.length;

  return (
    <PageShell>
      <div className="pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={22} className="text-accent" />
          <h1 className="text-display text-2xl">Descobrir</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Arraste para o lado: <span className="text-emerald-500 font-medium">→ gostei</span>,{" "}
          <span className="text-rose-500 font-medium">← passar</span>.
        </p>

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
                onClick={() => loadCards(true)}
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
              onClick={() => handleSwipe(false)}
              className="w-16 h-16 rounded-full bg-card border-2 border-rose-400 flex items-center justify-center shadow-md hover:bg-rose-50 transition-colors"
              aria-label="Não gostei"
            >
              <X size={28} className="text-rose-500" strokeWidth={3} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe(true)}
              className="w-16 h-16 rounded-full bg-card border-2 border-emerald-400 flex items-center justify-center shadow-md hover:bg-emerald-50 transition-colors"
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
      </div>
    </PageShell>
  );
};

export default SwipePage;
