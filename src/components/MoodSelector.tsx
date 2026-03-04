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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function OptionCard({
  option,
  isSelected,
  onClick,
  density = "normal",
}: {
  option: MoodOption;
  isSelected: boolean;
  onClick: () => void;
  density?: "compact" | "normal";
}) {
  const Icon = option.icon;

  const base = cx(
    "w-full rounded-2xl border transition-all touch-target",
    "bg-background/60 backdrop-blur hover:bg-background/80",
    isSelected ? "border-orange-300 ring-2 ring-orange-200 shadow-sm" : "border-border",
  );

  const iconBoxSize = density === "compact" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = density === "compact" ? 16 : 18;
  const padding = density === "compact" ? "p-2.5" : "p-3";
  const labelClass = density === "compact" ? "text-sm" : "text-sm";
  const hintClass = density === "compact" ? "text-[11px]" : "text-[11px]";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={isSelected}
      className={cx(base, padding)}
    >
      {/* Layout vertical: evita truncar em celular */}
      <div className="flex flex-col items-center justify-center text-center gap-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg leading-none">{option.emoji}</span>

          <div
            className={cx(
              iconBoxSize,
              "rounded-xl flex items-center justify-center",
              isSelected ? "bg-orange-100" : "bg-secondary",
            )}
          >
            <Icon className={isSelected ? "text-orange-600" : "text-muted-foreground"} size={iconSize} />
          </div>
        </div>

        {/* Sem truncate: permite quebrar linha */}
        <div className={cx(labelClass, "font-semibold leading-tight px-1 break-words")}>{option.label}</div>

        {option.hint ? (
          <div className={cx(hintClass, "text-muted-foreground leading-none px-1 break-words")}>{option.hint}</div>
        ) : null}
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
              density="compact"
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
              density="normal"
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
              density="normal"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
