export type TransactionType = 'income' | 'expense';

export interface SubCategory {
  id: string;
  name: string;
  excludeFromBudget?: boolean; // true면 예산 계산에서 제외
  excludeFromStats?: boolean;  // true면 통계에서 제외
}

export interface MainCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  subCategories: SubCategory[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  mainCategoryId: string;
  mainCategoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  memo: string;
  createdAt: string;
}

/**
 * 월별 예산 — 나중에 categories 필드로 대항목별 예산도 지원
 */
export interface MonthlyBudget {
  month: string;              // YYYY-MM
  amount: number;             // 월 총 지출 예산
  categories?: Record<string, number>; // 대항목별 예산 (추후 확장)
}

export interface AppState {
  transactions: Transaction[];
  categories: MainCategory[];
  budgets: Record<string, MonthlyBudget>; // key: YYYY-MM
}

export interface FilterState {
  type: 'all' | TransactionType;
  mainCategoryId: string;
  subCategoryId: string;
  month: string;
}

// ── 예산 경고 단계 ─────────────────────────────────────
export type BudgetLevel = 'none' | 'safe' | 'caution' | 'warning' | 'danger' | 'over';

export interface BudgetStatus {
  level: BudgetLevel;
  percent: number;
  label: string;
  message: string;
  progressColor: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
}
