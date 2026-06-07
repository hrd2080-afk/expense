'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronLeft, ChevronRight, TrendingDown, TrendingUp,
  Minus, CalendarDays, ShoppingCart, Zap, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useApp } from '@/components/providers/AppDataContext';
import {
  getMonthTransactions, getMainCategoryStats, getSubCategoryStats,
  getTotalIncome, getTotalExpense,
  getMonthlyData, getMonthlyBudgetComparison,
  getBudgetStatus, getBudgetExpense,
  getMonthStats, getWeeklyExpense, getExpenseByDayOfWeek,
  getAllSubCategoryRanking, getMonthOverMonthComparison,
} from '@/utils/calculations';
import {
  getCurrentYearMonth, formatMonth, getPastMonths,
  formatAmount, formatDate, getRemainingDaysInMonth,
} from '@/utils/formatters';

const CategoryChart = dynamic(() => import('@/components/stats/CategoryChart'), { ssr: false });
const MonthlyChart  = dynamic(() => import('@/components/stats/MonthlyChart'),  { ssr: false });
const WeeklyChart   = dynamic(() => import('@/components/stats/WeeklyChart'),   { ssr: false });

type Tab = 'expense' | 'income' | 'trend';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'expense', label: '지출 분석', icon: PieChart  },
  { id: 'income',  label: '수입 분석', icon: TrendingUp },
  { id: 'trend',   label: '기록/추이', icon: BarChart3  },
];

// ── 컴포넌트: 세부항목 하나 ──────────────────────────────────────
function SubRankRow({
  rank, name, mainName, amount, total, color,
}: {
  rank: number; name: string; mainName: string;
  amount: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-xs font-bold text-gray-300 w-4 text-right shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium text-gray-800 truncate">{name}</span>
            <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">{mainName}</span>
          </div>
          <span className="text-xs font-semibold text-gray-700 shrink-0 ml-2">
            {formatAmount(amount)}원
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <span className="text-[11px] text-gray-400 w-7 text-right shrink-0">{pct}%</span>
    </div>
  );
}

// ── 컴포넌트: 전월 대비 행 ──────────────────────────────────────
function CompareRow({
  name, current, previous, change, changePercent, color,
}: {
  name: string; current: number; previous: number;
  change: number; changePercent: number; color?: string;
}) {
  const isUp   = change > 0;
  const isDown = change < 0;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ backgroundColor: (color ?? '#94a3b8') + '20', color: color ?? '#94a3b8' }}
      >
        {name[0]}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-700">{name}</span>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-gray-800">{formatAmount(current)}원</p>
        <p className="text-[10px] text-gray-400">전월 {formatAmount(previous)}원</p>
      </div>
      <div className={`flex items-center gap-0.5 text-xs font-bold shrink-0 w-16 justify-end ${isUp ? 'text-red-500' : isDown ? 'text-emerald-600' : 'text-gray-400'}`}>
        {isUp   && <ArrowUpRight size={12} />}
        {isDown && <ArrowDownRight size={12} />}
        {!isUp && !isDown && <Minus size={10} />}
        <span>{isUp ? '+' : ''}{changePercent}%</span>
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function StatsPage() {
  const { transactions, categories, budgets } = useApp();
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [tab, setTab]     = useState<Tab>('expense');
  const [showAllSub, setShowAllSub] = useState(false);

  function shiftMonth(delta: number) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setShowAllSub(false);
  }

  // ── 기본 데이터 ────────────────────────────────────────────────
  const monthTx    = getMonthTransactions(transactions, month);

  // 통계 제외 세부항목 ID 집합
  const statsExcludedIds = new Set(
    categories.flatMap(c => c.subCategories.filter(s => s.excludeFromStats).map(s => s.id))
  );
  const statsTx   = transactions.filter(t => !statsExcludedIds.has(t.subCategoryId));
  const monthStatsTx = monthTx.filter(t => !statsExcludedIds.has(t.subCategoryId));

  const income     = getTotalIncome(monthTx);
  const expense    = getTotalExpense(monthStatsTx);
  const balance    = income - expense;
  const stats      = getMonthStats(statsTx, month);

  // 전월
  const [py, pm]   = month.split('-').map(Number);
  const prevDate   = new Date(py, pm - 2, 1);
  const prevMonth  = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // 예산
  const budgetExpense  = getBudgetExpense(monthTx, categories);
  const monthBudget    = budgets[month];
  const budgetStatus   = monthBudget ? getBudgetStatus(budgetExpense, monthBudget.amount) : null;
  const isCurrent      = month === getCurrentYearMonth();
  const remainDays     = isCurrent ? getRemainingDaysInMonth() : 0;

  // 지출 분석
  const mainStats  = getMainCategoryStats(monthStatsTx);
  const pieData    = Object.values(mainStats)
    .filter(s => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(s => ({ id: s.id, name: s.name, amount: s.amount, color: categories.find(c => c.id === s.id)?.color ?? '#94a3b8' }));

  const subRanking = getAllSubCategoryRanking(monthStatsTx);
  const visibleSubs = showAllSub ? subRanking : subRanking.slice(0, 8);

  const momData = getMonthOverMonthComparison(statsTx, month, prevMonth);

  // 수입 분석
  const incomeMap: Record<string, { id: string; name: string; amount: number; color: string; count: number }> = {};
  monthTx.filter(t => t.type === 'income').forEach(t => {
    const cat = categories.find(c => c.id === t.mainCategoryId);
    if (!incomeMap[t.mainCategoryId]) {
      incomeMap[t.mainCategoryId] = { id: t.mainCategoryId, name: t.mainCategoryName, amount: 0, color: cat?.color ?? '#2563eb', count: 0 };
    }
    incomeMap[t.mainCategoryId].amount += t.amount;
    incomeMap[t.mainCategoryId].count++;
  });
  const incomeList = Object.values(incomeMap).sort((a, b) => b.amount - a.amount);

  // 수입 세부항목 랭킹
  const incomeSubRanking = getAllSubCategoryRanking(
    monthTx.filter(t => t.type === 'income').map(t => ({ ...t, type: 'expense' as const }))
  ).map(s => ({ ...s, type: 'income' as const }));

  // 기록/추이
  const weekly     = getWeeklyExpense(statsTx, month);
  const weeklyMax  = Math.max(...weekly.map(w => w.amount), 1);
  const dowData    = getExpenseByDayOfWeek(statsTx, month);
  const dowMax     = Math.max(...dowData.map(d => d.amount), 1);
  const past6      = getPastMonths(6);
  const monthly    = getMonthlyData(statsTx, past6);
  const budgetComp = getMonthlyBudgetComparison(statsTx, budgets, past6);

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
        <div className="px-4 pt-12 pb-2">
          <h1 className="text-xl font-bold text-gray-900">통계</h1>
        </div>

        {/* 월 선택 */}
        <div className="flex items-center justify-between px-4 pb-2">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setMonth(getCurrentYearMonth())}
            className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${isCurrent ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            {formatMonth(month)}
          </button>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex px-4 pb-0 gap-0 border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={13} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">

        {/* ─── 이번 달 잔액 요약 (공통) ─── */}
        <div className={`rounded-2xl p-4 text-white shadow-md ${balance >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/70 mb-1">{formatMonth(month)} 잔액</p>
              <p className="text-2xl font-extrabold tracking-tight">
                {balance >= 0 ? '' : '−'}{formatAmount(Math.abs(balance))}원
              </p>
            </div>
            {monthBudget && budgetStatus && (
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                budgetStatus.level === 'over' || budgetStatus.level === 'danger'
                  ? 'bg-red-400/30 text-red-100'
                  : 'bg-white/20 text-white'
              }`}>
                예산 {budgetStatus.percent}%
              </div>
            )}
          </div>
          <div className="flex gap-5 mt-3">
            <div><p className="text-xs text-white/70">수입</p><p className="text-sm font-semibold">+{formatAmount(income)}원</p></div>
            <div><p className="text-xs text-white/70">지출</p><p className="text-sm font-semibold">−{formatAmount(expense)}원</p></div>
            <div><p className="text-xs text-white/70">거래</p><p className="text-sm font-semibold">{stats.expenseTxCount + stats.incomeTxCount}건</p></div>
          </div>
        </div>

        {/* ══════════ TAB: 지출 분석 ══════════ */}
        {tab === 'expense' && (
          <>
            {/* 핵심 지표 4개 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '일평균 지출', value: `${formatAmount(stats.avgDailyExpense)}원`, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', sub: `${stats.elapsedDays}일 경과` },
                { label: '건당 평균', value: `${formatAmount(stats.avgExpensePerTx)}원`, icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50', sub: `${stats.expenseTxCount}건` },
                {
                  label: '최다 지출일',
                  value: stats.maxSpendingDay.date ? formatDate(stats.maxSpendingDay.date).replace(/\(.*\)/, '').trim() : '없음',
                  icon: CalendarDays, color: 'text-red-500', bg: 'bg-red-50',
                  sub: stats.maxSpendingDay.amount > 0 ? `${formatAmount(stats.maxSpendingDay.amount)}원` : '—',
                },
                {
                  label: '총 지출',
                  value: `${formatAmount(expense)}원`,
                  icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50',
                  sub: monthBudget ? `예산의 ${Math.round((expense / monthBudget.amount) * 100)}%` : '예산 미설정',
                },
              ].map(({ label, value, icon: Icon, color, bg, sub }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bg}`}>
                      <Icon size={13} className={color} />
                    </div>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className="text-base font-bold text-gray-900 leading-tight">{value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* 예산 달성 (예산 있을 때) */}
            {monthBudget && budgetStatus && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">예산 달성 현황</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${budgetStatus.bgGradient.includes('emerald') ? 'bg-emerald-50 text-emerald-600' : budgetStatus.bgGradient.includes('amber') ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {budgetStatus.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400">예산</p>
                    <p className="text-sm font-bold text-gray-700">{formatAmount(monthBudget.amount)}원</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-xl">
                    <p className="text-[10px] text-gray-400">집계 지출</p>
                    <p className="text-sm font-bold text-red-500">{formatAmount(budgetExpense)}원</p>
                  </div>
                  <div className={`text-center p-2 rounded-xl ${monthBudget.amount - budgetExpense >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-[10px] text-gray-400">{monthBudget.amount - budgetExpense >= 0 ? '절약' : '초과'}</p>
                    <p className={`text-sm font-bold ${monthBudget.amount - budgetExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatAmount(Math.abs(monthBudget.amount - budgetExpense))}원
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full ${budgetStatus.progressColor}`}
                    style={{ width: `${Math.min(budgetStatus.percent, 100)}%` }} />
                </div>
                {isCurrent && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    남은 {remainDays}일 · 하루 {formatAmount(Math.max(Math.floor((monthBudget.amount - budgetExpense) / Math.max(remainDays, 1)), 0))}원 가능
                  </p>
                )}
              </div>
            )}

            {/* 대항목 파이차트 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">대항목별 지출</h3>
              {expense > 0 ? (
                <CategoryChart data={pieData} total={expense} />
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">지출 내역이 없습니다</p>
              )}
            </div>

            {/* 세부항목 전체 랭킹 */}
            {subRanking.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">세부항목 지출 랭킹</h3>
                  <span className="text-xs text-gray-400">{subRanking.length}개 항목</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {visibleSubs.map((s, i) => {
                    const cat = categories.find(c => c.id === s.mainId);
                    return (
                      <SubRankRow
                        key={s.id}
                        rank={i + 1}
                        name={s.name}
                        mainName={s.mainName}
                        amount={s.amount}
                        total={expense}
                        color={cat?.color ?? '#94a3b8'}
                      />
                    );
                  })}
                </div>
                {subRanking.length > 8 && (
                  <button
                    onClick={() => setShowAllSub(v => !v)}
                    className="mt-3 w-full py-2 text-xs text-blue-500 font-medium hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    {showAllSub ? '접기 ↑' : `전체 보기 (${subRanking.length}개) ↓`}
                  </button>
                )}
              </div>
            )}

            {/* 전월 대비 */}
            {momData.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">전월 대비</h3>
                  <span className="text-xs text-gray-400">vs {formatMonth(prevMonth)}</span>
                </div>
                {momData.map(d => {
                  const cat = categories.find(c => c.id === d.id);
                  return (
                    <CompareRow key={d.id} {...d} color={cat?.color} />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════ TAB: 수입 분석 ══════════ */}
        {tab === 'income' && (
          <>
            {/* 수입 핵심 지표 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                    <TrendingUp size={13} className="text-blue-500" />
                  </div>
                  <span className="text-xs text-gray-500">총 수입</span>
                </div>
                <p className="text-base font-bold text-blue-600">{formatAmount(income)}원</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{stats.incomeTxCount}건</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Zap size={13} className="text-emerald-500" />
                  </div>
                  <span className="text-xs text-gray-500">지출 대비</span>
                </div>
                <p className={`text-base font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {balance >= 0 ? '+' : '−'}{formatAmount(Math.abs(balance))}원
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {income > 0 ? `저축률 ${Math.max(0, Math.round((balance / income) * 100))}%` : '—'}
                </p>
              </div>
            </div>

            {/* 수입 대항목별 */}
            {incomeList.length > 0 ? (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">수입 대항목별</h3>
                <div className="space-y-3">
                  {incomeList.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: s.color + '20', color: s.color }}>
                        {s.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800">{s.name}</span>
                          <span className="text-sm font-bold text-blue-600">+{formatAmount(s.amount)}원</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.round((s.amount / income) * 100)}%`, backgroundColor: s.color }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.count}건 · {Math.round((s.amount / income) * 100)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center py-12">
                <TrendingUp size={32} className="text-gray-200 mx-auto mb-2" strokeWidth={1} />
                <p className="text-sm text-gray-400">이번 달 수입 내역이 없습니다</p>
              </div>
            )}

            {/* 수입 세부항목 */}
            {incomeSubRanking.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">수입 세부항목 랭킹</h3>
                <div className="divide-y divide-gray-50">
                  {incomeSubRanking.map((s, i) => {
                    const cat = categories.find(c => c.id === s.mainId);
                    return (
                      <SubRankRow
                        key={s.id}
                        rank={i + 1}
                        name={s.name}
                        mainName={s.mainName}
                        amount={s.amount}
                        total={income}
                        color={cat?.color ?? '#2563eb'}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 지출 vs 수입 막대 비교 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">수입 vs 지출</h3>
              {[
                { label: '수입', amount: income, max: Math.max(income, expense), color: '#3b82f6' },
                { label: '지출', amount: expense, max: Math.max(income, expense), color: '#ef4444' },
              ].map(({ label, amount, max, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="font-bold" style={{ color }}>{formatAmount(amount)}원</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: max > 0 ? `${Math.round((amount / max) * 100)}%` : '0%', backgroundColor: color }} />
                  </div>
                </div>
              ))}
              <div className={`mt-3 p-3 rounded-xl ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className={`text-sm font-semibold text-center ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {balance >= 0 ? '💚 ' : '🔴 '}
                  이번 달 {balance >= 0 ? '저축' : '적자'} {formatAmount(Math.abs(balance))}원
                  {income > 0 && ` (${Math.abs(Math.round((balance / income) * 100))}%)`}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══════════ TAB: 기록/추이 ══════════ */}
        {tab === 'trend' && (
          <>
            {/* 주차별 지출 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">주차별 지출</h3>
              <p className="text-xs text-gray-400 mb-3">{formatMonth(month)} 주차별 지출 패턴</p>
              {expense > 0 ? (
                <>
                  <WeeklyChart data={weekly} maxAmount={weeklyMax} />
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {weekly.map(w => (
                      <div key={w.week} className="text-center">
                        <p className="text-[10px] text-gray-400">{w.days}</p>
                        <p className="text-[11px] font-semibold text-gray-700">
                          {w.amount > 0 ? formatAmount(Math.round(w.amount / 10000)) + '만' : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">지출 내역이 없습니다</p>
              )}
            </div>

            {/* 요일별 지출 패턴 */}
            {expense > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">요일별 지출 패턴</h3>
                <p className="text-xs text-gray-400 mb-3">{formatMonth(month)} 요일별 총 지출</p>
                <div className="space-y-2">
                  {dowData.map(d => {
                    const pct = dowMax > 0 ? Math.round((d.amount / dowMax) * 100) : 0;
                    const isWeekend = d.day === '토' || d.day === '일';
                    return (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className={`text-xs font-semibold w-4 shrink-0 ${isWeekend ? 'text-blue-500' : 'text-gray-500'}`}>
                          {d.day}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isWeekend ? '#6366f1' : '#94a3b8',
                            }}
                          />
                        </div>
                        <div className="text-right shrink-0 w-24">
                          <span className="text-xs font-semibold text-gray-700">
                            {d.amount > 0 ? formatAmount(d.amount) + '원' : '—'}
                          </span>
                          {d.count > 0 && (
                            <span className="text-[10px] text-gray-400 ml-1">({d.count}건)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 예산 달성 현황 (6개월) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                월별 예산 달성 <span className="text-gray-400 font-normal">(최근 6개월)</span>
              </h3>
              {budgetComp.some(b => b.budgetAmount > 0) ? (
                <div className="space-y-3">
                  {budgetComp.map(b => {
                    if (!b.budgetAmount) return null;
                    const st     = getBudgetStatus(b.expense, b.budgetAmount);
                    const isOver = b.saving < 0;
                    return (
                      <div key={b.month} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">{formatMonth(b.month)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400">
                              {formatAmount(b.expense)} / {formatAmount(b.budgetAmount)}원
                            </span>
                            <span className={`text-xs font-bold flex items-center gap-0.5 ${isOver ? 'text-red-500' : 'text-emerald-600'}`}>
                              {isOver ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                              {isOver ? `초과 ${formatAmount(Math.abs(b.saving))}` : `절약 ${formatAmount(b.saving)}`}원
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${st.progressColor}`}
                            style={{ width: `${Math.min(st.percent, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className={st.textColor}>{st.percent}%</span>
                          <span className="text-gray-400">{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">설정된 예산이 없습니다</p>
              )}
            </div>

            {/* 월별 수입·지출 추이 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                월별 수입·지출 추이 <span className="text-gray-400 font-normal">(최근 6개월)</span>
              </h3>
              {transactions.length > 0 ? (
                <MonthlyChart data={monthly} />
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">내역이 없습니다</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
