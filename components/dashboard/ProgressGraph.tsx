'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// Hardcoded 30-day progress data
const progressData = [
  { date: '2026-01-01', percentage: 78 },
  { date: '2026-01-02', percentage: 79 },
  { date: '2026-01-03', percentage: 79 },
  { date: '2026-01-04', percentage: 80 },
  { date: '2026-01-05', percentage: 81 },
  { date: '2026-01-06', percentage: 81 },
  { date: '2026-01-07', percentage: 82 },
  { date: '2026-01-08', percentage: 83 },
  { date: '2026-01-09', percentage: 83 },
  { date: '2026-01-10', percentage: 84 },
  { date: '2026-01-11', percentage: 85 },
  { date: '2026-01-12', percentage: 85 },
  { date: '2026-01-13', percentage: 86 },
  { date: '2026-01-14', percentage: 86 },
  { date: '2026-01-15', percentage: 87 },
  { date: '2026-01-16', percentage: 88 },
  { date: '2026-01-17', percentage: 88 },
  { date: '2026-01-18', percentage: 89 },
  { date: '2026-01-19', percentage: 89 },
  { date: '2026-01-20', percentage: 90 },
  { date: '2026-01-21', percentage: 90 },
  { date: '2026-01-22', percentage: 91 },
  { date: '2026-01-23', percentage: 91 },
  { date: '2026-01-24', percentage: 92 },
  { date: '2026-01-25', percentage: 92 },
  { date: '2026-01-26', percentage: 93 },
  { date: '2026-01-27', percentage: 93 },
  { date: '2026-01-28', percentage: 94 },
  { date: '2026-01-29', percentage: 94 },
  { date: '2026-01-30', percentage: 95 },
];

type RangeType = '7d' | '30d' | '90d' | 'all';

interface RangeOption {
  id: RangeType;
  label: string;
  days: number | null;
}

const rangeOptions: RangeOption[] = [
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
  { id: 'all', label: 'All', days: null },
];

export function ProgressGraph() {
  const [selectedRange, setSelectedRange] = useState<RangeType>('30d');

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    const range = rangeOptions.find((r) => r.id === selectedRange);
    if (!range || range.days === null) {
      return progressData;
    }
    return progressData.slice(-range.days);
  }, [selectedRange]);

  // Format date for display (e.g., "Jan 1")
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Format date for tooltip (e.g., "Jan 1, 2026")
  const formatTooltipDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Prepare chart data
  const chartData = {
    labels: filteredData.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Progress',
        data: filteredData.map((d) => d.percentage),
        fill: true,
        borderColor: '#183A37', // Library Green
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(24, 58, 55, 0.1)');
          gradient.addColorStop(1, 'rgba(24, 58, 55, 0)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#183A37',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.4, // Smooth curves
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#FAF9F5', // Paper
        titleColor: '#141413', // Ink
        bodyColor: '#141413', // Ink
        borderColor: '#E5E2DA', // Border
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: false,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 13,
          weight: 600,
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: 400,
        },
        callbacks: {
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            const index = tooltipItems[0].dataIndex;
            return formatTooltipDate(filteredData[index].date);
          },
          label: (tooltipItem: TooltipItem<'line'>) => {
            return `${tooltipItem.parsed.y}% known`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6E6D6A', // Muted
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
          },
          maxRotation: 0,
          autoSkipPadding: 20,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#E5E2DA', // Border Subtle
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6E6D6A', // Muted
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
          },
          callback: (value: string | number) => `${value}%`,
          stepSize: 25,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    animation: {
      duration: 200,
    },
  };

  return (
    <div className="space-y-4">
      {/* Range Selector Tabs */}
      <div className="flex gap-2">
        {rangeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedRange(option.id)}
            className={`
              px-3 py-1.5 rounded font-sans text-ui-sm font-medium transition-all
              ${
                selectedRange === option.id
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-muted hover:bg-desk cursor-pointer hover:text-ink'
              }
            `}
            aria-label={`Show ${option.label} range`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="h-32 md:h-48 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
