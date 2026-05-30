import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { validatePassword } from "@/lib/validation";
import AuthLayout from "@/components/AuthLayout";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    const pwError = validatePassword(password);
    if (pwError) { toast.error(pwError); return; }

    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get("oobCode");
    if (!oobCode) {
      toast.error("Link de recuperação inválido ou expirado.");
      setLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Senha atualizada com sucesso!");
      navigate("/login");
    } catch (e) {
      toast.error("Erro ao atualizar senha. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-bold text-center">Nova senha</h2>
      <p className="text-sm text-muted-foreground text-center">Defina sua nova senha abaixo.</p>

      <div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReset()}
            placeholder="Nova senha"
            className="pl-10 pr-10 h-12 rounded-xl bg-secondary border-0 text-base"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-1">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Mínimo 8 caracteres, 1 letra e 1 número</p>
      </div>

      <button onClick={handleReset} disabled={loading} className="w-full btn-gold text-base h-12 disabled:opacity-50">
        {loading ? "Atualizando..." : "Atualizar senha"}
      </button>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
