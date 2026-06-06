'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Trash2, PiggyBank } from 'lucide-react';
import type { MonthlyBudget } from '@/types';
import { formatAmount, formatAmountInput, parseAmountInput, formatMonth, getCurrentYearMonth } from '@/utils/formatters';
import { getBudgetStatus } from '@/utils/calculations';

interface Props {
  budgets: Record<string, MonthlyBudget>;
  onSave: (month: string, amount: number) => void;
  onDelete: (month: string) => void;
  currentExpense: number; // 현재 달 지출액
}

export default function BudgetSettings({ budgets, onSave, onDelete, currentExpense }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth());
  const existing  = budgets[selectedMonth];
  const [inputStr, setInputStr] = useState(
    existing ? formatAmountInput(existing.amount) : '',
  );

  function shiftMonth(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d      = new Date(y, m - 1 + delta, 1);
    const next   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(next);
    setInputStr(budgets[next] ? formatAmountInput(budgets[next].amount) : '');
  }

  function handleSave() {
    const amount = parseAmountInput(inputStr);
    if (!amount) return;
    onSave(selectedMonth, amount);
  }

  const budgetAmount  = parseAmountInput(inputStr);
  const isCurrent     = selectedMonth === getCurrentYearMonth();
  const status        = isCurrent ? getBudgetStatus(currentExpense, budgetAmount) : null;
  const saving        = existing ? existing.amount - currentExpense : null;

  // 설정된 예산 목록 (최근 6개)
  const budgetList = Object.values(budgets)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      {/* 월 선택 + 금액 입력 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{formatMonth(selectedMonth)}</p>
            {isCurrent && <p className="text-[11px] text-blue-500">이번 달</p>}
          </div>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="relative mb-3">
          <input
            type="text" inputMode="numeric"
            value={inputStr}
            onChange={e => setInputStr(formatAmountInput(parseAmountInput(e.target.value)))}
            placeholder="예산 금액을 입력하세요"
            className="w-full py-3.5 px-4 pr-10 border-2 border-gray-200 rounded-xl text-xl font-bold focus:outline-none focus:border-blue-500 bg-gray-50 text-center"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">원</span>
        </div>

        {/* 이번 달 현황 미리보기 */}
        {isCurrent && budgetAmount > 0 && status && (
          <div className="mb-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>현재 지출: {formatAmount(currentExpense)}원</span>
              <span className={`font-bold ${status.textColor}`}>{status.percent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${status.progressColor}`}
                style={{ width: `${Math.min(status.percent, 100)}%` }}
              />
            </div>
            <p className={`text-xs ${status.subTextColor}`}>{status.label} — {status.message}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!budgetAmount}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
          >
            <Save size={15} />
            {existing ? '예산 수정' : '예산 저장'}
          </button>
          {existing && (
            <button
              onClick={() => { if (confirm(`${formatMonth(selectedMonth)} 예산을 삭제할까요?`)) { onDelete(selectedMonth); setInputStr(''); } }}
              className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 설정된 예산 목록 */}
      {budgetList.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PiggyBank size={15} className="text-blue-500" />
            설정된 예산
          </h3>
          <div className="space-y-2">
            {budgetList.map(b => {
              const isThisMonth = b.month === getCurrentYearMonth();
              const sv = isThisMonth ? b.amount - currentExpense : null;
              return (
                <div
                  key={b.month}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${selectedMonth === b.month ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  onClick={() => { setSelectedMonth(b.month); setInputStr(formatAmountInput(b.amount)); }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-800">{formatMonth(b.month)}</span>
                      {isThisMonth && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">현재</span>}
                    </div>
                    <p className="text-xs text-gray-400">{formatAmount(b.amount)}원</p>
                  </div>
                  {sv !== null && (
                    <span className={`text-xs font-semibold ${sv >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {sv >= 0 ? `절약 ${formatAmount(sv)}원` : `초과 ${formatAmount(Math.abs(sv))}원`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
