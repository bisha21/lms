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
  { icon: Braces, bg: 'bg-palette-1-soft', fg: 'text-palette-1' },
  { icon: LineChart, bg: 'bg-palette-2-soft', fg: 'text-palette-2' },
  { icon: Palette, bg: 'bg-palette-3-soft', fg: 'text-palette-3' },
  { icon: Megaphone, bg: 'bg-palette-4-soft', fg: 'text-palette-4' },
  { icon: Briefcase, bg: 'bg-palette-5-soft', fg: 'text-palette-5' },
  { icon: Smartphone, bg: 'bg-palette-6-soft', fg: 'text-palette-6' },
  { icon: ShieldCheck, bg: 'bg-palette-1-soft', fg: 'text-palette-1' },
  { icon: Camera, bg: 'bg-palette-5-soft', fg: 'text-palette-5' },
  { icon: Music, bg: 'bg-palette-2-soft', fg: 'text-palette-2' },
  { icon: Globe, bg: 'bg-palette-6-soft', fg: 'text-palette-6' },
  { icon: Cpu, bg: 'bg-palette-4-soft', fg: 'text-palette-4' },
  { icon: BarChart3, bg: 'bg-palette-3-soft', fg: 'text-palette-3' },
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
