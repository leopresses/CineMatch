import { User, Settings, LogOut, ChevronRight, Clapperboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    { label: "Preferências de conteúdo", icon: Settings, onClick: () => {} },
    { label: "Serviços de streaming", icon: Clapperboard, onClick: () => {} },
    { label: "Sair", icon: LogOut, danger: true, onClick: handleLogout },
  ];

  return (
    <PageShell title="Perfil">
      <div className="flex flex-col items-center py-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-3">
          <User size={36} className="text-muted-foreground" />
        </div>
        <p className="font-display font-semibold">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl touch-target transition-colors ${
              item.danger ? "text-destructive" : "text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon size={18} />
            <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
            {!item.danger && <ChevronRight size={16} className="text-muted-foreground" />}
          </button>
        ))}
      </div>
    </PageShell>
  );
};

export default ProfilePage;
