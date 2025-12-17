import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ActivityResult } from '../types';

interface StatsChartProps {
  history: ActivityResult[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export const StatsChart: React.FC<StatsChartProps> = ({ history }) => {
  // Aggregate data
  const dataMap = history.reduce((acc, curr) => {
    if (curr.activity === 'Error' || curr.activity === 'No Activity') return acc;
    const existing = acc.find(item => item.name === curr.activity);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: curr.activity, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  const sortedData = dataMap.sort((a, b) => b.count - a.count).slice(0, 8); // Top 8

  if (sortedData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm italic">
        No detectable activity stats yet...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={100} 
          tick={{ fill: '#94a3b8', fontSize: 12 }} 
          interval={0}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
          itemStyle={{ color: '#f1f5f9' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
