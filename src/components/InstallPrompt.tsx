import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InstallPrompt = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado (rodando como app independente)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isStandaloneMode);

    if (isStandaloneMode) return;

    // Detecta se é dispositivo iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // No Android (Chrome), o navegador dispara esse evento quando o app é instalável
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // Impede o mini-infobar padrão de aparecer na hora
      setDeferredPrompt(e);
      
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    });

    // No iOS não existe o evento beforeinstallprompt, então forçamos um aviso visual
    if (isIOSDevice) {
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 z-[100] bg-card border border-border/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-3"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}
        >
          <button onClick={handleDismiss} className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-white transition-colors">
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 pr-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
              <Download className="text-accent" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Instalar Aplicativo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione o CineMatch à sua tela inicial para acessar rápido e sem baixar nada pela loja.
              </p>
            </div>
          </div>

          {isIOS ? (
            <div className="bg-secondary/40 rounded-lg p-3 text-xs flex flex-col gap-2 mt-1 border border-border/30">
              <p className="flex items-center gap-2">
                1. Toque no ícone de Compartilhar <Share size={14} className="text-blue-500" /> no Safari.
              </p>
              <p className="flex items-center gap-2">
                2. Escolha "Adicionar à Tela de Início" <PlusSquare size={14} className="text-white" />
              </p>
            </div>
          ) : deferredPrompt ? (
            <button onClick={handleInstall} className="btn-gold w-full h-10 text-sm mt-1 font-semibold">
              Instalar Agora
            </button>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
