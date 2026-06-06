'use client';

import type { Transaction } from '@/types';
import TransactionItem from './TransactionItem';
import { formatDate, formatAmount } from '@/utils/formatters';
import { getTotalIncome, getTotalExpense } from '@/utils/calculations';
import { Receipt } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

function groupByDate(transactions: Transaction[]): Array<{ date: string; items: Transaction[] }> {
  const map: Record<string, Transaction[]> = {};
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  sorted.forEach(t => {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  });
  return Object.entries(map).map(([date, items]) => ({ date, items }));
}

export default function TransactionList({ transactions, onDelete, onEdit }: Props) {
  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Receipt size={40} strokeWidth={1.2} className="mb-3" />
        <p className="text-sm">내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupByDate(transactions).map(({ date, items }) => {
        const dayIncome  = getTotalIncome(items);
        const dayExpense = getTotalExpense(items);
        return (
          <div key={date}>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-semibold text-gray-500">{formatDate(date)}</span>
              <div className="flex gap-3 text-xs">
                {dayIncome > 0  && <span className="text-blue-500 font-medium">+{formatAmount(dayIncome)}</span>}
                {dayExpense > 0 && <span className="text-red-500 font-medium">−{formatAmount(dayExpense)}</span>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {items.map(t => (
                <TransactionItem key={t.id} transaction={t} onDelete={onDelete} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
