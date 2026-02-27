import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) { toast.error("Informe seu email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Se o email estiver cadastrado, você receberá um link de recuperação.");
    } catch {
      // Generic message for security
      toast.success("Se o email estiver cadastrado, você receberá um link de recuperação.");
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-bold text-center">Recuperar senha</h2>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <Mail size={28} className="text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            Verifique sua caixa de entrada. Se o email estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <Link to="/login" className="block text-accent font-medium text-sm">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground text-center">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Email"
              className="pl-10 h-12 rounded-xl bg-secondary border-0 text-base"
            />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full btn-gold text-base h-12 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" /> : "Enviar link"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link to="/login" className="text-accent font-medium">Entrar</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
