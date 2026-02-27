import { useState, useEffect } from "react";
import { User, Settings, LogOut, ChevronRight, Clapperboard, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).single().then(({ data }) => {
      if (data?.name) setName(data.name);
      else setName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    });
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.id);
    if (error) toast.error("Erro ao salvar nome");
    else toast.success("Nome atualizado!");
    setEditingName(false);
    setSavingName(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <PageShell title="Perfil">
      <div className="flex flex-col items-center py-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-3">
          <User size={36} className="text-muted-foreground" />
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-40 rounded-lg bg-secondary border-0 text-sm text-center"
              autoFocus
            />
            <button onClick={handleSaveName} disabled={savingName} className="p-1.5 rounded-lg text-accent hover:bg-secondary transition-colors">
              <Check size={16} />
            </button>
            <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 mt-1 group">
            <p className="font-display font-semibold">{name || "Usuário"}</p>
            <Pencil size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl touch-target transition-colors text-foreground hover:bg-secondary"
        >
          <Settings size={18} />
          <span className="flex-1 text-left text-sm font-medium">Preferências e streaming</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl touch-target transition-colors text-destructive"
        >
          <LogOut size={18} />
          <span className="flex-1 text-left text-sm font-medium">Sair</span>
        </button>
      </div>
    </PageShell>
  );
};

export default ProfilePage;
