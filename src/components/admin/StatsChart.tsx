import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import { Card } from '../ui/card';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  name: string;
  users?: number;
  listings?: number;
  bookings?: number;
  revenue?: number;
}

interface StatsChartProps {
  data: ChartData[];
  type?: 'line' | 'bar';
  title?: string;
  showLegend?: boolean;
}

export const StatsChart: React.FC<StatsChartProps> = ({
  data,
  type = 'line',
  title,
  showLegend = true,
}) => {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue || 0),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Users',
        data: data.map(item => item.users || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Listings',
        data: data.map(item => item.listings || 0),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Bookings',
        data: data.map(item => item.bookings || 0),
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || '',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        bodySpacing: 4,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => value.toLocaleString(),
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`,
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const ChartComponent = type === 'line' ? Line : Bar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full h-[300px]"
    >
      <ChartComponent
        options={options}
        data={chartData}
        className="w-full h-full"
      />
    </motion.div>
  );
}; 