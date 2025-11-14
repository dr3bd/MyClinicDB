import type { ReactNode } from 'react';
import './styles.css';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mc-card mc-empty-state">
      {icon && <div className="mc-empty-state__icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
