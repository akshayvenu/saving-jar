import type { Challenge } from '@/types';

const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Whole calendar days since the challenge began (0 on day 1). */
const elapsedDays = (c: Challenge, now: Date) =>
  Math.round((startOfDay(now) - startOfDay(new Date(c.startDate))) / DAY_MS);

/** Calendar date of a 1-based challenge day. */
export const dateOfDay = (c: Challenge, day: number) => {
  const start = new Date(c.startDate);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + day - 1);
};

export const dailyLimit = (c: Challenge) => Math.round(c.budget / c.days);

/** 1-based day index from the start date, clamped to 1..days. */
export const currentDay = (c: Challenge, now = new Date()) =>
  Math.min(Math.max(elapsedDays(c, now) + 1, 1), c.days);

/** Over once ended, or once the last day has passed. */
export const isFinished = (c: Challenge, now = new Date()) =>
  !!c.endedAt || elapsedDays(c, now) >= c.days;

export const isActive = (c: Challenge, now = new Date()) => !isFinished(c, now);

export const spentOnDay = (c: Challenge, day: number) =>
  c.expenses.filter((e) => e.day === day).reduce((sum, e) => sum + e.amount, 0);

export const totalSpent = (c: Challenge) => c.expenses.reduce((sum, e) => sum + e.amount, 0);

/** Budget left; negative when overspent. */
export const remaining = (c: Challenge) => c.budget - totalSpent(c);
