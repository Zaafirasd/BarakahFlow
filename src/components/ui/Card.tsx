import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`glass-card text-slate-900 dark:text-white ${padding ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
