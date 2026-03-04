import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clapperboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import MoodSelector from "@/components/MoodSelector";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";

const fallbackRecs: Recommendation[] = [
  { title: "Tudo em Todo Lugar ao Mesmo Tempo", type: "movie", reason: "Uma aventura criativa e emocionante perfeita para qualquer momento.", tags: ["Ação", "Comédia", "Sci-Fi"], intensity: 4 },
  { title: "Fleabag", type: "series", reason: "Humor inteligente e tocante para quando você quer algo leve.", tags: ["Comédia", "Drama"], intensity: 2 },
  { title: "Parasita", type: "movie", reason: "Suspense brilhante que te prende do início ao fim.", tags: ["Thriller", "Drama"], intensity: 5 },
  { title: "The Bear", type: "series", reason: "Intensidade e paixão na cozinha — impossível parar de assistir.", tags: ["Drama", "Comédia"], intensity: 4 },
  { title: "Coco", type: "movie", reason: "Emocionante e colorido, perfeito para toda a família.", tags: ["Animação", "Família"], intensity: 1 },
];

const HomePage = () => {
  const { user } = useAuth();
  const [mood, setMood] = useState({ time: "", mood: "", company: "" });
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const canRecommend = mood.time && mood.mood && mood.company;

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

  return (
    <PageShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground"
          style={{ background: "var(--gradient-midnight)" }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Clapperboard size={20} className="text-gold" />
              <span className="text-xs font-medium text-gold-light tracking-wide uppercase">NextWatch</span>
            </div>
            <h1 className="font-display text-xl font-bold leading-tight">O que vamos assistir hoje?</h1>
            <p className="text-sm mt-1 opacity-80">Conte como você está e a IA encontra o match perfeito.</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />
        </motion.div>

        <MoodSelector selected={mood} onChange={(key, value) => setMood((p) => ({ ...p, [key]: value }))} />

        <motion.button
          whileTap={{ scale: 0.97 }}
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

        <AnimatePresence>
          {recs && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pb-4">
              <h3 className="text-display text-lg">Recomendações pra você</h3>
              {recs.map((rec, i) => (
                <RecommendationCard key={rec.title} rec={rec} index={i} onSave={() => handleSave(rec)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default HomePage;
