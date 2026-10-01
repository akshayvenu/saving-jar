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
  return [...map.values()].sort((a, b) => a.category.localeCompare(b.category));
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

export const categoryLabel = (c: Category) => (c === 'cash' ? 'Cash' : 'Cash Debt');
