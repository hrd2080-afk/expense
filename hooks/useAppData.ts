'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppState, Transaction, MonthlyBudget, MainCategory, SubCategory } from '@/types';
import { loadAppState, saveAppState } from '@/utils/storage';
import { generateSampleData } from '@/utils/sampleData';
import { DEFAULT_CATEGORIES, UNCLASSIFIED_SUB } from '@/utils/defaultCategories';
import { makeSubId, makeMainId } from '@/utils/categories';

const DEFAULT_STATE: AppState = {
  transactions: [],
  categories:   DEFAULT_CATEGORIES,
  budgets:      {},
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function useAppData() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드
  useEffect(() => {
    setState(loadAppState());
    setIsLoaded(true);
  }, []);

  // 상태 변경 시 로컬 저장
  useEffect(() => {
    if (!isLoaded) return;
    saveAppState(state);
  }, [state, isLoaded]);

  // ── Transactions ──────────────────────────────────────────────
  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id' | 'createdAt'>) =>
      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, { ...t, id: uid(), createdAt: new Date().toISOString() }],
      })), []);

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) =>
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
      })), []);

  const deleteTransaction = useCallback(
    (id: string) =>
      setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) })),
    []);

  // ── Budget ────────────────────────────────────────────────────
  const setMonthlyBudget = useCallback(
    (month: string, amount: number, categories?: Record<string, number>) =>
      setState(prev => ({
        ...prev,
        budgets: { ...prev.budgets, [month]: { month, amount, ...(categories ? { categories } : {}) } },
      })), []);

  const deleteMonthlyBudget = useCallback(
    (month: string) =>
      setState(prev => {
        const next = { ...prev.budgets };
        delete next[month];
        return { ...prev, budgets: next };
      }), []);

  // ── Categories ────────────────────────────────────────────────
  const addMainCategory = useCallback(
    (name: string, type: MainCategory['type'], color: string) => {
      const cat: MainCategory = { id: makeMainId(name), name, type, color, subCategories: [] };
      setState(prev => ({ ...prev, categories: [...prev.categories, cat] }));
    }, []);

  const updateMainCategory = useCallback(
    (id: string, updates: Partial<Pick<MainCategory, 'name' | 'color'>>) =>
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c),
        transactions: updates.name
          ? prev.transactions.map(t => t.mainCategoryId === id ? { ...t, mainCategoryName: updates.name! } : t)
          : prev.transactions,
      })), []);

  const deleteMainCategory = useCallback(
    (id: string) =>
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        transactions: prev.transactions.map(t =>
          t.mainCategoryId === id
            ? { ...t, mainCategoryId: 'etc-expense', mainCategoryName: '기타',
                subCategoryId: UNCLASSIFIED_SUB.id, subCategoryName: UNCLASSIFIED_SUB.name }
            : t),
      })), []);

  const addSubCategory = useCallback(
    (mainCategoryId: string, name: string) => {
      const sub: SubCategory = { id: makeSubId(mainCategoryId, name), name };
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c =>
          c.id === mainCategoryId ? { ...c, subCategories: [...c.subCategories, sub] } : c),
      }));
    }, []);

  const updateSubCategory = useCallback(
    (mainCategoryId: string, subId: string, name: string) =>
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c =>
          c.id === mainCategoryId
            ? { ...c, subCategories: c.subCategories.map(s => s.id === subId ? { ...s, name } : s) }
            : c),
        transactions: prev.transactions.map(t =>
          t.subCategoryId === subId ? { ...t, subCategoryName: name } : t),
      })), []);

  const deleteSubCategory = useCallback(
    (mainCategoryId: string, subId: string) =>
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c =>
          c.id === mainCategoryId
            ? { ...c, subCategories: c.subCategories.filter(s => s.id !== subId) }
            : c),
        transactions: prev.transactions.map(t =>
          t.subCategoryId === subId
            ? { ...t, subCategoryId: UNCLASSIFIED_SUB.id, subCategoryName: UNCLASSIFIED_SUB.name }
            : t),
      })), []);

  const toggleSubBudgetExclusion = useCallback(
    (mainCategoryId: string, subId: string, exclude: boolean) =>
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c =>
          c.id === mainCategoryId
            ? { ...c, subCategories: c.subCategories.map(s =>
                s.id === subId ? { ...s, excludeFromBudget: exclude } : s) }
            : c),
      })), []);

  const bulkAddTransactions = useCallback(
    (ts: Omit<Transaction, 'id' | 'createdAt'>[]) =>
      setState(prev => ({
        ...prev,
        transactions: [
          ...prev.transactions,
          ...ts.map(t => ({ ...t, id: uid(), createdAt: new Date().toISOString() })),
        ],
      })), []);

  const resetData      = useCallback(() => setState(DEFAULT_STATE), []);
  const loadSampleData = useCallback(() => setState(generateSampleData()), []);

  return {
    ...state,
    isLoaded,
    addTransaction, updateTransaction, deleteTransaction, bulkAddTransactions,
    setMonthlyBudget, deleteMonthlyBudget,
    addMainCategory, updateMainCategory, deleteMainCategory,
    addSubCategory, updateSubCategory, deleteSubCategory,
    toggleSubBudgetExclusion,
    resetData, loadSampleData,
  };
}
