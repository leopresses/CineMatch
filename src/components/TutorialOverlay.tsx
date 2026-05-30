import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flame, Users, Settings, ArrowRight, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  {
    icon: <Sparkles size={40} className="text-accent" />,
    title: "Bem-vindo ao NextWatch",
    desc: "A inteligência artificial que escolhe o seu próximo filme favorito de acordo com o seu humor.",
  },
  {
    icon: <Flame size={40} className="text-rose-500" />,
    title: "Dê Match (Swipe)",
    desc: "Arraste para os lados! O algoritmo aprende o seu gosto a cada curtida para te dar recomendações cada vez melhores.",
  },
  {
    icon: <Users size={40} className="text-emerald-500" />,
    title: "Sessões com Amigos",
    desc: "Crie uma sessão, envie o link no grupo do WhatsApp e veja qual filme deu 'Match' entre todos vocês!",
  },
  {
    icon: <Settings size={40} className="text-blue-500" />,
    title: "Filtros Premium",
    desc: "Vá nas Configurações e marque os seus serviços de streaming. Nós só vamos te recomendar filmes que você realmente pode assistir!",
  }
];

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      if (user && profile) {
        setSaving(true);
        try {
          await updateDoc(doc(db, "profiles", user.uid), { has_seen_tutorial: true });
        } catch (e) {
          console.error("Erro ao salvar tutorial status", e);
        }
      }
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-secondary border border-border p-8 rounded-3xl w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative"
        >
          {step > 0 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground text-sm"
            >
              Voltar
            </button>
          )}

          <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-inner mt-4">
            {steps[step].icon}
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">{steps[step].title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {steps[step].desc}
          </p>
          
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent" : "w-2 bg-muted"}`} />
            ))}
          </div>

          <button 
            onClick={handleNext}
            disabled={saving}
            className="btn-gold w-full flex items-center justify-center gap-2 h-12"
          >
            {step === steps.length - 1 ? (
              <><Check size={18} /> Começar</>
            ) : (
              <>Próximo <ArrowRight size={18} /></>
            )}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
