import {
  BarChart3,
  Braces,
  Briefcase,
  Camera,
  Cpu,
  Globe,
  LineChart,
  Megaphone,
  Music,
  Palette,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const PALETTE: { icon: LucideIcon; bg: string; fg: string }[] = [
  { icon: Braces, bg: 'bg-blue-500/10', fg: 'text-blue-600' },
  { icon: LineChart, bg: 'bg-emerald-500/10', fg: 'text-emerald-600' },
  { icon: Palette, bg: 'bg-purple-500/10', fg: 'text-purple-600' },
  { icon: Megaphone, bg: 'bg-amber-500/10', fg: 'text-amber-600' },
  { icon: Briefcase, bg: 'bg-rose-500/10', fg: 'text-rose-600' },
  { icon: Smartphone, bg: 'bg-cyan-500/10', fg: 'text-cyan-600' },
  { icon: ShieldCheck, bg: 'bg-indigo-500/10', fg: 'text-indigo-600' },
  { icon: Camera, bg: 'bg-pink-500/10', fg: 'text-pink-600' },
  { icon: Music, bg: 'bg-teal-500/10', fg: 'text-teal-600' },
  { icon: Globe, bg: 'bg-sky-500/10', fg: 'text-sky-600' },
  { icon: Cpu, bg: 'bg-orange-500/10', fg: 'text-orange-600' },
  { icon: BarChart3, bg: 'bg-violet-500/10', fg: 'text-violet-600' },
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface CategoryIconProps {
  name: string;
  className?: string;
  iconClassName?: string;
}

export default function CategoryIcon({ name, className, iconClassName }: CategoryIconProps) {
  const { icon: Icon, bg, fg } = PALETTE[hashString(name) % PALETTE.length];

  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', bg, className)}>
      <Icon className={cn('h-5 w-5', fg, iconClassName)} />
    </div>
  );
}
