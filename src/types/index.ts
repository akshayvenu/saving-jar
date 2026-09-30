export type Category = 'cash' | 'cash_debt';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type JarColor = 'peach' | 'slate' | 'mint' | 'lavender' | 'butter' | 'sky' | 'rose' | 'sage';
export type ThemeMode = 'system' | 'light' | 'dark';
export type SortKey = 'manual' | 'name' | 'progress' | 'amount' | 'deadline';

/** Amounts are integer minor units (paise/cents) to avoid float drift. */
export interface Jar {
  id: string;
  name: string;
  basketId: string | null;
  category: Category;
  currency: CurrencyCode;
  saved: number;
  goal: number | null;
  note?: string;
  deadline?: string; // ISO date
  color: JarColor;
  pinned: boolean;
  createdAt: string;
}

export interface Basket {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  jarId: string;
  type: 'add' | 'minus';
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export type JarInput = Omit<Jar, 'id' | 'createdAt' | 'pinned'> & { pinned?: boolean };
