import type { AppState, Transaction, MonthlyBudget, MainCategory } from '@/types';
import { DEFAULT_CATEGORIES, UNCLASSIFIED_SUB } from './defaultCategories';
import { getCurrentYearMonth } from './formatters';

const KEY_V2 = 'gpter-expense-v2';
const KEY_V1 = 'gpter-expense-v1';

const DEFAULT_STATE: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: {},
};

const OLD_CAT_NAMES: Record<string, string> = {
  food: '식비', transport: '교통/차량', education: '교육비', medical: '건강/의료',
  living: '생활비', telecom: '주거/고정비', insurance: '주거/고정비',
  rent: '주거/고정비', card: '기타', business: '사업비', other: '기타',
  salary: '근로소득', freelance: '사업소득', investment: '부수입',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTransaction(raw: any): Transaction {
  if (raw.mainCategoryId) return raw as Transaction;
  return {
    id: raw.id,
    type: raw.type as Transaction['type'],
    amount: raw.amount,
    date: raw.date,
    mainCategoryId: raw.categoryId ?? 'etc-expense',
    mainCategoryName: OLD_CAT_NAMES[raw.categoryId ?? ''] ?? '기타',
    subCategoryId: UNCLASSIFIED_SUB.id,
    subCategoryName: UNCLASSIFIED_SUB.name,
    memo: raw.memo ?? '',
    createdAt: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateBudgets(raw: any): Record<string, MonthlyBudget> {
  // Already new format (Record<string, MonthlyBudget>)
  if (raw.budgets && typeof raw.budgets === 'object' && !Array.isArray(raw.budgets)) {
    return raw.budgets as Record<string, MonthlyBudget>;
  }
  // Old format: budget: { monthlyTotal, categories } → convert to current month
  if (raw.budget && typeof raw.budget.monthlyTotal === 'number' && raw.budget.monthlyTotal > 0) {
    const month = getCurrentYearMonth();
    return {
      [month]: {
        month,
        amount: raw.budget.monthlyTotal,
        categories: raw.budget.categories ?? {},
      },
    };
  }
  return {};
}

/**
 * 저장된 카테고리에 DEFAULT_CATEGORIES의 새 필드(excludeFromBudget 등)를 병합.
 * 사용자가 추가/수정한 이름과 색상은 유지하고, 기본값 플래그만 보완.
 */
function mergeWithDefaultFlags(stored: MainCategory[]): MainCategory[] {
  return stored.map(cat => {
    const def = DEFAULT_CATEGORIES.find(d => d.id === cat.id);
    if (!def) return cat;
    return {
      ...cat,
      subCategories: cat.subCategories.map(sub => {
        const defSub = def.subCategories.find(d => d.id === sub.id);
        if (!defSub) return sub;
        // 기존 저장 값에 excludeFromBudget이 없을 때만 기본값 적용
        return sub.excludeFromBudget !== undefined
          ? sub
          : { ...sub, excludeFromBudget: defSub.excludeFromBudget };
      }),
    };
  });
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const v2 = localStorage.getItem(KEY_V2);
    if (v2) {
      const raw = JSON.parse(v2);
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactions: ((raw.transactions ?? []) as any[]).map(migrateTransaction),
        categories: Array.isArray(raw.categories) && raw.categories.length
          ? mergeWithDefaultFlags(raw.categories as MainCategory[])
          : DEFAULT_CATEGORIES,
        budgets: migrateBudgets(raw),
      };
    }

    // v1 migration
    const v1 = localStorage.getItem(KEY_V1);
    if (v1) {
      const old = JSON.parse(v1);
      const migrated: AppState = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactions: ((old.transactions ?? []) as any[]).map(migrateTransaction),
        categories: DEFAULT_CATEGORIES,
        budgets: migrateBudgets(old),
      };
      localStorage.setItem(KEY_V2, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // ignore parse errors
  }

  return DEFAULT_STATE;
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_V2, JSON.stringify(state));
}
