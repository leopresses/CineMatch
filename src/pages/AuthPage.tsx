import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Clapperboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha";

  const handleEmailAuth = async () => {
    if (!email) return toast.error("Informe seu email");
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Link de recuperação enviado! Verifique seu email.");
        setMode("login");
      } else if (mode === "signup") {
        if (password.length < 8) {
          toast.error("A senha deve ter no mínimo 8 caracteres");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (e: any) {
      toast.error("Erro na autenticação. Verifique seus dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Erro ao conectar. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao conectar. Tente novamente.");
    }
  };

  return (
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
          <h2 className="font-display text-xl font-bold text-center">{title}</h2>

          {mode !== "forgot" && (
            <>
              <div className="space-y-2.5">
                <button
                  onClick={() => handleOAuth("google")}
                  className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border font-medium text-sm hover:bg-secondary transition-colors touch-target"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continuar com Google
                </button>
                <button
                  onClick={() => handleOAuth("apple")}
                  className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border font-medium text-sm hover:bg-secondary transition-colors touch-target"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Continuar com Apple
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="pl-10 h-12 rounded-xl bg-secondary border-0 text-base" />
          </div>

          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="pl-10 pr-10 h-12 rounded-xl bg-secondary border-0 text-base"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-target flex items-center justify-center">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {mode === "login" && (
            <button onClick={() => setMode("forgot")} className="text-xs text-accent font-medium w-full text-right">
              Esqueci minha senha
            </button>
          )}

          <button onClick={handleEmailAuth} disabled={loading} className="w-full btn-gold text-base h-12 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" /> : title}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Não tem conta?{" "}<button onClick={() => setMode("signup")} className="text-accent font-medium">Criar conta</button></>
            ) : (
              <>Já tem conta?{" "}<button onClick={() => setMode("login")} className="text-accent font-medium">Entrar</button></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
