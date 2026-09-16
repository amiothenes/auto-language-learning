'use client';

import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import type { SrsActivityBucket } from '@/lib/types/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ActivityChartProps {
  buckets: SrsActivityBucket[];
}

export function ActivityChart({ buckets }: ActivityChartProps) {
  const hasData = buckets.some((b) => b.reviews > 0 || b.newCards > 0);

  const chartData = useMemo(() => {
    const style = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const primaryColor = style?.getPropertyValue('--color-primary').trim() || '#183A37';
    const newColor = style ? `hsl(${style.getPropertyValue('--color-status-unknown').trim()})` : 'hsl(205, 80%, 58%)';

    return {
      labels: buckets.map((b) => new Date(b.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })),
      datasets: [
        { label: 'Reviews', data: buckets.map((b) => b.reviews), backgroundColor: primaryColor, stack: 'activity' },
        { label: 'New', data: buckets.map((b) => b.newCards), backgroundColor: newColor, stack: 'activity' },
      ],
    };
  }, [buckets]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<'bar'>) => `${ctx.dataset.label}: ${ctx.parsed.y ?? 0}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 8 },
        },
        y: {
          stacked: true,
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 11 }, color: '#9ca3af', precision: 0 },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  return (
    <div className="h-40 w-full relative">
      {hasData ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="font-sans text-ui-sm text-muted">No review activity yet</p>
        </div>
      )}
    </div>
  );
}
