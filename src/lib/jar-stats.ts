import type { Jar, Transaction } from '@/types';

export type StatsRange = '7d' | '1m' | '1y';

export const RANGES: { key: StatsRange; label: string; days: number }[] = [
  { key: '7d', label: '7D', days: 7 },
  { key: '1m', label: '1M', days: 30 },
  { key: '1y', label: '1Y', days: 365 },
];

const DAY = 86_400_000;
const time = (tx: Transaction) => Date.parse(tx.createdAt);

/** Deposits and withdrawals only; `edit` rows don't move money. */
const isMoney = (tx: Transaction) => tx.type !== 'edit';

/** Balance just before `tx` was applied. */
const balanceBefore = (tx: Transaction) =>
  tx.type === 'add' ? tx.balanceAfter - tx.amount : tx.balanceAfter + tx.amount;

export interface BalancePoint {
  t: number;
  v: number;
}

/**
 * Balance over [from, to]. Zero before the jar existed; the amount a jar was
 * created with isn't logged, so it's derived from the first transaction.
 * `txs` must be the jar's transactions, oldest first.
 */
export function balanceSeries(jar: Jar, txs: Transaction[], from: number, to: number) {
  const money = txs.filter(isMoney);
  const created = Date.parse(jar.createdAt);
  const opening = money.length ? balanceBefore(money[0]) : jar.saved;
  const points: BalancePoint[] = [];

  if (created > from) {
    points.push({ t: from, v: 0 }, { t: created, v: 0 }, { t: created, v: opening });
  } else {
    const before = money.filter((tx) => time(tx) <= from).at(-1);
    points.push({ t: from, v: before ? before.balanceAfter : opening });
  }
  for (const tx of money) {
    if (time(tx) > from) points.push({ t: time(tx), v: tx.balanceAfter });
  }
  points.push({ t: to, v: jar.saved });
  return points;
}

export interface JarStats {
  deposits: number;
  withdrawals: number;
  edits: number;
  depositSum: number;
  withdrawalSum: number;
  avgDeposit: number | null;
  avgWithdrawal: number | null;
  /** Net saved per day across the range (or since creation, if shorter). */
  dailyAverage: number;
  /** Money transactions in the last 7 days, whatever the range. */
  recent7d: number;
}

/** `txs`: the jar's transactions, any order. */
export function jarStats(jar: Jar, txs: Transaction[], rangeDays: number, now: number): JarStats {
  const from = now - rangeDays * DAY;
  const inRange = txs.filter((tx) => time(tx) >= from);
  const adds = inRange.filter((tx) => tx.type === 'add');
  const minuses = inRange.filter((tx) => tx.type === 'minus');
  const sum = (list: Transaction[]) => list.reduce((s, tx) => s + tx.amount, 0);
  const depositSum = sum(adds);
  const withdrawalSum = sum(minuses);
  const age = Math.ceil((now - Date.parse(jar.createdAt)) / DAY);
  const days = Math.max(1, Math.min(rangeDays, age));

  return {
    deposits: adds.length,
    withdrawals: minuses.length,
    edits: inRange.length - adds.length - minuses.length,
    depositSum,
    withdrawalSum,
    avgDeposit: adds.length ? depositSum / adds.length : null,
    avgWithdrawal: minuses.length ? withdrawalSum / minuses.length : null,
    dailyAverage: (depositSum - withdrawalSum) / days,
    recent7d: txs.filter((tx) => isMoney(tx) && time(tx) >= now - 7 * DAY).length,
  };
}

/** Days until `remaining` is covered at `dailyAverage`, or null if it never will be. */
export function daysToGoal(remaining: number, dailyAverage: number): number | null {
  if (remaining <= 0) return 0;
  if (dailyAverage <= 0) return null;
  return Math.ceil(remaining / dailyAverage);
}
