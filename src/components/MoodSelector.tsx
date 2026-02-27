import { motion } from "framer-motion";
import { Clock, Smile, Zap, Heart, Users, User } from "lucide-react";

type MoodOption = {
  id: string;
  label: string;
  icon: React.ElementType;
  emoji: string;
};

const timeOptions: MoodOption[] = [
  { id: "30", label: "30 min", icon: Clock, emoji: "⚡" },
  { id: "60", label: "1 hora", icon: Clock, emoji: "🎬" },
  { id: "120", label: "2h+", icon: Clock, emoji: "🍿" },
];

const moodOptions: MoodOption[] = [
  { id: "light", label: "Leve", icon: Smile, emoji: "😊" },
  { id: "intense", label: "Intenso", icon: Zap, emoji: "🔥" },
  { id: "romantic", label: "Romântico", icon: Heart, emoji: "💕" },
];

const companyOptions: MoodOption[] = [
  { id: "solo", label: "Sozinho", icon: User, emoji: "🧘" },
  { id: "couple", label: "Casal", icon: Heart, emoji: "💑" },
  { id: "family", label: "Família", icon: Users, emoji: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "Amigos", icon: Users, emoji: "🎉" },
];

interface Props {
  selected: { time: string; mood: string; company: string };
  onChange: (key: "time" | "mood" | "company", value: string) => void;
}

const OptionChip = ({
  option,
  isSelected,
  onClick,
}: {
  option: MoodOption;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all touch-target ${
      isSelected
        ? "bg-accent text-accent-foreground shadow-md"
        : "bg-secondary text-secondary-foreground"
    }`}
  >
    <span className="text-base">{option.emoji}</span>
    <span>{option.label}</span>
  </motion.button>
);

const MoodSelector = ({ selected, onChange }: Props) => (
  <div className="space-y-5">
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">⏱ Tempo disponível</p>
      <div className="flex gap-2 flex-wrap">
        {timeOptions.map((o) => (
          <OptionChip key={o.id} option={o} isSelected={selected.time === o.id} onClick={() => onChange("time", o.id)} />
        ))}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">🎭 Humor</p>
      <div className="flex gap-2 flex-wrap">
        {moodOptions.map((o) => (
          <OptionChip key={o.id} option={o} isSelected={selected.mood === o.id} onClick={() => onChange("mood", o.id)} />
        ))}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">👥 Companhia</p>
      <div className="flex gap-2 flex-wrap">
        {companyOptions.map((o) => (
          <OptionChip key={o.id} option={o} isSelected={selected.company === o.id} onClick={() => onChange("company", o.id)} />
        ))}
      </div>
    </div>
  </div>
);

export default MoodSelector;
