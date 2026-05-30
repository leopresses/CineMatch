import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => (
  <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
    {/* Animated Mesh Gradient Background - Ultra Premium */}
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
      <motion.div 
        animate={{ 
          transform: ['translate(0%, 0%) scale(1)', 'translate(5%, 5%) scale(1.1)', 'translate(-5%, -5%) scale(0.9)', 'translate(0%, 0%) scale(1)'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-200/50 mix-blend-multiply blur-[100px]"
      />
      <motion.div 
        animate={{ 
          transform: ['translate(0%, 0%) scale(1)', 'translate(-5%, 5%) scale(1.1)', 'translate(5%, -5%) scale(0.9)', 'translate(0%, 0%) scale(1)'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-200/50 mix-blend-multiply blur-[100px]"
      />
      <motion.div 
        animate={{ 
          transform: ['translate(0%, 0%) scale(1)', 'translate(5%, -5%) scale(1.1)', 'translate(-5%, 5%) scale(0.9)', 'translate(0%, 0%) scale(1)'],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-200/50 mix-blend-multiply blur-[100px]"
      />
    </div>

    {/* Noise Texture Overlay */}
    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

    <div className="relative z-10 flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
      {/* Topo / Logo centralizado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col items-center justify-center mb-10"
      >
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden mb-6 border border-white/20"
        >
          <img src="/icon.png" alt="CineMatch Logo" className="w-full h-full object-cover" />
        </motion.div>
        
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2 text-center bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500">
          CineMatch
        </h1>
        <p className="text-sm font-medium text-slate-500 text-center max-w-[280px] leading-relaxed">
          O algoritmo inteligente que escolhe o seu próximo filme favorito.
        </p>
      </motion.div>

      {/* Cartão de Login (True Glassmorphism) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-8 space-y-6 border border-white/80 relative z-20"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255,255,255,0.3) inset" }}
      >
        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
