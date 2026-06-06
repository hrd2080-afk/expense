'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, Plus, X, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/components/providers/AppDataContext';
import type { Transaction, TransactionType } from '@/types';
import { getCategoriesByType } from '@/utils/categories';
import { UNCLASSIFIED_SUB } from '@/utils/defaultCategories';
import {
  getCurrentDate, getCurrentYearMonth,
  formatAmountInput, parseAmountInput,
} from '@/utils/formatters';
import {
  getMonthTransactions,
  getBudgetStatus, getBudgetForMonth, getBudgetExpense,
} from '@/utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initial?: Transaction | null;
}

export default function TransactionForm({ isOpen, onClose, onSave, initial }: Props) {
  const { categories, transactions, budgets, addSubCategory } = useApp();

  const [type, setType]           = useState<TransactionType>('expense');
  const [mainCatId, setMainCatId] = useState('');
  const [subCatId, setSubCatId]   = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [amount, setAmount]       = useState(0);
  const [date, setDate]           = useState(getCurrentDate());
  const [memo, setMemo]           = useState('');
  const [addingSubCat, setAddingSubCat] = useState(false);
  const [newSubName, setNewSubName]     = useState('');

  // 현재 달 예산
  const currentMonth  = getCurrentYearMonth();
  const monthBudget   = getBudgetForMonth(budgets, currentMonth);

  // 현재 달 예산 대상 지출 (excludeFromBudget 항목 제외)
  const currentExpense = useMemo(() => {
    const monthTx = getMonthTransactions(transactions, currentMonth);
    let base = getBudgetExpense(monthTx, categories);
    // 수정 중인 건이 예산 대상이면 제외
    if (initial?.type === 'expense') {
      const initMainCat = categories.find(c => c.id === initial.mainCategoryId);
      const initSub     = initMainCat?.subCategories.find(s => s.id === initial.subCategoryId);
      if (!initSub?.excludeFromBudget) base -= initial.amount;
    }
    return Math.max(base, 0);
  }, [transactions, currentMonth, categories, initial]);

  // 현재 선택한 세부항목이 예산 제외 대상인지
  const isCurrentSubExcluded = useMemo(() => {
    if (type !== 'expense') return false;
    const mainCat = categories.find(c => c.id === mainCatId);
    const sub     = mainCat?.subCategories.find(s => s.id === subCatId);
    return sub?.excludeFromBudget ?? false;
  }, [type, mainCatId, subCatId, categories]);

  // 예상 사용률 (제외 항목 추가 중이면 현재와 동일)
  const projectedExpense = (type === 'expense' && !isCurrentSubExcluded)
    ? currentExpense + amount
    : currentExpense;
  const projectedStatus  = monthBudget ? getBudgetStatus(projectedExpense, monthBudget.amount) : null;
  const showBudgetHint   = type === 'expense' && !isCurrentSubExcluded && monthBudget && amount > 0;

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setType(initial.type);
      setMainCatId(initial.mainCategoryId);
      setSubCatId(initial.subCategoryId);
      setAmount(initial.amount);
      setAmountStr(formatAmountInput(initial.amount));
      setDate(initial.date);
      setMemo(initial.memo);
    } else {
      const first = getCategoriesByType(categories, 'expense')[0];
      setType('expense');
      setMainCatId(first?.id ?? '');
      setSubCatId(first?.subCategories[0]?.id ?? UNCLASSIFIED_SUB.id);
      setAmount(0); setAmountStr('');
      setDate(getCurrentDate()); setMemo('');
    }
    setAddingSubCat(false); setNewSubName('');
  }, [isOpen, initial, categories]);

  useEffect(() => {
    const first = getCategoriesByType(categories, type)[0];
    setMainCatId(first?.id ?? '');
    setSubCatId(first?.subCategories[0]?.id ?? UNCLASSIFIED_SUB.id);
    setAddingSubCat(false);
  }, [type, categories]);

  useEffect(() => {
    const cat = categories.find(c => c.id === mainCatId);
    if (!cat) return;
    if (initial && initial.mainCategoryId === mainCatId) setSubCatId(initial.subCategoryId);
    else setSubCatId(cat.subCategories[0]?.id ?? UNCLASSIFIED_SUB.id);
    setAddingSubCat(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainCatId]);

  const mainCats  = getCategoriesByType(categories, type);
  const activeCat = categories.find(c => c.id === mainCatId);
  const subCats   = activeCat?.subCategories ?? [UNCLASSIFIED_SUB];
  const activeSubCat = subCats.find(s => s.id === subCatId);

  function handleAmountChange(raw: string) {
    const n = parseAmountInput(raw);
    setAmount(n);
    setAmountStr(formatAmountInput(n));
  }

  function handleAddSubCat() {
    if (!newSubName.trim() || !mainCatId) return;
    addSubCategory(mainCatId, newSubName.trim());
    setNewSubName(''); setAddingSubCat(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !mainCatId) return;

    // ── 예산 경고 체크 (예산 제외 항목은 스킵) ──────────────────
    if (type === 'expense' && !isCurrentSubExcluded && monthBudget?.amount && projectedStatus) {
      const newPct = projectedStatus.percent;

      if (newPct >= 100) {
        const over = projectedExpense - monthBudget.amount;
        const confirmed = confirm(
          `⚠️ 월 예산 초과 경고\n\n` +
          `이번 지출을 추가하면 월 예산을 ${over.toLocaleString('ko-KR')}원 초과합니다.\n` +
          `(예산 ${monthBudget.amount.toLocaleString('ko-KR')}원 → 지출 ${projectedExpense.toLocaleString('ko-KR')}원, ${newPct}%)\n\n` +
          `그래도 저장할까요?`,
        );
        if (!confirmed) return;
      }
    }

    onSave({
      type, amount, date,
      mainCategoryId:   mainCatId,
      mainCategoryName: activeCat?.name ?? '기타',
      subCategoryId:    subCatId || UNCLASSIFIED_SUB.id,
      subCategoryName:  activeSubCat?.name ?? UNCLASSIFIED_SUB.name,
      memo,
    });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? '내역 수정' : '내역 추가'}>
      <form onSubmit={handleSubmit} className="px-4 pt-3 pb-6 space-y-5">

        {/* ① 수입/지출 */}
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-3 text-sm font-bold transition-colors rounded-xl ${
                type === t
                  ? t === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {t === 'expense' ? '지출' : '수입'}
            </button>
          ))}
        </div>

        {/* ② 대항목 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">대항목</p>
          <div className="grid grid-cols-4 gap-2">
            {mainCats.map(cat => {
              const active = cat.id === mainCatId;
              return (
                <button key={cat.id} type="button" onClick={() => setMainCatId(cat.id)}
                  className={`relative flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                    active ? 'border-transparent shadow-md scale-[1.03]' : 'border-gray-100 bg-gray-50'
                  }`}
                  style={active ? { backgroundColor: cat.color + '18', borderColor: cat.color } : {}}
                >
                  {active && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cat.color }}>
                      <Check size={9} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                    {cat.name[0]}
                  </span>
                  <span className="text-[11px] font-medium leading-tight text-center px-0.5"
                    style={active ? { color: cat.color, fontWeight: 700 } : { color: '#6b7280' }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ③ 세부항목 */}
        {activeCat && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">세부항목</p>
            <div className="flex flex-wrap gap-2">
              {subCats.map(sub => {
                const active = sub.id === subCatId;
                return (
                  <button key={sub.id} type="button" onClick={() => setSubCatId(sub.id)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                      active ? 'text-white border-transparent shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                    style={active ? { backgroundColor: activeCat.color } : {}}
                  >
                    {sub.name}
                  </button>
                );
              })}
              {addingSubCat ? (
                <div className="flex items-center gap-1.5">
                  <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubCat(); } }}
                    placeholder="항목명" autoFocus maxLength={12}
                    className="w-24 px-3 py-1.5 text-sm border border-blue-300 rounded-full focus:outline-none" />
                  <button type="button" onClick={handleAddSubCat}
                    className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Check size={13} strokeWidth={3} />
                  </button>
                  <button type="button" onClick={() => setAddingSubCat(false)}
                    className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingSubCat(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center gap-1">
                  <Plus size={12} /> 추가
                </button>
              )}
            </div>
          </div>
        )}

        {/* ④ 금액 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">금액</p>
          <div className="relative bg-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
            <input type="text" inputMode="numeric" value={amountStr}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0"
              className="w-full text-3xl font-bold text-center py-4 px-12 bg-transparent focus:outline-none tracking-tight"
              style={{ color: type === 'expense' ? '#ef4444' : '#2563eb' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">원</span>
          </div>

          {/* 예산 사용률 프리뷰 */}
          {showBudgetHint && projectedStatus && (
            <div className={`mt-2 rounded-xl p-3 border ${
              projectedStatus.level === 'over'    ? 'bg-red-50 border-red-200' :
              projectedStatus.level === 'danger'  ? 'bg-red-50 border-red-200' :
              projectedStatus.level === 'warning' ? 'bg-orange-50 border-orange-200' :
              projectedStatus.level === 'caution' ? 'bg-amber-50 border-amber-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={13} className={projectedStatus.textColor} />
                <span className={`text-xs font-semibold ${projectedStatus.textColor}`}>
                  입력 후 예산 사용률
                </span>
                <span className={`ml-auto text-xs font-bold ${projectedStatus.textColor}`}>
                  {projectedStatus.percent}%
                </span>
              </div>
              <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${projectedStatus.progressColor}`}
                  style={{ width: `${Math.min(projectedStatus.percent, 100)}%` }}
                />
              </div>
              <p className={`text-[11px] mt-1 ${projectedStatus.subTextColor}`}>
                {projectedStatus.message}
              </p>
            </div>
          )}
        </div>

        {/* ⑤ 메모 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">메모 <span className="font-normal text-gray-400">(선택)</span></p>
          <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="내용을 입력하세요" maxLength={50}
            className="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
          />
        </div>

        {/* 날짜 */}
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-gray-500 shrink-0">날짜</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
          />
        </div>

        {/* 저장 버튼 */}
        <button type="submit" disabled={!amount || !mainCatId}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] ${
            amount && mainCatId
              ? type === 'expense' ? 'bg-red-500 hover:bg-red-600 shadow-sm' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {initial ? '수정 완료' : type === 'expense' ? '지출 추가' : '수입 추가'}
        </button>
      </form>
    </Modal>
  );
}
