import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Basket, CurrencyCode, Jar, JarInput, SortKey, ThemeMode, Transaction } from '@/types';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface JarState {
  jars: Jar[];
  baskets: Basket[];
  transactions: Transaction[];
  sortKey: SortKey;
  themeMode: ThemeMode;
  defaultCurrency: CurrencyCode;
  /** True once saved data has been loaded from device storage. */
  hasHydrated: boolean;

  addJar: (input: JarInput) => string;
  updateJar: (id: string, patch: Partial<Omit<Jar, 'id' | 'category'>>) => void;
  deleteJar: (id: string) => void;
  togglePin: (id: string) => void;
  /** Positive `amount` in minor units. Minus never drops below zero. */
  applyAmount: (jarId: string, type: 'add' | 'minus', amount: number, note?: string) => void;

  addBasket: (name: string) => void;
  renameBasket: (id: string, name: string) => void;
  deleteBasket: (id: string) => void;

  setSortKey: (key: SortKey) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDefaultCurrency: (c: CurrencyCode) => void;
}

const defaultBaskets: Basket[] = [
  { id: 'b1', name: 'Essentials' },
  { id: 'b2', name: 'Goals' },
];

export const useJarStore = create<JarState>()(
  persist(
    (set) => ({
      jars: [],
      baskets: defaultBaskets,
      transactions: [],
      sortKey: 'manual',
      themeMode: 'light',
      defaultCurrency: 'INR',
      hasHydrated: false,

      addJar: (input) => {
        const id = uid();
        set((s) => ({
          jars: [
            { ...input, id, pinned: input.pinned ?? false, createdAt: new Date().toISOString() },
            ...s.jars,
          ],
        }));
        return id;
      },
      updateJar: (id, patch) =>
        set((s) => ({ jars: s.jars.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      deleteJar: (id) =>
        set((s) => ({
          jars: s.jars.filter((j) => j.id !== id),
          transactions: s.transactions.filter((t) => t.jarId !== id),
        })),
      togglePin: (id) =>
        set((s) => ({ jars: s.jars.map((j) => (j.id === id ? { ...j, pinned: !j.pinned } : j)) })),

      applyAmount: (jarId, type, amount, note) =>
        set((s) => {
          const jar = s.jars.find((j) => j.id === jarId);
          if (!jar || amount <= 0) return s;
          const next = type === 'add' ? jar.saved + amount : Math.max(0, jar.saved - amount);
          const tx: Transaction = {
            id: uid(),
            jarId,
            type,
            amount: Math.abs(next - jar.saved),
            balanceAfter: next,
            note: note?.trim() || undefined,
            createdAt: new Date().toISOString(),
          };
          return {
            jars: s.jars.map((j) => (j.id === jarId ? { ...j, saved: next } : j)),
            transactions: [tx, ...s.transactions],
          };
        }),

      addBasket: (name) =>
        set((s) => ({ baskets: [...s.baskets, { id: uid(), name: name.trim() }] })),
      renameBasket: (id, name) =>
        set((s) => ({
          baskets: s.baskets.map((b) => (b.id === id ? { ...b, name: name.trim() } : b)),
        })),
      deleteBasket: (id) =>
        set((s) => ({
          baskets: s.baskets.filter((b) => b.id !== id),
          jars: s.jars.map((j) => (j.basketId === id ? { ...j, basketId: null } : j)),
        })),

      setSortKey: (sortKey) => set({ sortKey }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
    }),
    {
      name: 'jamjars-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted, version) => {
        const state = persisted as Partial<JarState>;
        if (version < 2 && state.themeMode === 'system') state.themeMode = 'light';
        return state as JarState;
      },
      partialize: (s) => ({
        jars: s.jars,
        baskets: s.baskets,
        transactions: s.transactions,
        sortKey: s.sortKey,
        themeMode: s.themeMode,
        defaultCurrency: s.defaultCurrency,
      }),
      onRehydrateStorage: () => () => useJarStore.setState({ hasHydrated: true }),
    },
  ),
);
