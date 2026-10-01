import type { Category, CurrencyCode, Jar, SortDir, SortKey } from '@/types';

export const progressOf = (jar: Jar) =>
  jar.goal && jar.goal > 0 ? Math.min(jar.saved / jar.goal, 1) : 0;

export const remainingOf = (jar: Jar) => (jar.goal ? Math.max(jar.goal - jar.saved, 0) : null);

export interface TotalRow {
  key: string;
  category: Category;
  currency: CurrencyCode;
  total: number;
}

export function computeTotals(jars: Jar[]): TotalRow[] {
  const map = new Map<string, TotalRow>();
  for (const j of jars) {
    const key = `${j.category}:${j.currency}`;
    const row = map.get(key) ?? { key, category: j.category, currency: j.currency, total: 0 };
    row.total += j.saved;
    map.set(key, row);
  }
  return [...map.values()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );
}

const ascending: Record<SortKey, (a: Jar, b: Jar) => number> = {
  manual: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
  progress: (a, b) => progressOf(a) - progressOf(b),
  amount: (a, b) => a.saved - b.saved,
  goal: (a, b) => (a.goal ?? 0) - (b.goal ?? 0),
  remaining: (a, b) => (remainingOf(a) ?? 0) - (remainingOf(b) ?? 0),
  deadline: (a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'),
};

export function sortJars(jars: Jar[], key: SortKey, dir: SortDir): Jar[] {
  const cmp = ascending[key] ?? ascending.manual;
  const sign = dir === 'asc' ? 1 : -1;
  return [...jars].sort((a, b) => sign * cmp(a, b));
}

/** Virtual basket ids for the switcher and the /basket/[id] route. */
export const ALL_ID = 'all';
export const UNSORTED_ID = 'unsorted';

/** Active (non-archived) jars belonging to a basket, `all`, or `unsorted`. */
export function jarsInBasket(jars: Jar[], id: string): Jar[] {
  const active = jars.filter((j) => !j.archived);
  if (id === ALL_ID) return active;
  if (id === UNSORTED_ID) return active.filter((j) => !j.basketId);
  return active.filter((j) => j.basketId === id);
}

export const CATEGORY_ORDER: Category[] = ['cash', 'investment', 'cash_debt'];

const CATEGORY_LABEL: Record<Category, string> = {
  cash: 'Cash / Savings',
  investment: 'Investment',
  cash_debt: 'Loan / Debt',
};

export const categoryLabel = (c: Category) => CATEGORY_LABEL[c];

export const CATEGORY_ICON: Record<Category, 'wallet-outline' | 'chart-line' | 'credit-card-outline'> = {
  cash: 'wallet-outline',
  investment: 'chart-line',
  cash_debt: 'credit-card-outline',
};

/** Distinct account names across jars (case-insensitive, first spelling wins). */
export function knownAccounts(jars: Jar[]): string[] {
  const seen = new Map<string, string>();
  for (const j of jars) {
    const name = j.account?.trim();
    if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** Whole calendar days from today to the deadline (negative = overdue), or null. */
export function daysUntilDeadline(jar: Jar, now = new Date()): number | null {
  if (!jar.deadline) return null;
  const d = new Date(jar.deadline);
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - today) / 86_400_000);
}
