import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import { motion } from 'framer-motion';
import { Card } from '../ui/card';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);
export const StatsChart = ({ data, type = 'line', title, showLegend = true, }) => {
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
    const options = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: showLegend,
                position: 'top',
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
                type: 'linear',
                display: true,
                position: 'left',
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    callback: (value) => value.toLocaleString(),
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
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
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "w-full h-[300px]", children: _jsx(ChartComponent, { options: options, data: chartData, className: "w-full h-full" }) }));
};
