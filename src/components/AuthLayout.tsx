import { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => (
  <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
    {/* Fundo Cinemático com Imagem */}
    <div className="absolute inset-0 z-0">
      <img 
        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200" 
        alt="Cinema" 
        className="w-full h-full object-cover opacity-40 blur-[2px] scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
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
