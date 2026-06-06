'use client';

import { useState } from 'react';
import { Plus, Database, Trash2, PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/components/providers/AppDataContext';
import SummaryCards from '@/components/dashboard/SummaryCards';
import BudgetWarningCard from '@/components/dashboard/BudgetWarningCard';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm';
import type { Transaction } from '@/types';
import {
  getMonthTransactions, getTotalIncome, getTotalExpense,
  getBalance, getTodayExpense,
  getBudgetStatus, getDailyAvailableAmount, getBudgetForMonth,
  getBudgetExpense, getExcludedBudgetLabels,
} from '@/utils/calculations';
import { getCurrentYearMonth, formatMonth, getRemainingDaysInMonth } from '@/utils/formatters';

export default function DashboardPage() {
  const app = useApp();
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [showReset, setShowReset]   = useState(false);

  const currentMonth  = getCurrentYearMonth();
  const monthTx       = getMonthTransactions(app.transactions, currentMonth);
  const income        = getTotalIncome(monthTx);
  const expense       = getTotalExpense(monthTx);
  const balance       = getBalance(monthTx);
  const todayExp      = getTodayExpense(app.transactions);
  const remainingDays = getRemainingDaysInMonth();

  // 예산 (인건비 등 excludeFromBudget 항목 제외)
  const budgetExpense   = getBudgetExpense(monthTx, app.categories);
  const monthBudget     = getBudgetForMonth(app.budgets, currentMonth);
  const budgetStatus    = monthBudget ? getBudgetStatus(budgetExpense, monthBudget.amount) : null;
  const dailyAvail      = monthBudget ? getDailyAvailableAmount(budgetExpense, monthBudget.amount, remainingDays) : 0;
  const excludedLabels  = getExcludedBudgetLabels(app.categories);

  const recentTx = [...monthTx]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  function openEdit(t: Transaction) { setEditTarget(t); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditTarget(null); }
  function handleSave(t: Omit<Transaction, 'id' | 'createdAt'>) {
    if (editTarget) app.updateTransaction(editTarget.id, t);
    else app.addTransaction(t);
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-12 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">가계부</h1>
            <p className="text-xs text-gray-400 mt-0.5">{formatMonth(currentMonth)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!app.transactions.length && (
              <button onClick={app.loadSampleData}
                className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors">
                <Database size={13} /> 샘플
              </button>
            )}
            <button onClick={() => setShowReset(v => !v)}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-200 transition-colors" title="데이터 초기화">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {showReset && (
          <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100 animate-slide-up">
            <p className="text-xs text-red-600 mb-2 font-medium">모든 데이터가 삭제됩니다. 계속할까요?</p>
            <div className="flex gap-2">
              <button onClick={() => { app.resetData(); setShowReset(false); }}
                className="flex-1 py-1.5 bg-red-500 text-white text-xs rounded-lg font-semibold">초기화</button>
              <button onClick={() => setShowReset(false)}
                className="flex-1 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-lg">취소</button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-5 space-y-4 pb-6">

        {/* ── 예산 카드 ── */}
        {monthBudget && budgetStatus ? (
          <BudgetWarningCard
            budgetAmount={monthBudget.amount}
            expense={budgetExpense}
            status={budgetStatus}
            remainingDays={remainingDays}
            dailyAvailable={dailyAvail}
            excludedLabels={excludedLabels}
            onEdit={() => window.location.href = '/settings'}
          />
        ) : (
          /* 예산 미설정 안내 */
          <Link href="/settings"
            className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl hover:border-blue-400 hover:bg-blue-100 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200">
              <PiggyBank size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">이번 달 예산을 설정해보세요</p>
              <p className="text-xs text-blue-400">설정하면 지출 경고와 일일 사용 가능 금액을 알 수 있어요</p>
            </div>
            <span className="ml-auto text-blue-400 text-sm">→</span>
          </Link>
        )}

        {/* ── 요약 카드 ── */}
        <SummaryCards
          income={income} expense={expense}
          balance={balance} todayExpense={todayExp}
        />

        {/* ── 최근 내역 ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">최근 내역</h2>
            <Link href="/transactions" className="text-xs text-blue-500 font-medium">전체 보기 →</Link>
          </div>
          {app.transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">아직 내역이 없습니다</p>
              <button onClick={app.loadSampleData}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-full text-sm font-medium hover:bg-purple-600 active:scale-95 transition-all">
                <Database size={14} /> 샘플 데이터 불러오기
              </button>
            </div>
          ) : (
            <TransactionList transactions={recentTx} onDelete={app.deleteTransaction} onEdit={openEdit} />
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => { setEditTarget(null); setFormOpen(true); }}
        className="fixed bottom-[76px] right-1/2 translate-x-[calc(240px-28px)] w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-40">
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <TransactionForm isOpen={formOpen} onClose={closeForm} onSave={handleSave} initial={editTarget} />
    </div>
  );
}
