import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';
import './styles.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

export type ChartKind = 'line' | 'bar' | 'doughnut';

export interface ChartPanelProps {
  title: string;
  data: ChartData<'line' | 'bar' | 'doughnut'>;
  chart: ChartKind;
  height?: number;
}

export function ChartPanel({ title, data, chart, height = 260 }: ChartPanelProps) {
  const component = useMemo(() => {
    if (chart === 'line') return <Line data={data as ChartData<'line'>} options={{ responsive: true, maintainAspectRatio: false }} />;
    if (chart === 'bar') return <Bar data={data as ChartData<'bar'>} options={{ responsive: true, maintainAspectRatio: false }} />;
    return <Doughnut data={data as ChartData<'doughnut'>} options={{ responsive: true, maintainAspectRatio: false }} />;
  }, [chart, data]);

  return (
    <div className="mc-card mc-chart" style={{ height }}>
      <div className="mc-chart__title">{title}</div>
      <div className="mc-chart__canvas">{component}</div>
    </div>
  );
}
