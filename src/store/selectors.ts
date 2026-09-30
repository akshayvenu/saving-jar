import type { Category, CurrencyCode, Jar, SortKey } from '@/types';

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

export function sortJars(jars: Jar[], key: SortKey): Jar[] {
  const copy = [...jars];
  switch (key) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'progress':
      return copy.sort((a, b) => progressOf(b) - progressOf(a));
    case 'amount':
      return copy.sort((a, b) => b.saved - a.saved);
    case 'deadline':
      return copy.sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));
    default:
      return copy;
  }
}

export const categoryLabel = (c: Category) => (c === 'cash' ? 'Cash' : 'Cash Debt');
