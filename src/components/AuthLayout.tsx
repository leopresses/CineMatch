import { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => (
  <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
    <div className="flex-1 flex flex-col justify-end px-5 pb-8 pt-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <Clapperboard size={28} className="text-gold" />
          <span className="font-display text-2xl font-bold text-primary-foreground">NextWatch</span>
        </div>
        <p className="text-sm text-primary-foreground/70">Sua próxima sessão começa aqui</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl p-6 space-y-5"
        style={{ boxShadow: "var(--shadow-card-hover)" }}
      >
        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
