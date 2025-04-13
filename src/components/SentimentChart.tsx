
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SentimentChartProps {
  positive: number;
  negative: number;
  neutral: number;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ positive, negative, neutral }) => {
  const data = [
    { name: 'Positivo', value: positive, color: '#4ade80' },
    { name: 'Neutro', value: neutral, color: '#60a5fa' },
    { name: 'Negativo', value: negative, color: '#f87171' }
  ];

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentChart;
