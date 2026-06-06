'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User }                   from '@supabase/supabase-js';
import type { AppState, Transaction, MonthlyBudget, MainCategory, SubCategory } from '@/types';
import { loadAppState, saveAppState }  from '@/utils/storage';
import { generateSampleData }          from '@/utils/sampleData';
import { DEFAULT_CATEGORIES, UNCLASSIFIED_SUB } from '@/utils/defaultCategories';
import { makeSubId, makeMainId }       from '@/utils/categories';
import { supabase, loadFromCloud, saveToCloud } from '@/utils/supabase';

const DEFAULT_STATE: AppState = {
  transactions: [],
  categories:   DEFAULT_CATEGORIES,
  budgets:      {},
};

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function useAppData() {
  const [state, setState]           = useState<AppState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded]     = useState(false);
  const [user, setUser]             = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const saveTimer    = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isOwnUpdate  = useRef(false); // Realtime 에코 방지

  // ── Auth + 초기 데이터 로드 ───────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'INITIAL_SESSION') {
          if (currentUser) {
            // 로그인 상태 → 클라우드 우선
            setSyncStatus('syncing');
            const cloud = await loadFromCloud(currentUser.id).catch(() => null);
            if (cloud) {
              setState(cloud);
              saveAppState(cloud);
            } else {
              // 클라우드에 없으면 로컬 데이터 업로드
              const local = loadAppState();
              setState(local);
              await saveToCloud(currentUser.id, local).catch(() => {});
            }
            setSyncStatus('synced');
          } else {
            // 비로그인 → 로컬스토리지
            setState(loadAppState());
          }
          setAuthLoading(false);
          setIsLoaded(true);
        }

        if (event === 'SIGNED_IN' && currentUser) {
          setSyncStatus('syncing');
          const cloud = await loadFromCloud(currentUser.id).catch(() => null);
          if (cloud) {
            setState(cloud);
            saveAppState(cloud);
          } else {
            await saveToCloud(currentUser.id, state).catch(() => {});
          }
          setSyncStatus('synced');
        }

        if (event === 'SIGNED_OUT') {
          setSyncStatus('idle');
        }
      }
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 상태 변경 시 저장 (로컬 즉시 + 클라우드 디바운스) ─────────
  useEffect(() => {
    if (!isLoaded) return;
    saveAppState(state); // 로컬 항상 저장

    if (user) {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        isOwnUpdate.current = true;
        setSyncStatus('syncing');
        try {
          await saveToCloud(user.id, state);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('error');
        } finally {
          setTimeout(() => { isOwnUpdate.current = false; }, 500);
        }
      }, 1500);
    }

    return () => clearTimeout(saveTimer.current);
  }, [state, isLoaded, user]);

  // ── Realtime: 다른 기기 변경사항 수신 ─────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-${user.id}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'user_data',
          filter: `user_id=eq.${user.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (isOwnUpdate.current) return; // 내 업데이트는 무시
          const r = payload.new;
          setState({
            transactions: r.transactions ?? [],
            categories:   r.categories?.length ? r.categories : DEFAULT_CATEGORIES,
            budgets:      r.budgets ?? {},
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Auth 함수 ─────────────────────────────────────────────────
  const signIn = useCallback(
    (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    [],
  );

  const signUp = useCallback(
    (email: string, password: string) =>
      supabase.auth.signUp({ email, password }),
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState(DEFAULT_STATE);
    saveAppState(DEFAULT_STATE);
  }, []);

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

  // ── Misc ──────────────────────────────────────────────────────
  const resetData   = useCallback(() => setState(DEFAULT_STATE), []);
  const loadSampleData = useCallback(() => setState(generateSampleData()), []);

  return {
    ...state,
    isLoaded, user, authLoading, syncStatus,
    signIn, signUp, signOut,
    addTransaction, updateTransaction, deleteTransaction,
    setMonthlyBudget, deleteMonthlyBudget,
    addMainCategory, updateMainCategory, deleteMainCategory,
    addSubCategory, updateSubCategory, deleteSubCategory,
    toggleSubBudgetExclusion,
    resetData, loadSampleData,
  };
}
