import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clapperboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";
import MoodSelector from "@/components/MoodSelector";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";

const HomePage = () => {
  const [mood, setMood] = useState({ time: "", mood: "", company: "" });
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const canRecommend = mood.time && mood.mood && mood.company;

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
      } else {
        setRecs(data.recommendations || []);
      }
    } catch (e: any) {
      toast.error("Erro ao buscar recomendações. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rec: Recommendation) => {
    try {
      const { error } = await supabase.from("watchlist").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        item_type: rec.type,
        title: rec.title,
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
            <h2 className="font-display text-xl font-bold leading-tight">O que vamos assistir hoje?</h2>
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
              {recs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma recomendação encontrada. Tente outros filtros.</p>}
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
