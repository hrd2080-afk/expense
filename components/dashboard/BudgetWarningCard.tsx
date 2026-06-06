'use client';

import { CalendarDays, Pencil, PiggyBank, MinusCircle } from 'lucide-react';
import type { BudgetStatus } from '@/types';
import { formatAmount } from '@/utils/formatters';

interface Props {
  budgetAmount: number;
  expense: number;       // 예산 계산 대상 지출만 (excludeFromBudget 제외)
  status: BudgetStatus;
  remainingDays: number;
  dailyAvailable: number;
  excludedLabels: string[]; // 제외된 항목 이름 목록 (표시용)
  onEdit: () => void;
}

export default function BudgetWarningCard({
  budgetAmount, expense, status, remainingDays, dailyAvailable,
  excludedLabels, onEdit,
}: Props) {
  const remaining = budgetAmount - expense;
  const isOver    = status.level === 'over';
  const isDanger  = status.level === 'danger' || isOver;

  return (
    <div
      className={`rounded-2xl border-2 p-4 bg-gradient-to-br shadow-sm ${status.bgGradient} ${status.borderColor} ${isDanger ? 'animate-[borderPulse_2s_ease-in-out_infinite]' : ''}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100' : 'bg-white/70'}`}>
            <PiggyBank size={14} className={status.textColor} />
          </div>
          <span className="text-sm font-semibold text-gray-800">이번 달 예산 현황</span>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-white/60"
        >
          <Pencil size={11} />
          수정
        </button>
      </div>

      {/* 남은 예산 */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-0.5">{isOver ? '초과 금액' : '남은 예산'}</p>
        <p className={`text-3xl font-extrabold tracking-tight ${isOver ? 'text-red-700' : remaining < budgetAmount * 0.1 ? status.textColor : 'text-gray-900'}`}>
          {isOver ? '−' : ''}{formatAmount(Math.abs(remaining))}원
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          예산 {formatAmount(budgetAmount)}원의 {status.percent}% 사용
        </p>
      </div>

      {/* 프로그레스 바 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">지출 {formatAmount(expense)}원</span>
          <span className={`font-bold ${status.textColor}`}>{status.percent}%</span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ${status.progressColor} ${isOver ? 'animate-pulse' : ''}`}
            style={{ width: `${Math.min(status.percent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0원</span>
          <span>{formatAmount(budgetAmount)}원</span>
        </div>
      </div>

      {/* 경고 메시지 */}
      {status.level !== 'none' && (
        <div className={`rounded-xl p-3 mb-3 ${isDanger ? 'bg-white/80 border border-red-200' : 'bg-white/60'}`}>
          <p className={`text-xs font-bold mb-0.5 ${status.textColor}`}>{status.label}</p>
          <p className={`text-xs leading-relaxed ${status.subTextColor}`}>{status.message}</p>
        </div>
      )}

      {/* 하단 통계 + 제외 항목 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <CalendarDays size={12} />
            <span>남은 <b className="text-gray-700">{remainingDays}일</b></span>
          </div>
          <div className="w-px h-3 bg-gray-300" />
          <div className="text-gray-500">
            하루 사용 가능{' '}
            <b className={dailyAvailable < 0 ? 'text-red-600' : 'text-gray-800'}>
              {formatAmount(Math.max(dailyAvailable, 0))}원
            </b>
          </div>
          {isDanger && (
            <>
              <div className="w-px h-3 bg-gray-300" />
              <span className="text-red-500 font-medium animate-pulse">⚠ 긴급</span>
            </>
          )}
        </div>

        {/* 예산 제외 항목 배지 */}
        {excludedLabels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <MinusCircle size={11} className="text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-400">예산 제외:</span>
            {excludedLabels.map(label => (
              <span
                key={label}
                className="text-[11px] px-2 py-0.5 bg-white/60 text-gray-500 rounded-full border border-gray-200"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
