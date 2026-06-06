'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatAmount } from '@/utils/formatters';

interface Slice {
  id: string;
  name: string;
  amount: number;
  color: string;
}

interface Props {
  data: Slice[];
  total: number;
}

export default function CategoryChart({ data, total }: Props) {
  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-sm text-gray-400">데이터 없음</div>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={52} outerRadius={85}
            paddingAngle={2}
            dataKey="amount"
            nameKey="name"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            formatter={(value) => [`${formatAmount(value as number)}원`, '']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-1">
        {data.map(d => (
          <div key={d.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-gray-600 flex-1 truncate">{d.name}</span>
            <span className="text-xs font-semibold text-gray-800">{formatAmount(d.amount)}원</span>
            <span className="text-xs text-gray-400 w-9 text-right shrink-0">
              {total > 0 ? Math.round((d.amount / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
