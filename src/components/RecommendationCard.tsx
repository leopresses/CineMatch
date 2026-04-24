import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Star, Film, Tv, Play, ExternalLink } from "lucide-react";
import TrailerModal from "./TrailerModal";

export interface Recommendation {
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
}

const RecommendationCard = ({ rec, index, onSave }: Props) => {
  const [imgError, setImgError] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.title + " trailer")}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        className="card-cinema flex gap-3 items-start"
      >
        <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-secondary to-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
          {rec.posterUrl && !imgError ? (
            <img
              src={rec.posterUrl}
              alt={rec.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground p-1 text-center">
              {rec.type === "movie" ? <Film size={20} /> : <Tv size={20} />}
              <span className="text-[9px] leading-tight">Sem imagem</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-sm leading-tight">{rec.title}</h3>
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
            {rec.youtubeVideoId && (
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                <Play size={12} />
                Ver aqui
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {rec.youtubeVideoId && (
        <TrailerModal
          videoId={rec.youtubeVideoId}
          title={rec.title}
          open={showTrailer}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
};

export default RecommendationCard;
