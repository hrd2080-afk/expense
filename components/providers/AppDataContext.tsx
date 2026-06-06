'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAppData } from '@/hooks/useAppData';

type AppDataContextType = ReturnType<typeof useAppData>;

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const appData = useAppData();
  return <AppDataContext.Provider value={appData}>{children}</AppDataContext.Provider>;
}

export function useApp(): AppDataContextType {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useApp must be used within AppDataProvider');
  return ctx;
}
