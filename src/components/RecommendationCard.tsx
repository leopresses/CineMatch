import { motion } from "framer-motion";
import { Bookmark, Star, Film, Tv } from "lucide-react";

export interface Recommendation {
  title: string;
  type: "movie" | "series";
  reason: string;
  tags: string[];
  intensity: number;
  posterUrl?: string;
}

interface Props {
  rec: Recommendation;
  index: number;
  onSave?: () => void;
}

const RecommendationCard = ({ rec, index, onSave }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    className="card-cinema flex gap-3 items-start"
  >
    <div className="w-20 h-28 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
      {rec.posterUrl ? (
        <img src={rec.posterUrl} alt={rec.title} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          {rec.type === "movie" ? <Film size={24} /> : <Tv size={24} />}
          <span className="text-[9px]">{rec.type === "movie" ? "Filme" : "Série"}</span>
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
    </div>
  </motion.div>
);

export default RecommendationCard;
