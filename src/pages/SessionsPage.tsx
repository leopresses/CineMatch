import { Plus, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

const SessionsPage = () => {
  return (
    <PageShell title="Sessões" subtitle="Assista com amigos">
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full btn-gold flex items-center justify-center gap-2 mb-6"
      >
        <Plus size={18} />
        Criar nova sessão
      </motion.button>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Users size={28} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm mb-1">Nenhuma sessão ainda</p>
        <p className="text-muted-foreground text-xs">
          Crie uma sessão e convide amigos para assistir juntos!
        </p>
      </div>
    </PageShell>
  );
};

export default SessionsPage;
