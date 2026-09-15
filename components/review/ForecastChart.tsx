'use client';

import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import type { SrsForecastBucket } from '@/lib/types/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface ForecastChartProps {
  buckets: SrsForecastBucket[];
}

export function ForecastChart({ buckets }: ForecastChartProps) {
  const hasData = buckets.some((b) => b.count > 0);

  const chartData = useMemo(() => {
    const primaryColor =
      typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
        : '#183A37';

    return {
      labels: buckets.map((b, i) =>
        i === 0 ? 'Today' : new Date(b.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Cards due',
          data: buckets.map((b) => b.count),
          backgroundColor: primaryColor || '#183A37',
          borderRadius: 3,
        },
      ],
    };
  }, [buckets]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.y ?? 0} due`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 7 },
        },
        y: {
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
          <p className="font-sans text-ui-sm text-muted">Nothing due in the next {buckets.length} days</p>
        </div>
      )}
    </div>
  );
}
