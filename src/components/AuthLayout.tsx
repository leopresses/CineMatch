import { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => (
  <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200" 
        alt="Cinema" 
        className="w-full h-full object-cover opacity-40 blur-[2px] scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
      
      {/* Refletor animado no topo (Spotlight) */}
      <motion.div 
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[90%] h-[500px] bg-accent/40 rounded-[100%] blur-[100px] pointer-events-none" 
      />

      {/* Partículas de "poeira" cinemática flutuando */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
          }}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            y: -100,
            opacity: [0, Math.random() * 0.5 + 0.3, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>

    <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-8 pt-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-md mb-4 border border-accent/20 shadow-lg shadow-accent/20">
          <Clapperboard size={32} className="text-accent" />
        </div>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight mb-2">CineMatch</h1>
        <p className="text-sm text-white/70 max-w-[280px] mx-auto leading-relaxed">
          O algoritmo inteligente que escolhe o seu próximo filme favorito.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/70 backdrop-blur-xl rounded-[2rem] p-7 space-y-5 border border-white/10"
        style={{ boxShadow: "0 -10px 40px rgba(0,0,0,0.3)" }}
      >
        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
