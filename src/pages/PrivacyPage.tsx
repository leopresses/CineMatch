import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <PageShell title="Política de Privacidade">
      <div className="space-y-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-target">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="prose prose-sm max-w-none text-foreground">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <strong>Última atualização:</strong> Fevereiro de 2026
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">1. Informações que coletamos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Coletamos informações que você nos fornece diretamente, como nome, email e preferências de conteúdo. Também coletamos dados de uso do aplicativo para melhorar a experiência.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">2. Como usamos suas informações</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Suas informações são utilizadas para personalizar recomendações, gerenciar sua conta, facilitar sessões com amigos e melhorar nossos serviços.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">3. Compartilhamento de dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Não vendemos suas informações pessoais. Compartilhamos dados apenas com provedores de serviço essenciais (autenticação, hospedagem) e quando exigido por lei.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">4. Segurança</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Utilizamos criptografia e controles de acesso para proteger seus dados. Todas as comunicações são feitas via HTTPS e os dados são armazenados com isolamento por usuário.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">5. Seus direitos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você pode acessar, corrigir ou excluir seus dados a qualquer momento através das configurações do perfil, ou entrando em contato conosco.
          </p>

          <h2 className="font-display text-base font-semibold mt-6 mb-2">6. Contato</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para dúvidas sobre esta política, entre em contato pelo email: privacidade@nextwatch.app
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default PrivacyPage;
