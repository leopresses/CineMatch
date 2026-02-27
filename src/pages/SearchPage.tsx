import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageShell from "@/components/PageShell";

const SearchPage = () => {
  const [query, setQuery] = useState("");

  return (
    <PageShell title="Buscar" subtitle="Encontre filmes e séries">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar título..."
          className="pl-10 h-12 rounded-xl bg-secondary border-0 text-base"
        />
      </div>

      {!query && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Search size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            Digite o nome de um filme ou série para buscar
          </p>
        </div>
      )}
    </PageShell>
  );
};

export default SearchPage;
