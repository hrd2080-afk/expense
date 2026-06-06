'use client';

import { TrendingUp, TrendingDown, Wallet, CalendarDays } from 'lucide-react';
import { formatAmount } from '@/utils/formatters';

interface Props {
  income: number;
  expense: number;
  balance: number;
  todayExpense: number;
}

function SmallCard({
  label, value, icon: Icon, iconBg, valueColor,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon size={14} strokeWidth={2} />
        </div>
      </div>
      <p className={`text-lg font-bold ${valueColor ?? 'text-gray-900'}`}>{value}원</p>
    </div>
  );
}

export default function SummaryCards({ income, expense, balance, todayExpense }: Props) {
  const balancePositive = balance >= 0;

  return (
    <div className="space-y-3">
      {/* 이번 달 잔액 메인 카드 */}
      <div
        className={`rounded-2xl p-5 text-white shadow-md ${
          balancePositive
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}
      >
        <p className="text-sm font-medium text-white/80 mb-1">이번 달 잔액</p>
        <p className="text-3xl font-extrabold tracking-tight">
          {balancePositive ? '' : '−'}{formatAmount(Math.abs(balance))}원
        </p>
        <div className="flex gap-5 mt-4">
          <div>
            <p className="text-xs text-white/70">수입</p>
            <p className="text-sm font-semibold">+{formatAmount(income)}원</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-xs text-white/70">지출</p>
            <p className="text-sm font-semibold">−{formatAmount(expense)}원</p>
          </div>
        </div>
      </div>

      {/* 서브 카드 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <SmallCard
          label="이번 달 수입"
          value={`+${formatAmount(income)}`}
          icon={TrendingUp}
          iconBg="bg-blue-100 text-blue-600"
          valueColor="text-blue-600"
        />
        <SmallCard
          label="이번 달 지출"
          value={`−${formatAmount(expense)}`}
          icon={TrendingDown}
          iconBg="bg-red-100 text-red-500"
          valueColor="text-red-500"
        />
        <SmallCard
          label="남은 돈"
          value={`${balancePositive ? '' : '−'}${formatAmount(Math.abs(balance))}`}
          icon={Wallet}
          iconBg={balancePositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}
          valueColor={balancePositive ? 'text-emerald-600' : 'text-red-500'}
        />
        <SmallCard
          label="오늘 지출"
          value={`−${formatAmount(todayExpense)}`}
          icon={CalendarDays}
          iconBg="bg-orange-100 text-orange-500"
          valueColor="text-orange-600"
        />
      </div>
    </div>
  );
}
