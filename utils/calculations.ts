import type { Transaction, MonthlyBudget, BudgetStatus, BudgetLevel, MainCategory } from '@/types';
import {
  getYearMonthFromDate,
  getCurrentYearMonth,
  getRemainingDaysInMonth,
  getCurrentDate,
} from './formatters';

// ── 기본 집계 ────────────────────────────────────────────────────
export function getMonthTransactions(transactions: Transaction[], yearMonth: string): Transaction[] {
  return transactions.filter(t => getYearMonthFromDate(t.date) === yearMonth);
}

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

export function getTotalExpense(transactions: Transaction[]): number {
  return transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

export function getBalance(transactions: Transaction[]): number {
  return getTotalIncome(transactions) - getTotalExpense(transactions);
}

export function getTodayExpense(transactions: Transaction[]): number {
  const today = getCurrentDate();
  return transactions
    .filter(t => t.type === 'expense' && t.date === today)
    .reduce((s, t) => s + t.amount, 0);
}

// ── 예산 제외 항목 처리 ───────────────────────────────────────────

/** 예산에서 제외된 세부항목 ID 집합 반환 */
function getExcludedSubIds(categories: MainCategory[]): Set<string> {
  return new Set(
    categories.flatMap(c =>
      c.subCategories.filter(s => s.excludeFromBudget).map(s => s.id),
    ),
  );
}

/** 예산 계산용 지출 합계 (excludeFromBudget 항목 제외) */
export function getBudgetExpense(
  transactions: Transaction[],
  categories: MainCategory[],
): number {
  const excluded = getExcludedSubIds(categories);
  return transactions
    .filter(t => t.type === 'expense' && !excluded.has(t.subCategoryId))
    .reduce((s, t) => s + t.amount, 0);
}

/** 예산에서 제외된 항목 이름 목록 (예: ["사업비 > 인건비"]) */
export function getExcludedBudgetLabels(categories: MainCategory[]): string[] {
  return categories.flatMap(c =>
    c.subCategories
      .filter(s => s.excludeFromBudget)
      .map(s => `${c.name} > ${s.name}`),
  );
}

// ── 예산 조회 ─────────────────────────────────────────────────────
export function getBudgetForMonth(
  budgets: Record<string, MonthlyBudget>,
  month?: string,
): MonthlyBudget | null {
  const m = month ?? getCurrentYearMonth();
  return budgets[m] ?? null;
}

// ── 예산 경고 단계 계산 ───────────────────────────────────────────
const LEVEL_MAP: Record<Exclude<BudgetLevel, 'none'>, Omit<BudgetStatus, 'level' | 'percent'>> = {
  safe: {
    label: '✅ 안정',
    message: '예산을 잘 지키고 있어요.',
    progressColor: 'bg-emerald-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    subTextColor: 'text-emerald-600',
  },
  caution: {
    label: '⚡ 주의',
    message: '예산의 절반을 넘었어요. 지출 속도를 확인하세요.',
    progressColor: 'bg-amber-400',
    bgGradient: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    subTextColor: 'text-amber-600',
  },
  warning: {
    label: '⚠️ 경고',
    message: '예산의 70% 이상을 사용했어요. 불필요한 지출을 줄여보세요.',
    progressColor: 'bg-orange-500',
    bgGradient: 'from-orange-50 to-amber-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    subTextColor: 'text-orange-600',
  },
  danger: {
    label: '🚨 위험',
    message: '예산이 거의 소진됐어요. 꼭 필요한 지출만 권장합니다.',
    progressColor: 'bg-red-500',
    bgGradient: 'from-red-50 to-rose-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    subTextColor: 'text-red-600',
  },
  over: {
    label: '🔴 예산 초과',
    message: '이번 달 예산을 초과했습니다. 추가 지출을 신중히 관리하세요.',
    progressColor: 'bg-red-600',
    bgGradient: 'from-red-100 to-rose-100',
    borderColor: 'border-red-400',
    textColor: 'text-red-800',
    subTextColor: 'text-red-700',
  },
};

export function getBudgetStatus(expense: number, budgetAmount: number): BudgetStatus {
  if (!budgetAmount || budgetAmount <= 0) {
    return {
      level: 'none', percent: 0,
      label: '', message: '',
      progressColor: 'bg-gray-200',
      bgGradient: 'from-white to-gray-50',
      borderColor: 'border-gray-100',
      textColor: 'text-gray-400',
      subTextColor: 'text-gray-400',
    };
  }

  const percent = Math.round((expense / budgetAmount) * 100);
  let level: Exclude<BudgetLevel, 'none'>;
  if (percent >= 100) level = 'over';
  else if (percent >= 90) level = 'danger';
  else if (percent >= 70) level = 'warning';
  else if (percent >= 50) level = 'caution';
  else level = 'safe';

  return { level, percent, ...LEVEL_MAP[level] };
}

// ── 예산 대비 현황 ─────────────────────────────────────────────────
export function getDailyAvailableAmount(
  expense: number,
  budgetAmount: number,
  remainingDays?: number,
): number {
  if (!budgetAmount) return 0;
  const days = remainingDays ?? getRemainingDaysInMonth();
  const remaining = budgetAmount - expense;
  return days > 0 ? Math.floor(remaining / days) : 0;
}

export function getBudgetUsagePercent(expense: number, budgetAmount: number): number {
  if (!budgetAmount) return 0;
  return Math.round((expense / budgetAmount) * 100);
}

// ── 월별 예산 비교 데이터 ──────────────────────────────────────────
export function getMonthlyBudgetComparison(
  transactions: Transaction[],
  budgets: Record<string, MonthlyBudget>,
  months: string[],
): Array<{
  month: string;
  income: number;
  expense: number;
  budgetAmount: number;
  saving: number;  // positive = 절약, negative = 초과
}> {
  return months.map(month => {
    const tx = getMonthTransactions(transactions, month);
    const income  = getTotalIncome(tx);
    const expense = getTotalExpense(tx);
    const budgetAmount = budgets[month]?.amount ?? 0;
    return { month, income, expense, budgetAmount, saving: budgetAmount - expense };
  });
}

// ── 대항목 / 세부항목 집계 ─────────────────────────────────────────
export function getMainCategoryStats(
  transactions: Transaction[],
): Record<string, { id: string; name: string; amount: number }> {
  const result: Record<string, { id: string; name: string; amount: number }> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!result[t.mainCategoryId]) {
      result[t.mainCategoryId] = { id: t.mainCategoryId, name: t.mainCategoryName, amount: 0 };
    }
    result[t.mainCategoryId].amount += t.amount;
  });
  return result;
}

export function getSubCategoryStats(
  transactions: Transaction[],
  mainCategoryId?: string,
): Record<string, { id: string; name: string; mainId: string; mainName: string; amount: number }> {
  const result: Record<string, { id: string; name: string; mainId: string; mainName: string; amount: number }> = {};
  const filtered = transactions.filter(
    t => t.type === 'expense' && (!mainCategoryId || t.mainCategoryId === mainCategoryId),
  );
  filtered.forEach(t => {
    if (!result[t.subCategoryId]) {
      result[t.subCategoryId] = {
        id: t.subCategoryId, name: t.subCategoryName,
        mainId: t.mainCategoryId, mainName: t.mainCategoryName,
        amount: 0,
      };
    }
    result[t.subCategoryId].amount += t.amount;
  });
  return result;
}

export function getMonthlyData(
  transactions: Transaction[],
  months: string[],
): Array<{ month: string; income: number; expense: number }> {
  return months.map(month => {
    const tx = getMonthTransactions(transactions, month);
    return { month, income: getTotalIncome(tx), expense: getTotalExpense(tx) };
  });
}

// ── 월 핵심 지표 ──────────────────────────────────────────────────
export interface MonthStats {
  totalExpense: number;
  totalIncome: number;
  expenseTxCount: number;
  incomeTxCount: number;
  avgExpensePerTx: number;
  avgDailyExpense: number;
  maxSpendingDay: { date: string; amount: number };
  elapsedDays: number;
  daysInMonth: number;
}

export function getMonthStats(transactions: Transaction[], yearMonth: string): MonthStats {
  const monthTx   = getMonthTransactions(transactions, yearMonth);
  const expenseTx = monthTx.filter(t => t.type === 'expense');
  const incomeTx  = monthTx.filter(t => t.type === 'income');
  const [y, m]    = yearMonth.split('-').map(Number);

  const now           = new Date();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const daysInMonth   = new Date(y, m, 0).getDate();
  const elapsedDays   = isCurrentMonth ? now.getDate() : daysInMonth;

  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = incomeTx.reduce((s, t) => s + t.amount, 0);

  // 일별 지출 합계 → 최다 지출일 찾기
  const dailyMap: Record<string, number> = {};
  expenseTx.forEach(t => { dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount; });
  const maxEntry = Object.entries(dailyMap).sort((a, b) => b[1] - a[1])[0];

  return {
    totalExpense, totalIncome,
    expenseTxCount: expenseTx.length,
    incomeTxCount: incomeTx.length,
    avgExpensePerTx: expenseTx.length > 0 ? Math.floor(totalExpense / expenseTx.length) : 0,
    avgDailyExpense: elapsedDays > 0 ? Math.floor(totalExpense / elapsedDays) : 0,
    maxSpendingDay: maxEntry ? { date: maxEntry[0], amount: maxEntry[1] } : { date: '', amount: 0 },
    elapsedDays,
    daysInMonth,
  };
}

// ── 주차별 지출 ────────────────────────────────────────────────────
export function getWeeklyExpense(
  transactions: Transaction[],
  yearMonth: string,
): Array<{ week: string; days: string; amount: number }> {
  const [y, m]      = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthTx     = getMonthTransactions(transactions, yearMonth);

  const slots = [
    { week: '1주', start: 1,  end: 7 },
    { week: '2주', start: 8,  end: 14 },
    { week: '3주', start: 15, end: 21 },
    { week: '4주', start: 22, end: 28 },
    { week: '5주', start: 29, end: daysInMonth },
  ].filter(s => s.start <= daysInMonth);

  return slots.map(s => {
    const end = Math.min(s.end, daysInMonth);
    const amount = monthTx
      .filter(t => {
        if (t.type !== 'expense') return false;
        const day = parseInt(t.date.split('-')[2], 10);
        return day >= s.start && day <= end;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return { week: s.week, days: `${s.start}~${end}일`, amount };
  });
}

// ── 요일별 지출 합계 ──────────────────────────────────────────────
export function getExpenseByDayOfWeek(
  transactions: Transaction[],
  yearMonth: string,
): Array<{ day: string; amount: number; count: number }> {
  const DAYS    = ['월', '화', '수', '목', '금', '토', '일'];
  const totals  = Array(7).fill(0);
  const counts  = Array(7).fill(0);
  const monthTx = getMonthTransactions(transactions, yearMonth);

  monthTx.filter(t => t.type === 'expense').forEach(t => {
    const jsDay = new Date(t.date + 'T00:00:00').getDay(); // 0=Sun
    const idx   = jsDay === 0 ? 6 : jsDay - 1;            // 0=Mon … 6=Sun
    totals[idx] += t.amount;
    counts[idx]++;
  });

  return DAYS.map((day, i) => ({ day, amount: totals[i], count: counts[i] }));
}

// ── 세부항목 전체 랭킹 ────────────────────────────────────────────
export function getAllSubCategoryRanking(
  transactions: Transaction[],
): Array<{ id: string; name: string; mainId: string; mainName: string; amount: number; count: number }> {
  const map: Record<string, { id: string; name: string; mainId: string; mainName: string; amount: number; count: number }> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!map[t.subCategoryId]) {
      map[t.subCategoryId] = {
        id: t.subCategoryId, name: t.subCategoryName,
        mainId: t.mainCategoryId, mainName: t.mainCategoryName,
        amount: 0, count: 0,
      };
    }
    map[t.subCategoryId].amount += t.amount;
    map[t.subCategoryId].count++;
  });
  return Object.values(map).sort((a, b) => b.amount - a.amount);
}

// ── 전월 대비 비교 ────────────────────────────────────────────────
export function getMonthOverMonthComparison(
  transactions: Transaction[],
  currentMonth: string,
  prevMonth: string,
): Array<{
  id: string; name: string; color?: string;
  current: number; previous: number;
  change: number; changePercent: number;
}> {
  const curStats  = getMainCategoryStats(getMonthTransactions(transactions, currentMonth));
  const prevStats = getMainCategoryStats(getMonthTransactions(transactions, prevMonth));
  const allIds    = new Set([...Object.keys(curStats), ...Object.keys(prevStats)]);

  return Array.from(allIds)
    .map(id => {
      const cur  = curStats[id]?.amount  ?? 0;
      const prev = prevStats[id]?.amount ?? 0;
      return {
        id, name: curStats[id]?.name ?? prevStats[id]?.name ?? id,
        current: cur, previous: prev, change: cur - prev,
        changePercent: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0),
      };
    })
    .filter(d => d.current > 0 || d.previous > 0)
    .sort((a, b) => b.current - a.current);
}

// ── 일별 지출 맵 ──────────────────────────────────────────────────
export function getDailyExpenseMap(
  transactions: Transaction[],
  yearMonth: string,
): Record<string, number> {
  return getMonthTransactions(transactions, yearMonth)
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.date] = (acc[t.date] || 0) + t.amount;
      return acc;
    }, {});
}

export function groupTransactionsByDate(
  transactions: Transaction[],
): Array<{ date: string; items: Transaction[] }> {
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
