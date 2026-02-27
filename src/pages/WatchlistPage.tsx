import { Bookmark } from "lucide-react";
import PageShell from "@/components/PageShell";

const WatchlistPage = () => (
  <PageShell title="Minha Lista" subtitle="Seus filmes e séries salvos">
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Bookmark size={28} className="text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm mb-1">Sua lista está vazia</p>
      <p className="text-muted-foreground text-xs">
        Salve recomendações para assistir depois
      </p>
    </div>
  </PageShell>
);

export default WatchlistPage;
