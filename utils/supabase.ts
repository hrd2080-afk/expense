import { createClient } from '@supabase/supabase-js';
import type { AppState } from '@/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');

export const isSupabaseConfigured = Boolean(url && key);

// ── 클라우드 저장/불러오기 ─────────────────────────────────────
export async function loadFromCloud(userId: string): Promise<AppState | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('user_data')
    .select('transactions, categories, budgets')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    transactions: data.transactions ?? [],
    categories:   data.categories  ?? [],
    budgets:      data.budgets     ?? {},
  };
}

export async function saveToCloud(userId: string, state: AppState): Promise<void> {
  if (!isSupabaseConfigured) return;

  await supabase.from('user_data').upsert({
    user_id:      userId,
    transactions: state.transactions,
    categories:   state.categories,
    budgets:      state.budgets,
    updated_at:   new Date().toISOString(),
  });
}
