'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatAmount } from '@/utils/formatters';

interface WeekData {
  week: string;
  days: string;
  amount: number;
}

interface Props {
  data: WeekData[];
  maxAmount: number;
}

const WEEK_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function WeeklyChart({ data, maxAmount }: Props) {
  const chartData = data.map(d => ({ ...d, name: d.week }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => v >= 10000 ? `${Math.round(v / 10000)}만` : `${v}`}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
          width={34}
          domain={[0, maxAmount > 0 ? Math.ceil(maxAmount * 1.1) : 100]}
        />
        <Tooltip
          formatter={(value) => [`${formatAmount(value as number)}원`, '지출']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          cursor={{ fill: 'rgba(99,102,241,0.06)' }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={WEEK_COLORS[i] ?? WEEK_COLORS[4]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
