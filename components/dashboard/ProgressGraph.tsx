'use client';

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import type { StatsHistoryPoint } from '@/lib/types/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface ProgressGraphProps {
  currentPercentage: number;
  history: StatsHistoryPoint[];
}

export function ProgressGraph({ history }: ProgressGraphProps) {
  const hasChart = history.length >= 2;

  const chartData = useMemo(() => {
    const primaryColor =
      typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
        : '#6366f1';

    return {
      labels: history.map((p) =>
        new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Known words',
          data: history.map((p) => p.knownCount),
          borderColor: primaryColor || '#6366f1',
          backgroundColor: `${primaryColor || '#6366f1'}14`,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: history.length > 30 ? 0 : 3,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [history]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<'line'>) =>
              `${(ctx.parsed.y ?? 0).toLocaleString()} known words`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            color: '#9ca3af',
            maxTicksLimit: 6,
          },
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 11 },
            color: '#9ca3af',
            precision: 0,
          },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  return (
    <div className="space-y-3">
      {hasChart ? (
        <div className="h-45 w-full relative">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="h-50 flex flex-col items-center justify-center gap-3">
          <img src="/illustrations/leaf.svg" width={72} height={72} alt="" />
          <p className="font-sans text-ui-sm text-muted text-center">
            Start reading to track your progress over time
          </p>
        </div>
      )}
    </div>
  );
}
