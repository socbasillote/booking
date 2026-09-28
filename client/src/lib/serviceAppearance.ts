import {
  CircleDot,
  Dumbbell,
  Target,
  Trophy,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS = [
  { key: "court", label: "Court", Icon: CircleDot },
  { key: "trophy", label: "Trophy", Icon: Trophy },
  { key: "fitness", label: "Fitness", Icon: Dumbbell },
  { key: "target", label: "Target", Icon: Target },
  { key: "water", label: "Water", Icon: Waves },
  { key: "energy", label: "Energy", Icon: Zap },
] as const satisfies readonly {
  key: string;
  label: string;
  Icon: LucideIcon;
}[];

export type ServiceIconKey = (typeof SERVICE_ICONS)[number]["key"];

export function serviceIconFor(key?: string): LucideIcon {
  return SERVICE_ICONS.find((item) => item.key === key)?.Icon ?? CircleDot;
}
