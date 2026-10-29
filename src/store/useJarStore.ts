import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isActive } from '@/lib/challenge';
import { formatDate, formatMoney } from '@/lib/format';
import { splitPayment } from '@/store/selectors';
import { jar as jarColors } from '@/theme/colors';
import type {
    Basket,
    Challenge,
    ChallengeExpense,
    CurrencyCode,
    FieldChange,
    Jar,
    JarColor,
    JarInput,
    SortDir,
    SortKey,
    Transaction,
} from '@/types';

const PALETTE = Object.keys(jarColors) as JarColor[];
const paletteAt = (i: number) => PALETTE[i % PALETTE.length];

// Expo Router's web static render runs in Node, where AsyncStorage's web
// backend touches `window`. Persist to a no-op store there.
const serverStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};
const isServer = typeof window === 'undefined';

/** Using an account again brings its suggestion chip back. */
const unhide = (hidden: string[], account?: string) =>
  account ? hidden.filter((h) => h !== account.trim().toLowerCase()) : hidden;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Takes a challenge expense out of its jar (never below zero) and logs it in the jar's history. */
function chargeExpense(jars: Jar[], jarId: string, amount: number, note: string, createdAt: string) {
  const jar = jars.find((j) => j.id === jarId);
  if (!jar) return { jars, deducted: 0, tx: null };
  const next = Math.max(0, jar.saved - amount);
  const deducted = jar.saved - next;
  const tx: Transaction | null = deducted
    ? { id: uid(), jarId, type: 'minus', amount: deducted, balanceAfter: next, note, createdAt }
    : null;
  return { jars: jars.map((j) => (j.id === jarId ? { ...j, saved: next } : j)), deducted, tx };
}

const expenseNote = (e: Pick<ChallengeExpense, 'day' | 'note'>) =>
  e.note ? `${e.note} · Challenge day ${e.day}` : `Challenge day ${e.day}`;

/** Human-readable diff of everything but the balance, for the history log. */
function describeChanges(prev: Jar, next: Jar, baskets: Basket[]): FieldChange[] {
  const text = (v?: string) => v?.trim() || '—';
  const money = (v: number | null, currency: CurrencyCode) =>
    v == null ? 'None' : formatMoney(v, currency);
  const date = (v?: string) => (v ? formatDate(v) : 'None');
  const basket = (id: string | null) => baskets.find((b) => b.id === id)?.name ?? 'No basket';

  const fields: [string, string, string][] = [
    ['Name', text(prev.name), text(next.name)],
    ['Basket', basket(prev.basketId), basket(next.basketId)],
    ['Type', prev.debt ? 'Debt' : 'Savings', next.debt ? 'Debt' : 'Savings'],
    ['Account', text(prev.account), text(next.account)],
    ['Currency', prev.currency, next.currency],
    [
      'Interest',
      prev.interestRate ? `${prev.interestRate}% / yr` : 'None',
      next.interestRate ? `${next.interestRate}% / yr` : 'None',
    ],
    ['Goal', money(prev.goal, prev.currency), money(next.goal, next.currency)],
    ['Deadline', date(prev.deadline), date(next.deadline)],
    ['Note', text(prev.note), text(next.note)],
    ['Colour', capitalize(prev.color), capitalize(next.color)],
  ];
  return fields
    .filter(([, from, to]) => from !== to)
    .map(([label, from, to]) => ({ label, from, to }));
}

/** Everything that is backed up to the cloud and swapped as a unit when syncing. */
export interface SyncData {
  jars: Jar[];
  baskets: Basket[];
  transactions: Transaction[];
  challenges: Challenge[];
  /** Account suggestions the user removed from the jar form (lowercased). */
  hiddenAccounts: string[];
  sortKey: SortKey;
  sortDir: SortDir;
  defaultCurrency: CurrencyCode;
  /** Masks money amounts on Home so they can't be read over the shoulder. */
  hideAmounts: boolean;
}

interface JarState extends SyncData {
  /** Account the local data belongs to; unset for data from before cloud sync existed. */
  ownerUid?: string;
  /** True once saved data has been loaded from device storage. */
  hasHydrated: boolean;

  addJar: (input: JarInput) => string;
  updateJar: (id: string, patch: Partial<Omit<Jar, 'id'>>) => void;
  deleteJar: (id: string) => void;
  hideAccount: (name: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
  /** Positive `amount` in minor units. Minus never drops below zero. */
  applyAmount: (jarId: string, type: 'add' | 'minus', amount: number, note?: string) => void;

  /** One running challenge per jar; returns the new id, or the running one's. */
  startChallenge: (jarId: string, budget: number, days: number) => string;
  logExpense: (challengeId: string, day: number, amount: number, note?: string) => void;
  removeExpense: (challengeId: string, expenseId: string) => void;
  endChallenge: (challengeId: string) => void;
  /** Moves what's left in the challenge's jar into `toJarId` once; no-op if already moved or empty. */
  transferSurplus: (challengeId: string, toJarId: string) => void;

  addBasket: (name: string, color?: JarColor) => string;
  renameBasket: (id: string, name: string) => void;
  recolorBasket: (id: string, color: JarColor) => void;
  deleteBasket: (id: string) => void;

  setSortKey: (key: SortKey) => void;
  setSortDir: (dir: SortDir) => void;
  setDefaultCurrency: (c: CurrencyCode) => void;
  toggleHideAmounts: () => void;

  /** Swaps in data pulled from the cloud (or merged) and records which account owns it. */
  replaceData: (data: SyncData, ownerUid: string) => void;
  /** Wipes local data back to a fresh install for `ownerUid`. */
  resetData: (ownerUid: string) => void;
}

const defaultBaskets: Basket[] = [
  { id: 'b1', name: 'Essentials', color: 'mint' },
  { id: 'b2', name: 'Goals', color: 'lavender' },
];

export const useJarStore = create<JarState>()(
  persist(
    (set, get) => ({
      jars: [],
      baskets: defaultBaskets,
      transactions: [],
      challenges: [],
      hiddenAccounts: [],
      sortKey: 'manual',
      sortDir: 'desc',
      defaultCurrency: 'INR',
      hideAmounts: false,
      hasHydrated: false,

      addJar: (input) => {
        const id = uid();
        set((s) => ({
          hiddenAccounts: unhide(s.hiddenAccounts, input.account),
          jars: [
            { ...input, id, pinned: input.pinned ?? false, createdAt: new Date().toISOString() },
            ...s.jars,
          ],
        }));
        return id;
      },
      updateJar: (id, patch) =>
        set((s) => {
          const jar = s.jars.find((j) => j.id === id);
          if (!jar) return s;
          const next = { ...jar, ...patch };
          const createdAt = new Date().toISOString();
          const logged: Transaction[] = [];

          const changes = describeChanges(jar, next, s.baskets);
          if (changes.length) {
            logged.push({
              id: uid(),
              jarId: id,
              type: 'edit',
              amount: 0,
              balanceAfter: next.saved,
              changes,
              createdAt,
            });
          }
          if (next.saved !== jar.saved) {
            logged.push({
              id: uid(),
              jarId: id,
              type: next.saved > jar.saved ? 'add' : 'minus',
              amount: Math.abs(next.saved - jar.saved),
              balanceAfter: next.saved,
              note: 'Edited',
              createdAt,
            });
          }

          return {
            hiddenAccounts: unhide(s.hiddenAccounts, patch.account),
            jars: s.jars.map((j) => (j.id === id ? next : j)),
            transactions: [...logged, ...s.transactions],
          };
        }),
      deleteJar: (id) =>
        set((s) => ({
          jars: s.jars.filter((j) => j.id !== id),
          transactions: s.transactions.filter((t) => t.jarId !== id),
          challenges: s.challenges.filter((c) => c.jarId !== id),
        })),
      hideAccount: (name) =>
        set((s) => ({ hiddenAccounts: [...s.hiddenAccounts, name.trim().toLowerCase()] })),
      togglePin: (id) =>
        set((s) => ({ jars: s.jars.map((j) => (j.id === id ? { ...j, pinned: !j.pinned } : j)) })),
      toggleArchive: (id) =>
        set((s) => ({
          jars: s.jars.map((j) =>
            j.id === id ? { ...j, archived: !j.archived, pinned: false } : j,
          ),
        })),

      applyAmount: (jarId, type, amount, note) =>
        set((s) => {
          const jar = s.jars.find((j) => j.id === jarId);
          if (!jar || amount <= 0) return s;
          const { interest, principal } =
            type === 'add' ? splitPayment(jar, amount) : { interest: 0, principal: 0 };
          const next = type === 'add' ? jar.saved + principal : Math.max(0, jar.saved - amount);
          const tx: Transaction = {
            id: uid(),
            jarId,
            type,
            amount: Math.abs(next - jar.saved),
            balanceAfter: next,
            interest: interest > 0 ? interest : undefined,
            note: note?.trim() || undefined,
            createdAt: new Date().toISOString(),
          };
          return {
            jars: s.jars.map((j) => (j.id === jarId ? { ...j, saved: next } : j)),
            transactions: [tx, ...s.transactions],
          };
        }),

      startChallenge: (jarId, budget, days) => {
        const running = get().challenges.find((c) => c.jarId === jarId && isActive(c));
        if (running) return running.id;
        const id = uid();
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        set((s) => ({
          challenges: [{ id, jarId, budget, days, startDate, expenses: [] }, ...s.challenges],
        }));
        return id;
      },
      logExpense: (challengeId, day, amount, note) =>
        set((s) => {
          const c = s.challenges.find((x) => x.id === challengeId);
          if (!c || c.endedAt || amount <= 0) return s;
          const createdAt = new Date().toISOString();
          const trimmed = note?.trim() || undefined;
          const charged = chargeExpense(
            s.jars,
            c.jarId,
            amount,
            expenseNote({ day, note: trimmed }),
            createdAt,
          );
          const expense: ChallengeExpense = {
            id: uid(),
            day,
            amount,
            deducted: charged.deducted,
            note: trimmed,
            createdAt,
          };
          return {
            jars: charged.jars,
            transactions: charged.tx ? [charged.tx, ...s.transactions] : s.transactions,
            challenges: s.challenges.map((x) =>
              x.id === challengeId ? { ...x, expenses: [...x.expenses, expense] } : x,
            ),
          };
        }),
      removeExpense: (challengeId, expenseId) =>
        set((s) => {
          const c = s.challenges.find((x) => x.id === challengeId);
          const expense = c?.expenses.find((e) => e.id === expenseId);
          if (!c || !expense || c.transfer) return s;
          const challenges = s.challenges.map((x) =>
            x.id === challengeId
              ? { ...x, expenses: x.expenses.filter((e) => e.id !== expenseId) }
              : x,
          );
          // Give back only what was actually taken from the jar.
          const jar = s.jars.find((j) => j.id === c.jarId);
          const refund = expense.deducted ?? 0;
          if (!jar || refund <= 0) return { challenges };
          const next = jar.saved + refund;
          const tx: Transaction = {
            id: uid(),
            jarId: jar.id,
            type: 'add',
            amount: refund,
            balanceAfter: next,
            note: `Removed · ${expenseNote(expense)}`,
            createdAt: new Date().toISOString(),
          };
          return {
            challenges,
            jars: s.jars.map((j) => (j.id === jar.id ? { ...j, saved: next } : j)),
            transactions: [tx, ...s.transactions],
          };
        }),
      endChallenge: (challengeId) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === challengeId && !c.endedAt ? { ...c, endedAt: new Date().toISOString() } : c,
          ),
        })),
      transferSurplus: (challengeId, toJarId) =>
        set((s) => {
          const c = s.challenges.find((x) => x.id === challengeId);
          const target = s.jars.find((j) => j.id === toJarId);
          // Expenses already came out of the jar, so whatever it still holds is the surplus.
          const amount = s.jars.find((j) => j.id === c?.jarId)?.saved ?? 0;
          if (!c || !target || c.transfer || amount <= 0) return s;
          const at = new Date().toISOString();
          const next = target.saved + amount;
          const tx: Transaction = {
            id: uid(),
            jarId: toJarId,
            type: 'add',
            amount,
            balanceAfter: next,
            note: 'Spending challenge surplus',
            createdAt: at,
          };
          return {
            jars: s.jars.map((j) =>
              j.id === toJarId ? { ...j, saved: next } : j.id === c.jarId ? { ...j, saved: 0 } : j,
            ),
            transactions: [tx, ...s.transactions],
            challenges: s.challenges.map((x) =>
              x.id === challengeId
                ? { ...x, endedAt: x.endedAt ?? at, transfer: { jarId: toJarId, amount, at } }
                : x,
            ),
          };
        }),

      addBasket: (name, color) => {
        const id = uid();
        set((s) => ({
          baskets: [
            ...s.baskets,
            { id, name: name.trim(), color: color ?? paletteAt(s.baskets.length) },
          ],
        }));
        return id;
      },
      renameBasket: (id, name) =>
        set((s) => ({
          baskets: s.baskets.map((b) => (b.id === id ? { ...b, name: name.trim() } : b)),
        })),
      recolorBasket: (id, color) =>
        set((s) => ({ baskets: s.baskets.map((b) => (b.id === id ? { ...b, color } : b)) })),
      deleteBasket: (id) =>
        set((s) => ({
          baskets: s.baskets.filter((b) => b.id !== id),
          jars: s.jars.map((j) => (j.basketId === id ? { ...j, basketId: null } : j)),
        })),

      setSortKey: (sortKey) => set({ sortKey }),
      setSortDir: (sortDir) => set({ sortDir }),
      setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),

      replaceData: (data, ownerUid) => set({ ...data, ownerUid }),
      resetData: (ownerUid) =>
        set({
          ownerUid,
          jars: [],
          baskets: defaultBaskets,
          transactions: [],
          challenges: [],
          hiddenAccounts: [],
          sortKey: 'manual',
          sortDir: 'desc',
          defaultCurrency: 'INR',
          hideAmounts: false,
        }),
    }),
    {
      name: 'jamjars-store',
      version: 7,
      storage: createJSONStorage(() => (isServer ? serverStorage : AsyncStorage)),
      migrate: (persisted, version) => {
        const state = persisted as Partial<JarState>;
        if (version < 3) {
          state.baskets = (state.baskets ?? []).map((b, i) => ({
            ...b,
            color: b.color ?? paletteAt(i + 1),
          }));
          // Old hard-coded directions: name/deadline ascending, the rest descending.
          state.sortDir = state.sortKey === 'name' || state.sortKey === 'deadline' ? 'asc' : 'desc';
        }
        if (version < 4) {
          // Categories are gone: debt becomes a flag, and loose investment jars are
          // gathered into an "Investments" basket so they stay grouped.
          const legacy = (state.jars ?? []) as (Jar & { category?: string })[];
          let baskets = state.baskets ?? [];
          let investId: string | null = null;
          if (legacy.some((j) => j.category === 'investment' && !j.basketId)) {
            investId =
              baskets.find((b) => b.name.trim().toLowerCase() === 'investments')?.id ?? uid();
            if (!baskets.some((b) => b.id === investId)) {
              baskets = [
                ...baskets,
                { id: investId, name: 'Investments', color: paletteAt(baskets.length) },
              ];
            }
          }
          state.baskets = baskets;
          state.jars = legacy.map(({ category, ...j }) => ({
            ...j,
            debt: category === 'cash_debt' || undefined,
            basketId: category === 'investment' && !j.basketId ? investId : j.basketId,
          }));
        }
        if (version < 5) state.challenges = [];
        if (version < 7) {
          // Expenses used to be tracked only; take the ones already logged out of their jars.
          let jars = state.jars ?? [];
          let transactions = state.transactions ?? [];
          // Dated now so the jar's balance history stays in order.
          const now = new Date().toISOString();
          state.challenges = (state.challenges ?? []).map((c) => {
            if (c.transfer) return c;
            const expenses = c.expenses.map((e) => {
              if (e.deducted != null) return e;
              const charged = chargeExpense(jars, c.jarId, e.amount, expenseNote(e), now);
              jars = charged.jars;
              if (charged.tx) transactions = [charged.tx, ...transactions];
              return { ...e, deducted: charged.deducted };
            });
            return { ...c, expenses };
          });
          state.jars = jars;
          state.transactions = transactions;
        }
        return state as JarState;
      },
      partialize: (s) => ({
        jars: s.jars,
        baskets: s.baskets,
        transactions: s.transactions,
        challenges: s.challenges,
        ownerUid: s.ownerUid,
        hiddenAccounts: s.hiddenAccounts,
        sortKey: s.sortKey,
        sortDir: s.sortDir,
        defaultCurrency: s.defaultCurrency,
        hideAmounts: s.hideAmounts,
      }),
      onRehydrateStorage: () => () => useJarStore.setState({ hasHydrated: true }),
    },
  ),
);
