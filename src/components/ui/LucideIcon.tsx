'use client';

import * as LucideIcons from 'lucide-react';

type LucideProps = {
  className?: string;
  strokeWidth?: number;
};

interface LucideIconProps extends LucideProps {
  name: string;
}

export default function LucideIcon({ name, className, strokeWidth }: LucideIconProps) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Icon = icons[name] || LucideIcons.CircleDot;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
