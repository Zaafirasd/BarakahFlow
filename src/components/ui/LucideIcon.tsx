'use client';

import React, { lazy, memo, Suspense } from 'react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { CircleDot } from 'lucide-react';

type LucideProps = {
  className?: string;
  strokeWidth?: number;
};

interface LucideIconProps extends LucideProps {
  name: string;
}

// Cache lazy components so re-renders don't re-create them
const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<LucideProps>>>();

function getLazyIcon(name: string) {
  const key = name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();
  if (iconCache.has(key)) return iconCache.get(key)!;

  const importFn = dynamicIconImports[key as keyof typeof dynamicIconImports];
  if (!importFn) return null;

  const LazyIcon = lazy(importFn);
  iconCache.set(key, LazyIcon);
  return LazyIcon;
}

function LucideIconInner({ name, className, strokeWidth }: LucideIconProps) {
  const Icon = getLazyIcon(name);

  if (!Icon) {
    return <CircleDot className={className} strokeWidth={strokeWidth} />;
  }

  return (
    <Suspense fallback={<CircleDot className={className} strokeWidth={strokeWidth} />}>
      {/* Use createElement to avoid 'component created during render' lint error */}
      {React.createElement(Icon as any, { className, strokeWidth })}
    </Suspense>
  );
}

export default memo(LucideIconInner);
