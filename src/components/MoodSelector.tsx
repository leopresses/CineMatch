import { motion } from "framer-motion";
import { Clock, Smile, Zap, Heart, Users, User } from "lucide-react";
import type { ElementType } from "react";

type MoodOption = {
  id: string;
  label: string;
  icon: ElementType;
  emoji: string;
  hint?: string;
};

const timeOptions: MoodOption[] = [
  { id: "30", label: "30 min", icon: Clock, emoji: "⚡", hint: "rápido" },
  { id: "60", label: "1 hora", icon: Clock, emoji: "🎬", hint: "na medida" },
  { id: "120", label: "2h+", icon: Clock, emoji: "🍿", hint: "maratona" },
];

const moodOptions: MoodOption[] = [
  { id: "light", label: "Leve", icon: Smile, emoji: "😊", hint: "relax" },
  { id: "intense", label: "Intenso", icon: Zap, emoji: "🔥", hint: "impacto" },
  { id: "romantic", label: "Romântico", icon: Heart, emoji: "💕", hint: "coração" },
];

const companyOptions: MoodOption[] = [
  { id: "solo", label: "Sozinho", icon: User, emoji: "🧘", hint: "meu momento" },
  { id: "couple", label: "Casal", icon: Heart, emoji: "💑", hint: "a dois" },
  { id: "family", label: "Família", icon: Users, emoji: "👨‍👩‍👧‍👦", hint: "todos juntos" },
  { id: "friends", label: "Amigos", icon: Users, emoji: "🎉", hint: "galera" },
];

interface Props {
  selected: { time: string; mood: string; company: string };
  onChange: (key: "time" | "mood" | "company", value: string) => void;
}

function OptionCard({ option, isSelected, onClick }: { option: MoodOption; isSelected: boolean; onClick: () => void }) {
  const Icon = option.icon;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={isSelected}
      className={[
        "w-full rounded-2xl border p-3 text-left transition-all touch-target",
        "bg-background/60 backdrop-blur",
        "hover:bg-background/80",
        isSelected ? "border-orange-300 ring-2 ring-orange-200 shadow-sm" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{option.emoji}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{option.label}</div>
            {option.hint ? <div className="text-[11px] text-muted-foreground truncate">{option.hint}</div> : null}
          </div>
        </div>

        <div
          className={[
            "h-9 w-9 rounded-xl flex items-center justify-center",
            isSelected ? "bg-orange-100" : "bg-secondary",
          ].join(" ")}
        >
          <Icon className={isSelected ? "text-orange-600" : "text-muted-foreground"} size={18} />
        </div>
      </div>
    </motion.button>
  );
}

export default function MoodSelector({ selected, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* Tempo */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">⏱ Tempo disponível</p>
        <div className="grid grid-cols-3 gap-2">
          {timeOptions.map((o) => (
            <OptionCard
              key={o.id}
              option={o}
              isSelected={selected.time === o.id}
              onClick={() => onChange("time", o.id)}
            />
          ))}
        </div>
      </div>

      {/* Humor */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">🎭 Humor</p>
        <div className="grid grid-cols-2 gap-2">
          {moodOptions.map((o) => (
            <OptionCard
              key={o.id}
              option={o}
              isSelected={selected.mood === o.id}
              onClick={() => onChange("mood", o.id)}
            />
          ))}
        </div>
      </div>

      {/* Companhia */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">👥 Companhia</p>
        <div className="grid grid-cols-2 gap-2">
          {companyOptions.map((o) => (
            <OptionCard
              key={o.id}
              option={o}
              isSelected={selected.company === o.id}
              onClick={() => onChange("company", o.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
