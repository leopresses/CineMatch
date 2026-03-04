import { useState, useEffect } from "react";
import { ArrowLeft, Check, Download, RotateCcw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  // Backup state
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load preferences
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFavoriteGenres(data.favorite_genres || []);
        setDislikedGenres(data.disliked_genres || []);
        setStreamingServices(data.streaming_services || []);
      }
      setLoading(false);
    });
    // Load last backup date
    supabase.from("user_backups").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (data) setLastBackupDate(data.created_at);
    });
  }, [user]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      favorite_genres: favoriteGenres,
      disliked_genres: dislikedGenres,
      streaming_services: streamingServices,
    };
    const { data: existing } = await supabase.from("user_preferences").select("user_id").eq("user_id", user.id).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("user_preferences").update(payload).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("user_preferences").insert(payload));
    }
    if (error) toast.error("Erro ao salvar preferências");
    else toast.success("Preferências salvas!");
    setSaving(false);
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-create");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastBackupDate(data.backup?.created_at || new Date().toISOString());
      toast.success("Backup criado com sucesso!");
    } catch {
      toast.error("Erro ao criar backup. Tente novamente.");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestore = async () => {
    setRestoringBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-restore");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Backup restaurado com sucesso! Recarregando dados...");
      // Reload preferences
      const { data: prefs } = await supabase.from("user_preferences").select("*").eq("user_id", user!.id).maybeSingle();
      if (prefs) {
        setFavoriteGenres(prefs.favorite_genres || []);
        setDislikedGenres(prefs.disliked_genres || []);
        setStreamingServices(prefs.streaming_services || []);
      }
    } catch {
      toast.error("Erro ao restaurar backup.");
    } finally {
      setRestoringBackup(false);
      setShowRestoreConfirm(false);
    }
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
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}
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

        {/* Backup section */}
        <section className="border-t border-border pt-6">
          <h3 className="font-display font-semibold text-sm mb-1">💾 Backup da conta</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Salve suas preferências e lista para restaurar depois.
          </p>

          {lastBackupDate && (
            <p className="text-xs text-muted-foreground mb-3">
              Último backup: {new Date(lastBackupDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors touch-target disabled:opacity-50"
            >
              {creatingBackup ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {creatingBackup ? "Criando..." : "Criar backup"}
            </button>
            <button
              onClick={() => setShowRestoreConfirm(true)}
              disabled={!lastBackupDate || restoringBackup}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors touch-target disabled:opacity-50"
            >
              {restoringBackup ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              {restoringBackup ? "Restaurando..." : "Restaurar"}
            </button>
          </div>

          {/* Restore confirmation */}
          {showRestoreConfirm && (
            <div className="mt-3 card-cinema border border-destructive/20">
              <p className="text-sm font-medium mb-2">⚠️ Restaurar backup?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Seus dados atuais (lista, preferências) serão substituídos pelo backup.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRestore}
                  disabled={restoringBackup}
                  className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
                >
                  {restoringBackup ? "Restaurando..." : "Confirmar"}
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="flex-1 h-10 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
};

export default SettingsPage;
