import React from 'react';
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
export declare const StatsChart: React.FC<StatsChartProps>;
export {};
