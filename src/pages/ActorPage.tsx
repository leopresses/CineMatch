import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { getPersonDetails, getPersonCredits, genreMap } from "@/lib/tmdb";
import PageShell from "@/components/PageShell";
import useEmblaCarousel from "embla-carousel-react";
import RecommendationCard, { Recommendation } from "@/components/RecommendationCard";
import { toast } from "sonner";
import { motion } from "framer-motion";

const reverseGenreMap = Object.entries(genreMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<number, string>);

const ActorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [person, setPerson] = useState<any>(null);
  const [credits, setCredits] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef] = useEmblaCarousel({ dragFree: true });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const details = await getPersonDetails(Number(id));
        setPerson(details);

        const rawCredits = await getPersonCredits(Number(id));
        
        // Remove duplicates and items without poster
        const uniqueCredits = rawCredits.filter((v: any, i: number, a: any[]) => 
          a.findIndex(t => (t.id === v.id)) === i && v.poster_path
        );

        const mappedCredits: Recommendation[] = uniqueCredits.map((r: any) => ({
          id: r.id,
          title: r.title || r.name,
          type: r.media_type || "movie",
          reason: r.character ? `Personagem: ${r.character}` : "",
          tags: (r.genre_ids || []).map((gid: number) => reverseGenreMap[gid]).filter(Boolean).slice(0, 2),
          intensity: Math.round(r.vote_average / 2) || 3,
          posterUrl: `https://image.tmdb.org/t/p/w500${r.poster_path}`,
        }));

        setCredits(mappedCredits);
      } catch (err) {
        toast.error("Erro ao carregar dados do ator.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!person) return <PageShell>Ator não encontrado.</PageShell>;

  const age = person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;

  return (
    <PageShell>
      <div className="pb-10 -mx-5 -mt-6">
        <div className="relative w-full h-[250px] bg-secondary">
          {person.profile_path ? (
            <img 
              src={`https://image.tmdb.org/t/p/original${person.profile_path}`} 
              alt={person.name} 
              className="w-full h-full object-cover object-top opacity-50 blur-sm"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-10 left-5 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="px-5 -mt-24 relative z-10 space-y-6">
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 rounded-full overflow-hidden shadow-2xl bg-secondary border-4 border-background mb-4"
            >
              {person.profile_path ? (
                <img src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground font-bold">
                  {person.name.charAt(0)}
                </div>
              )}
            </motion.div>
            
            <h1 className="font-display text-2xl font-bold text-center leading-tight">{person.name}</h1>
            <p className="text-sm text-accent font-medium mt-1">{person.known_for_department}</p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-muted-foreground font-medium">
              {person.birthday && (
                <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                  <Calendar size={12}/> {age} anos
                </span>
              )}
              {person.place_of_birth && (
                <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                  <MapPin size={12}/> {person.place_of_birth.split(",").pop()?.trim()}
                </span>
              )}
            </div>
          </div>

          {person.biography && (
            <div>
              <h3 className="font-display font-semibold mb-2">Biografia</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                {person.biography}
              </p>
            </div>
          )}

          <hr className="border-border" />

          {credits.length > 0 && (
            <div>
              <h3 className="font-display font-semibold mb-3">Conhecido(a) por</h3>
              <div className="overflow-hidden -mx-5 px-5" ref={emblaRef}>
                <div className="flex gap-4 pb-4">
                  {credits.map((rec, i) => (
                    <div key={`${rec.id}-${i}`} className="flex-[0_0_85%] min-w-0">
                      <RecommendationCard
                        rec={rec}
                        index={i}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ActorPage;
