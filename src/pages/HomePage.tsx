import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clapperboard, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import MoodSelector from "@/components/MoodSelector";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";

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
];

const HomePage = () => {
  const { user } = useAuth();

  const [mood, setMood] = useState({ time: "", mood: "", company: "" });
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const stepsDone = useMemo(() => {
    let n = 0;
    if (mood.time) n += 1;
    if (mood.mood) n += 1;
    if (mood.company) n += 1;
    return n;
  }, [mood]);

  const canRecommend = stepsDone === 3;

  const enrichWithPosters = async (recommendations: Recommendation[]): Promise<Recommendation[]> => {
    try {
      const { data, error } = await supabase.functions.invoke("enrich-titles", {
        body: { titles: recommendations.map((r) => ({ title: r.title, type: r.type })) },
      });

      if (error || !data?.results) return recommendations;

      return recommendations.map((rec, i) => ({
        ...rec,
        posterUrl: data.results[i]?.poster_url || rec.posterUrl,
      }));
    } catch {
      return recommendations;
    }
  };

  const handleRecommend = async () => {
    setLoading(true);
    setRecs(null);

    try {
      const { data, error } = await supabase.functions.invoke("recommend", {
        body: { context: mood },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        setRecs(await enrichWithPosters(fallbackRecs));
      } else {
        const result = data.recommendations || [];
        const final = result.length > 0 ? result : fallbackRecs;
        setRecs(await enrichWithPosters(final));
      }
    } catch {
      toast.error("Usando recomendações offline. A IA estará disponível em breve.");
      setRecs(await enrichWithPosters(fallbackRecs));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rec: Recommendation) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("watchlist").insert({
        user_id: user.id,
        item_type: rec.type,
        title: rec.title,
        poster_url: rec.posterUrl || null,
      });

      if (error) throw error;
      toast.success(`"${rec.title}" salvo na sua lista!`);
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const handleReset = () => {
    setMood({ time: "", mood: "", company: "" });
    setRecs(null);
  };

  return (
    <PageShell>
      <div className="space-y-5 pb-6">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl px-5 py-5 text-primary-foreground"
          style={{ background: "var(--gradient-midnight)" }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clapperboard size={20} className="text-gold" />
                <span className="text-xs font-medium text-gold-light tracking-wide uppercase">NextWatch</span>
              </div>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Limpar seleção"
                type="button"
              >
                <RotateCcw size={14} />
                Limpar
              </button>
            </div>

            <h1 className="font-display text-xl font-bold leading-tight mt-2">O que vamos assistir hoje?</h1>
            <p className="text-sm mt-1 opacity-80">Escolha tempo, humor e companhia — eu te dou o match.</p>

            {/* Progress */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-28 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(stepsDone / 3) * 100}%` }}
                  />
                </div>
                <span className="text-xs opacity-80">{stepsDone}/3</span>
              </div>

              <div className="text-xs opacity-70">{!canRecommend ? "Faltam escolhas" : "Pronto pra recomendar"}</div>
            </div>
          </div>

          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-gold/10 blur-3xl" />
        </motion.section>

        {/* SELETORES */}
        <section className="rounded-2xl border bg-card/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-display text-base">Seu momento</h2>
              <p className="text-xs text-muted-foreground">Isso deixa a recomendação bem mais certeira.</p>
            </div>
          </div>

          <MoodSelector selected={mood} onChange={(key, value) => setMood((p) => ({ ...p, [key]: value }))} />
        </section>

        {/* CTA (sticky acima da bottom nav) */}
        <div className="sticky bottom-24 z-20">
          <div className="rounded-2xl border bg-background/80 backdrop-blur p-3 shadow-lg">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRecommend}
              disabled={!canRecommend || loading}
              className="w-full btn-gold flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Me recomenda agora
                </>
              )}
            </motion.button>

            {!canRecommend && (
              <p className="text-[12px] text-muted-foreground mt-2 px-1">
                Selecione <span className="font-medium">tempo</span>, <span className="font-medium">humor</span> e{" "}
                <span className="font-medium">companhia</span> para liberar o botão.
              </p>
            )}
          </div>
        </div>

        {/* RESULTADOS */}
        <AnimatePresence>
          {recs && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-10">
              <div className="flex items-end justify-between">
                <h3 className="text-display text-lg">Recomendações pra você</h3>
                <span className="text-xs text-muted-foreground">{recs.length} opções</span>
              </div>

              {recs.map((rec, i) => (
                <RecommendationCard
                  key={`${rec.title}-${rec.type}`}
                  rec={rec}
                  index={i}
                  onSave={() => handleSave(rec)}
                />
              ))}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default HomePage;
