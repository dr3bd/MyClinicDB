import type { ChartData } from 'chart.js';
import { ChartPanel } from '../components/ChartPanel.js';
import { KPIWidget } from '../components/KPIWidget.js';
import { Tag } from '../components/Tag.js';
import { formatYER } from '@myclinicdb/core';
import '../components/styles.css';

export interface DashboardAlert {
  id: string;
  label: string;
  details: string;
  daysRemaining?: number;
}

export interface DashboardViewProps {
  metrics: {
    incomeYER: number;
    expenseYER: number;
    balanceYER: number;
  };
  chart: ChartData<'line'>;
  alerts: DashboardAlert[];
}

export function DashboardView({ metrics, chart, alerts }: DashboardViewProps) {
  return (
    <div className="mc-grid mc-grid--two">
      <KPIWidget label="إجمالي الدخل" value={formatYER(metrics.incomeYER)} trend="up" />
      <KPIWidget label="إجمالي المصروف" value={formatYER(metrics.expenseYER)} trend="down" />
      <KPIWidget label="رصيد الخزنة" value={formatYER(metrics.balanceYER)} trend={metrics.balanceYER >= 0 ? 'up' : 'down'} />
      <ChartPanel title="الأداء الأسبوعي" data={chart as any} chart="line" />

      <section className="mc-panel mc-panel--full">
        <header className="mc-panel__header">
          <h3>تنبيهات اليوم</h3>
        </header>
        {alerts.length === 0 ? (
          <p className="mc-text-muted">لا توجد تنبيهات حرجة حالياً.</p>
        ) : (
          <ul className="mc-alert-list">
            {alerts.map((alert) => (
              <li key={alert.id} className="mc-alert-list__item">
                <div className="mc-alert-list__content">
                  <span className="mc-alert-list__label">{alert.label}</span>
                  <small>{alert.details}</small>
                </div>
                {typeof alert.daysRemaining === 'number' && (
                  <Tag tone={alert.daysRemaining <= 30 ? 'danger' : 'warning'}>
                    تبقّى {alert.daysRemaining} يومًا
                  </Tag>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

