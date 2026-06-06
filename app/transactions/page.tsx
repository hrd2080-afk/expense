'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '@/components/providers/AppDataContext';
import FilterBar from '@/components/transactions/FilterBar';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm';
import type { FilterState, Transaction } from '@/types';
import { getCurrentYearMonth, getYearMonthFromDate, formatAmount } from '@/utils/formatters';
import { getTotalIncome, getTotalExpense } from '@/utils/calculations';

export default function TransactionsPage() {
  const app = useApp();
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    type: 'all',
    mainCategoryId: 'all',
    subCategoryId: 'all',
    month: getCurrentYearMonth(),
  });

  const filtered = app.transactions.filter(t => {
    if (getYearMonthFromDate(t.date) !== filter.month) return false;
    if (filter.type !== 'all' && t.type !== filter.type) return false;
    if (filter.mainCategoryId !== 'all' && t.mainCategoryId !== filter.mainCategoryId) return false;
    if (filter.subCategoryId !== 'all' && t.subCategoryId !== filter.subCategoryId) return false;
    return true;
  });

  const totalIncome  = getTotalIncome(filtered);
  const totalExpense = getTotalExpense(filtered);
  const balance      = totalIncome - totalExpense;

  function openEdit(t: Transaction) { setEditTarget(t); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditTarget(null); }
  function handleSave(t: Omit<Transaction, 'id' | 'createdAt'>) {
    if (editTarget) app.updateTransaction(editTarget.id, t);
    else app.addTransaction(t);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-white">
        <div className="px-4 pt-12 pb-2">
          <h1 className="text-xl font-bold text-gray-900">내역</h1>
        </div>
        <FilterBar filter={filter} onChange={setFilter} />
      </div>

      {/* 기간 합계 바 */}
      <div className="flex gap-4 px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex-1 text-center">
          <p className="text-[11px] text-gray-400 mb-0.5">수입</p>
          <p className="text-sm font-bold text-blue-600">+{formatAmount(totalIncome)}원</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 text-center">
          <p className="text-[11px] text-gray-400 mb-0.5">지출</p>
          <p className="text-sm font-bold text-red-500">−{formatAmount(totalExpense)}원</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 text-center">
          <p className="text-[11px] text-gray-400 mb-0.5">잔액</p>
          <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatAmount(Math.abs(balance))}원
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        <TransactionList transactions={filtered} onDelete={app.deleteTransaction} onEdit={openEdit} />
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditTarget(null); setFormOpen(true); }}
        className="fixed bottom-[76px] right-1/2 translate-x-[calc(240px-28px)] w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-40"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <TransactionForm isOpen={formOpen} onClose={closeForm} onSave={handleSave} initial={editTarget} />
    </div>
  );
}
