import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { Film, Tv, Star, Heart, X } from "lucide-react";
import type { Recommendation } from "./RecommendationCard";

interface Props {
  rec: Recommendation;
  onSwipe: (liked: boolean) => void;
  isTop?: boolean;
  stackOffset?: number;
}

const SWIPE_THRESHOLD = 110;

const SwipeCard = ({ rec, onSwipe, isTop = false, stackOffset = 0 }: Props) => {
  const [imgError, setImgError] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);
  const bgGreen = useTransform(x, [40, 160], [0, 0.35]);
  const bgRed = useTransform(x, [-160, -40], [0.35, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!isTop) return;
    if (info.offset.x > SWIPE_THRESHOLD) {
      // Like
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
      onSwipe(true);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
      onSwipe(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 select-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - stackOffset,
        scale: 1 - stackOffset * 0.04,
        y: stackOffset * 10,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing" } : undefined}
    >
      <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-xl border bg-card">
        {/* Poster */}
        <div className="relative h-full w-full">
          {rec.posterUrl && !imgError ? (
            <img
              src={rec.posterUrl}
              alt={rec.title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-secondary to-muted flex flex-col items-center justify-center text-muted-foreground gap-2">
              {rec.type === "movie" ? <Film size={56} /> : <Tv size={56} />}
              <span className="text-sm">Sem imagem</span>
            </div>
          )}

          {/* Color overlays */}
          {isTop && (
            <>
              <motion.div
                className="absolute inset-0 bg-emerald-500 pointer-events-none"
                style={{ opacity: bgGreen }}
              />
              <motion.div
                className="absolute inset-0 bg-rose-500 pointer-events-none"
                style={{ opacity: bgRed }}
              />
            </>
          )}

          {/* Bottom gradient + info */}
          <div className="absolute inset-x-0 bottom-0 p-5 pt-24 bg-gradient-to-t from-black/85 via-black/55 to-transparent text-white">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/80">
              {rec.type === "movie" ? <Film size={12} /> : <Tv size={12} />}
              {rec.type === "movie" ? "Filme" : "Série"}
            </div>
            <h2 className="font-display font-bold text-2xl leading-tight mt-1">{rec.title}</h2>

            {rec.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {rec.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {rec.reason && (
              <p className="text-xs mt-2 text-white/85 leading-relaxed line-clamp-3">{rec.reason}</p>
            )}

            <div className="flex items-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < rec.intensity ? "text-gold fill-gold" : "text-white/30"}
                />
              ))}
            </div>
          </div>

          {/* LIKE / NOPE labels */}
          {isTop && (
            <AnimatePresence>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-6 left-6 px-4 py-1.5 rounded-xl border-4 border-emerald-400 bg-emerald-500/20 backdrop-blur-sm flex items-center gap-2"
              >
                <Heart size={20} className="text-emerald-300 fill-emerald-300" />
                <span className="font-display font-extrabold text-emerald-300 text-xl tracking-wider">
                  GOSTEI
                </span>
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute top-6 right-6 px-4 py-1.5 rounded-xl border-4 border-rose-400 bg-rose-500/20 backdrop-blur-sm flex items-center gap-2"
              >
                <X size={20} className="text-rose-300" strokeWidth={3} />
                <span className="font-display font-extrabold text-rose-300 text-xl tracking-wider">
                  NOPE
                </span>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
