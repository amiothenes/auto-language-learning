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

  // A vocabulary that is already in the thousands grows by a few dozen words a
  // week, so a zero-based axis squeezes the entire trend into the top sliver of
  // the plot and spends the other 80% of the card's height drawing empty space.
  // Framing the axis around the data's own range makes the trend legible and
  // buys back most of that height. The trade-off is real and worth knowing: a
  // non-zero baseline exaggerates slope, so the axis labels are kept visible to
  // show the actual scale rather than letting the shape speak alone.
  const [yMin, yMax] = useMemo(() => {
    if (history.length === 0) return [0, undefined] as const;
    const values = history.map((p) => p.knownCount);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = Math.max(Math.round((hi - lo) * 0.25), 5);
    return [Math.max(0, lo - pad), hi + pad] as const;
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
              `${(ctx.parsed.y ?? 0).toLocaleString('en-US')} known words`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#6E6D6A',
            maxTicksLimit: 5,
          },
        },
        y: {
          grid: { color: '#E5E2DA' },
          border: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#6E6D6A',
            maxTicksLimit: 4,
            precision: 0,
            // Chart.js formats ticks with the visitor's OS locale by default,
            // which renders 4000 as "4.000" in de/es/ru and reads as a decimal.
            // Same rule as the rest of the app: force en-US grouping.
            callback: (value: string | number) => Number(value).toLocaleString('en-US'),
          },
          min: yMin,
          max: yMax,
        },
      },
    }),
    [yMin, yMax]
  );

  return (
    <>
      {hasChart ? (
        // flex-1 + min-h-32: the plot fills whatever height the card has spare
        // (so the column's bottom edge lines up with the right-hand column) but
        // never collapses below a readable 128px when there is no spare height.
        <div className="relative w-full min-h-32 flex-1">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="min-h-32 flex-1 flex flex-col items-center justify-center gap-2">
          <img src="/illustrations/leaf.svg" width={56} height={56} alt="" />
          <p className="font-sans text-ui-sm text-muted text-center">
            Start reading to track your progress over time
          </p>
        </div>
      )}
    </>
  );
}
