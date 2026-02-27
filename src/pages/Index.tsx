import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clapperboard } from "lucide-react";
import PageShell from "@/components/PageShell";
import MoodSelector from "@/components/MoodSelector";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";

const mockRecommendations: Recommendation[] = [
  { title: "Tudo em Todo Lugar ao Mesmo Tempo", type: "movie", reason: "Uma aventura criativa e emocionante perfeita para o seu humor.", tags: ["Ação", "Comédia", "Sci-Fi"], intensity: 4 },
  { title: "Fleabag", type: "series", reason: "Humor inteligente e tocante para quando você quer algo leve.", tags: ["Comédia", "Drama"], intensity: 2 },
  { title: "Parasita", type: "movie", reason: "Suspense brilhante que te prende do início ao fim.", tags: ["Thriller", "Drama", "Suspense"], intensity: 5 },
];

const HomePage = () => {
  const [mood, setMood] = useState({ time: "", mood: "", company: "" });
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const canRecommend = mood.time && mood.mood && mood.company;

  const handleRecommend = async () => {
    setLoading(true);
    // TODO: Replace with real AI call
    await new Promise((r) => setTimeout(r, 1200));
    setRecs(mockRecommendations);
    setLoading(false);
  };

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Hero section */}
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
            <h2 className="font-display text-xl font-bold leading-tight">
              O que vamos assistir hoje?
            </h2>
            <p className="text-sm mt-1 opacity-80">
              Conte como você está e a IA encontra o match perfeito.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />
        </motion.div>

        {/* Mood selector */}
        <MoodSelector
          selected={mood}
          onChange={(key, value) => setMood((p) => ({ ...p, [key]: value }))}
        />

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRecommend}
          disabled={!canRecommend || loading}
          className={`w-full btn-gold flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed`}
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

        {/* Results */}
        <AnimatePresence>
          {recs && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 pb-4"
            >
              <h3 className="text-display text-lg">Recomendações pra você</h3>
              {recs.map((rec, i) => (
                <RecommendationCard key={rec.title} rec={rec} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default HomePage;
