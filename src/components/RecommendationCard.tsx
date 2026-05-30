import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, Star, Film, Tv, Play, ExternalLink, Flame } from "lucide-react";
import TrailerModal from "./TrailerModal";
import { getWatchProviders, getTrailer } from "@/lib/tmdb";
import { Link } from "react-router-dom";

export interface Recommendation {
  id?: number;
  title: string;
  type: "movie" | "series";
  reason: string;
  tags: string[];
  intensity: number;
  posterUrl?: string;
  youtubeVideoId?: string;
}

interface Props {
  rec: Recommendation;
  index: number;
  onSave?: () => void;
  highMatch?: boolean;
}

const RecommendationCard = ({ rec, index, onSave, highMatch }: Props) => {
  const [imgError, setImgError] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (rec.id) {
      getWatchProviders(rec.id, rec.type).then(setProviders).catch(() => {});
      getTrailer(rec.id, rec.type).then(url => {
        if(url) {
          const videoId = url.split("v=")[1];
          setTrailerUrl(videoId);
        }
      }).catch(() => {});
    }
  }, [rec.id, rec.type]);

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.title + " trailer")}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        className="card-cinema flex gap-3 items-start"
      >
        <Link to={`/title/${rec.type}/${rec.id}`} className="w-20 h-28 rounded-lg bg-gradient-to-br from-secondary to-muted flex-shrink-0 flex items-center justify-center overflow-hidden block">
          {rec.posterUrl && !imgError ? (
            <img
              src={rec.posterUrl}
              alt={rec.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground p-1 text-center hover:scale-105 transition-transform">
              {rec.type === "movie" ? <Film size={20} /> : <Tv size={20} />}
              <span className="text-[9px] leading-tight">Sem imagem</span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/title/${rec.type}/${rec.id}`} className="hover:underline">
                <h3 className="font-display font-semibold text-sm leading-tight">{rec.title}</h3>
              </Link>
              {highMatch && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                  <Flame size={10} className="fill-accent" />
                  Alta chance de você gostar
                </span>
              )}
            </div>
            <button onClick={onSave} className="touch-target flex items-center justify-center p-1 -mr-1 text-muted-foreground hover:text-accent transition-colors">
              <Bookmark size={18} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.reason}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {rec.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                {tag}
              </span>
            ))}
            <div className="flex items-center gap-0.5 ml-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < rec.intensity ? "text-accent fill-accent" : "text-border"}
                />
              ))}
            </div>
          </div>

          {providers.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground mr-1">Onde assistir:</span>
              {providers.slice(0, 4).map((p: any) => (
                <img key={p.provider_id} src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-4 h-4 rounded-full" title={p.provider_name} />
              ))}
            </div>
          )}
          {/* Trailer buttons */}
          <div className="flex items-center gap-2 mt-2">
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
            >
              <Play size={12} />
              Trailer
              <ExternalLink size={10} />
            </a>
            {trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                <Play size={12} />
                Ver Trailer
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {trailerUrl && (
        <TrailerModal
          videoId={trailerUrl}
          title={rec.title}
          open={showTrailer}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
};

export default RecommendationCard;
