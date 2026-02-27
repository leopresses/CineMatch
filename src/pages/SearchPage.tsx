import { useState } from "react";
import { Search, Plus, Film, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";

const SearchPage = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState<"movie" | "series">("movie");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("Informe o título"); return; }
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("watchlist").insert({
        user_id: user.id,
        item_type: itemType,
        title: title.trim(),
      });
      if (error) throw error;
      toast.success(`"${title}" adicionado à sua lista!`);
      setTitle("");
      setShowAddForm(false);
    } catch {
      toast.error("Erro ao adicionar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="Buscar" subtitle="Encontre filmes e séries">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do filme ou série"
                  className="h-12 rounded-xl bg-secondary border-0 text-base"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setItemType("movie")}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all ${
                      itemType === "movie" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Film size={16} />
                    Filme
                  </button>
                  <button
                    onClick={() => setItemType("series")}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all ${
                      itemType === "series" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Tv size={16} />
                    Série
                  </button>
                </div>
                <button onClick={handleAdd} disabled={saving} className="w-full btn-gold text-sm h-11 disabled:opacity-50">
                  {saving ? "Salvando..." : "Adicionar à lista"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!query && !showAddForm && (
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
