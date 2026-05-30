import { useLocation, useNavigate } from "react-router-dom";
import { Home, Flame, Users, User, Bookmark, Search, Settings, LogOut, Clapperboard, Library } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/swipe", icon: Flame, label: "Descobrir" },
  { path: "/watchlist", icon: Bookmark, label: "Minha Lista" },
  { path: "/sessions", icon: Users, label: "Sessões" },
  { path: "/collections", icon: Library, label: "Coleções" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/auth", "/privacy", "/terms"];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="hidden md:flex flex-col w-64 h-full glass-surface border-r border-border/50 bg-card/60 z-50 p-6">
      <div className="flex items-center gap-2 mb-12">
        <Clapperboard size={28} className="text-gold" />
        <span className="font-display font-bold text-xl tracking-tight text-foreground">CineMatch</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-secondary/50 group"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={`transition-colors ${isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-sm font-semibold transition-colors ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;
