import { useLocation, useNavigate } from "react-router-dom";
import { Home, Flame, Users, User, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/swipe", icon: Flame, label: "Descobrir" },
  { path: "/watchlist", icon: Bookmark, label: "Lista" },
  { path: "/sessions", icon: Users, label: "Sessões" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/auth", "/privacy", "/terms"];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-surface bottom-safe md:hidden" style={{ boxShadow: "var(--shadow-nav)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 touch-target px-3 py-1 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={isActive ? "text-accent" : "text-muted-foreground"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
