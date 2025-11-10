import type { ReactNode } from 'react';
import './styles.css';

export interface BadgeProps {
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`mc-badge mc-badge--${tone}`}>{children}</span>;
}
