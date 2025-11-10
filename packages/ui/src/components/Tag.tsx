import type { ReactNode } from 'react';
import './styles.css';

export interface TagProps {
  tone?: 'brand' | 'success' | 'danger' | 'warning';
  children: ReactNode;
}

export function Tag({ tone = 'brand', children }: TagProps) {
  return <span className={`mc-tag mc-tag--${tone}`}>{children}</span>;
}
