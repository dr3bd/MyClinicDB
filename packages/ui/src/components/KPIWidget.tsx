import type { ReactNode } from 'react';
import './styles.css';

export interface KPIWidgetProps {
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  trend?: 'up' | 'down' | 'steady';
}

const trendSymbol: Record<'up' | 'down' | 'steady', string> = {
  up: '▲',
  down: '▼',
  steady: '■'
};

export function KPIWidget({ label, value, subValue, trend = 'steady' }: KPIWidgetProps) {
  return (
    <div className="mc-card mc-kpi">
      <span className="mc-kpi__label">{label}</span>
      <strong className="mc-kpi__value">{value}</strong>
      {subValue && <span className="mc-kpi__sub">{subValue}</span>}
      <span className={`mc-kpi__trend mc-kpi__trend--${trend}`}>{trendSymbol[trend]}</span>
    </div>
  );
}
