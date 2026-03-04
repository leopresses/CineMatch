import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  videoId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

const TrailerModal = ({ videoId, title, open, onClose }: Props) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-card rounded-2xl overflow-hidden"
          style={{ boxShadow: "var(--shadow-card-hover)" }}
        >
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-display font-semibold text-sm truncate pr-2">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default TrailerModal;
