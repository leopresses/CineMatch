import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Erro ao atualizar senha. Tente novamente.");
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <PageShell title="Nova senha" subtitle="Defina sua nova senha">
      <div className="space-y-4 mt-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha (mín. 8 caracteres)"
            className="pl-10 h-12 rounded-xl bg-secondary border-0 text-base"
          />
        </div>
        <button onClick={handleReset} disabled={loading} className="w-full btn-gold text-base h-12 disabled:opacity-50">
          {loading ? "Atualizando..." : "Atualizar senha"}
        </button>
      </div>
    </PageShell>
  );
};

export default ResetPasswordPage;
