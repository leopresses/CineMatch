import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";

const menuItems = [
  { label: "Preferências de conteúdo", icon: Settings },
  { label: "Serviços de streaming", icon: Settings },
  { label: "Sair", icon: LogOut, danger: true },
];

const ProfilePage = () => (
  <PageShell title="Perfil">
    <div className="flex flex-col items-center py-6 mb-6">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-3">
        <User size={36} className="text-muted-foreground" />
      </div>
      <p className="font-display font-semibold">Usuário</p>
      <p className="text-sm text-muted-foreground">Faça login para personalizar</p>
    </div>

    <div className="space-y-1">
      {menuItems.map((item) => (
        <button
          key={item.label}
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

export default ProfilePage;
