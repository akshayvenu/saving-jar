import type { CurrencyCode } from '@/types';

const LOCALE: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

export const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

export function formatMoney(minor: number, currency: CurrencyCode): string {
  const value = toMajor(minor);
  return new Intl.NumberFormat(LOCALE[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(ratio: number): string {
  return `${(Math.min(Math.max(ratio, 0), 1) * 100).toFixed(1).replace(/\.0$/, '')}%`;
}

/** Parses user input like "1,250.5" into minor units; returns null if invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/,/g, '').trim();
  if (!cleaned || !/^\d*\.?\d{0,2}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? toMinor(n) : null;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Compact numeric date, e.g. "30/09/2026". */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
