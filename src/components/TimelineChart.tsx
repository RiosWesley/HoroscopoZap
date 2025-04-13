import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChatAnalysis } from '@/context/ChatAnalysisContext'; // To get theme colors potentially

interface TimelineChartProps {
  data: { name: string; value: number }[]; // Generic data format
  viewType: 'daily' | 'weekly'; // To determine chart type and labels
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data, viewType }) => {
  const { analysisResults } = useChatAnalysis(); // Access context if needed for theme etc.

  // Define labels for weekly view
  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Format data for weekly bar chart
  const weeklyData = viewType === 'weekly'
    ? weekDayLabels.map((label, index) => ({
        name: label,
        Mensagens: data.find(d => d.name === index.toString())?.value || 0, // Match index to day number
      }))
    : [];

  // Format data for daily line chart (assuming data is { name: 'YYYY-MM-DD', value: count })
  // Sort data by date for the line chart
  const dailyData = viewType === 'daily'
    ? data
        .map(d => ({ date: d.name, Mensagens: d.value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // Custom Tooltip Formatter
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = viewType === 'weekly' ? label : new Date(label).toLocaleDateString('pt-BR'); // Format date label
      return (
        <div className="bg-background/80 backdrop-blur-sm p-2 border border-border rounded shadow-lg text-foreground text-xs">
          <p className="font-bold">{name}</p>
          <p>{`Mensagens: ${value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {viewType === 'weekly' ? (
        <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--foreground) / 0.1)' }} />
          <Bar dataKey="Mensagens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : ( // Daily view
        <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis
            dataKey="date"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            // Format date ticks nicely (e.g., show only month/day for brevity)
            tickFormatter={(dateStr) => {
              const date = new Date(dateStr + 'T00:00:00'); // Ensure correct date parsing
              return date.toLocaleDateString('pt-BR', { month: 'numeric', day: 'numeric' });
            }}
            // Optional: Add more ticks if needed, or rotate labels
            // interval="preserveStartEnd" // Show first and last tick
          />
          <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={renderTooltip} cursor={{ stroke: 'hsl(var(--foreground) / 0.1)', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="Mensagens"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: 'hsl(var(--primary))' }}
            activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

export default TimelineChart;
