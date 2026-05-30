import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (e) {
      toast.error("Email ou senha incorretos. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (provider === "apple") {
      toast.error("Login com Apple temporariamente indisponível.");
      return;
    }
    try {
      const providerObj = new GoogleAuthProvider();
      await signInWithPopup(auth, providerObj);
      navigate("/home");
    } catch (e) {
      toast.error("Erro ao conectar. Tente novamente.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-bold text-center">Entrar</h2>

      <div className="space-y-2.5">
        <button onClick={() => handleOAuth("google")} className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border font-medium text-sm hover:bg-secondary transition-colors touch-target">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar com Google
        </button>
        <button onClick={() => handleOAuth("apple")} className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border font-medium text-sm hover:bg-secondary transition-colors touch-target">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continuar com Apple
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder="Email" className="pl-10 h-12 rounded-xl bg-secondary border-0 text-base" />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Senha" className="pl-10 pr-10 h-12 rounded-xl bg-secondary border-0 text-base" />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-1">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <Link to="/forgot-password" className="block text-xs text-accent font-medium text-right">
        Esqueci minha senha
      </Link>

      <button onClick={handleLogin} disabled={loading} className="w-full btn-gold text-base h-12 disabled:opacity-50">
        {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" /> : "Entrar"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link to="/register" className="text-accent font-medium">Criar conta</Link>
      </p>

      <p className="text-center text-[10px] text-muted-foreground">
        Ao continuar, você concorda com os{" "}
        <Link to="/terms" className="underline">Termos de Uso</Link> e{" "}
        <Link to="/privacy" className="underline">Política de Privacidade</Link>.
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
