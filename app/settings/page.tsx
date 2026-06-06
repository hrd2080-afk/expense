'use client';

import { useState } from 'react';
import { Database, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/components/providers/AppDataContext';
import CategoryManager from '@/components/settings/CategoryManager';
import BudgetSettings from '@/components/budget/BudgetSettings';
import { getMonthTransactions, getTotalExpense } from '@/utils/calculations';
import { getCurrentYearMonth } from '@/utils/formatters';

type Tab = 'budget' | 'categories' | 'data';

const TABS: { id: Tab; label: string }[] = [
  { id: 'budget',     label: '예산 설정' },
  { id: 'categories', label: '항목 관리' },
  { id: 'data',       label: '데이터'   },
];

export default function SettingsPage() {
  const app = useApp();
  const [tab, setTab]         = useState<Tab>('budget');
  const [confirmReset, setConfirmReset] = useState(false);

  const currentMonth   = getCurrentYearMonth();
  const monthTx        = getMonthTransactions(app.transactions, currentMonth);
  const currentExpense = getTotalExpense(monthTx);

  function handleLoadSample() {
    if (app.transactions.length > 0) {
      if (!confirm('기존 데이터가 모두 샘플 데이터로 교체됩니다.\n계속할까요?')) return;
    }
    app.loadSampleData();
  }

  function handleReset() {
    app.resetData();
    setConfirmReset(false);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-12 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
      </div>

      <div className="px-4 pt-5 pb-6 space-y-4">
        {/* 탭 */}
        <div className="flex rounded-2xl border border-gray-200 bg-gray-100 p-1 gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'budget' && (
          <BudgetSettings
            budgets={app.budgets}
            onSave={app.setMonthlyBudget}
            onDelete={app.deleteMonthlyBudget}
            currentExpense={currentExpense}
          />
        )}

        {tab === 'categories' && <CategoryManager />}

        {tab === 'data' && (
          <div className="space-y-3">
            {/* 현황 카드 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">저장된 데이터</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '거래 내역', value: `${app.transactions.length}건` },
                  { label: '카테고리', value: `${app.categories.length}개` },
                  { label: '예산 설정', value: `${Object.keys(app.budgets).length}개월` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 샘플 데이터 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <Database size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">샘플 데이터 불러오기</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    이번 달 한 달치 샘플 52건을 불러옵니다.<br />
                    통계·예산 기능을 테스트할 수 있어요.
                  </p>
                </div>
              </div>
              <button
                onClick={handleLoadSample}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Database size={15} />
                샘플 데이터 불러오기
              </button>
            </div>

            {/* 데이터 초기화 */}
            <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">전체 초기화</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    모든 거래 내역·예산·설정이 삭제됩니다.<br />
                    복구할 수 없으니 신중하게 사용하세요.
                  </p>
                </div>
              </div>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-3 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} />
                  초기화
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium text-center">
                    정말 모든 데이터를 삭제할까요?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 active:scale-[0.98] transition-all"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
