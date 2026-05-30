import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => (
  <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
    {/* Bolhas Animadas de Fundo para dar "Vida" */}
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[10%] -left-[20%] w-[80vw] h-[80vw] rounded-full bg-accent/20 blur-[80px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          rotate: [0, -90, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[30%] -right-[30%] w-[70vw] h-[70vw] rounded-full bg-blue-500/10 blur-[80px]"
      />
    </div>

    <div className="relative z-10 flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
      {/* Topo / Logo centralizado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col items-center justify-center mb-8"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-card rounded-3xl shadow-xl flex items-center justify-center mb-5 border border-border/50"
        >
          <img src="/icon.png" alt="CineMatch Logo" className="w-16 h-16 object-contain drop-shadow-md" />
        </motion.div>
        
        <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight mb-2 text-center">
          CineMatch
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-[280px]">
          O algoritmo inteligente que escolhe o seu próximo filme favorito.
        </p>
      </motion.div>

      {/* Cartão Branco de Login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-[2rem] p-7 space-y-5 border border-border/50 relative z-20"
        style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}
      >
        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
