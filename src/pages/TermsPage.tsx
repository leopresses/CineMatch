import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <PageShell title="Termos de Uso">
      <div className="space-y-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-target">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="prose prose-sm max-w-none text-foreground">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <strong>Última atualização:</strong> Fevereiro de 2026
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">1. Aceitação dos Termos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao utilizar o NextWatch, você concorda com estes termos de uso. Se não concordar, por favor não utilize o aplicativo.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">2. Descrição do Serviço</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O NextWatch é uma plataforma que utiliza inteligência artificial para recomendar filmes e séries, além de permitir a criação de sessões para assistir com amigos.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">3. Conta do Usuário</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você é responsável por manter a segurança da sua conta. Não compartilhe suas credenciais de acesso. Notifique-nos imediatamente sobre qualquer uso não autorizado.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">4. Uso Aceitável</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você concorda em usar o serviço de forma ética e legal. É proibido tentar acessar dados de outros usuários ou interferir no funcionamento do serviço.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">5. Recomendações por IA</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As recomendações são geradas por inteligência artificial e podem não ser perfeitas. Não nos responsabilizamos pelo conteúdo recomendado por serviços de terceiros.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">6. Modificações</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor após publicação no aplicativo.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">7. Contato</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para dúvidas sobre estes termos, entre em contato pelo email: legal@nextwatch.app
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default TermsPage;
