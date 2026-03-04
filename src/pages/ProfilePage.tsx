import { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut, ChevronRight, Pencil, Check, X, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single().then(({ data }) => {
      if (data?.name) setName(data.name);
      else setName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Use JPG, PNG ou WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <PageShell title="Perfil">
      <div className="flex flex-col items-center py-6 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-muted-foreground" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md hover:brightness-110 transition-all"
          >
            {uploadingAvatar ? (
              <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            ) : (
              <Camera size={14} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mt-3">
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
          <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 mt-3 group">
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
