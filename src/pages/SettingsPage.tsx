import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

const allGenres = [
  "Ação", "Aventura", "Animação", "Comédia", "Crime", "Documentário",
  "Drama", "Família", "Fantasia", "Ficção Científica", "Guerra",
  "Horror", "Mistério", "Musical", "Romance", "Suspense", "Terror", "Western",
];

const allServices = [
  "Netflix", "Prime Video", "Disney+", "HBO Max", "Apple TV+",
  "Globoplay", "Star+", "Paramount+", "Crunchyroll", "YouTube Premium",
];

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [dislikedGenres, setDislikedGenres] = useState<string[]>([]);
  const [streamingServices, setStreamingServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      const docSnap = await getDoc(doc(db, "user_preferences", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFavoriteGenres(data.favorite_genres || []);
        setDislikedGenres(data.disliked_genres || []);
        setStreamingServices(data.streaming_services || []);
      }
      setLoading(false);
    };
    fetchPrefs();
  }, [user]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      favorite_genres: favoriteGenres,
      disliked_genres: dislikedGenres,
      streaming_services: streamingServices,
    };
    try {
      await setDoc(doc(db, "user_preferences", user.uid), payload, { merge: true });
      toast.success("Preferências salvas!");
    } catch {
      toast.error("Erro ao salvar preferências");
    }
    setSaving(false);
  };

  const ChipGrid = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (s: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = selected.includes(item);
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all touch-target ${
              isActive ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {isActive && <Check size={14} />}
            {item}
          </button>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <PageShell title="Configurações">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-shimmer" />)}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Configurações" subtitle="Personalize suas recomendações">
      <div className="space-y-6 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-target">
          <ArrowLeft size={16} />
          Voltar
        </button>

        <section>
          <h3 className="font-display font-semibold text-sm mb-3">🎬 Gêneros favoritos</h3>
          <ChipGrid items={allGenres} selected={favoriteGenres} onToggle={(g) => toggleItem(favoriteGenres, setFavoriteGenres, g)} />
        </section>

        <section>
          <h3 className="font-display font-semibold text-sm mb-3">🚫 Gêneros a evitar</h3>
          <ChipGrid items={allGenres} selected={dislikedGenres} onToggle={(g) => toggleItem(dislikedGenres, setDislikedGenres, g)} />
        </section>

        <section>
          <h3 className="font-display font-semibold text-sm mb-3">📺 Serviços de streaming</h3>
          <ChipGrid items={allServices} selected={streamingServices} onToggle={(s) => toggleItem(streamingServices, setStreamingServices, s)} />
        </section>

        <button onClick={handleSave} disabled={saving} className="w-full btn-gold text-base h-12 disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar preferências"}
        </button>
      </div>
    </PageShell>
  );
};

export default SettingsPage;
