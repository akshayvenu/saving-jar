import { Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import type { TotalRow } from '@/store/selectors';

/** Saved and owed totals for a jar list, one equal-weight line each (per currency when mixed). */
export function TotalsCard({ rows }: { rows: TotalRow[] }) {
  const multi = rows.length > 1;
  const lines = rows.flatMap((r) => {
    const suffix = multi ? ` · ${r.currency}` : '';
    return [
      ...(r.saved > 0 || r.owed === 0
        ? [{ key: `${r.key}:saved`, label: `Saved${suffix}`, amount: r.saved, currency: r.currency }]
        : []),
      ...(r.owed > 0
        ? [{ key: `${r.key}:owed`, label: `Owed${suffix}`, amount: r.owed, currency: r.currency }]
        : []),
    ];
  });
  if (lines.length === 0) return null;
  return (
    <View className="mx-5 mt-1 overflow-hidden rounded-jar border-hair border-ink bg-surface-card">
      {lines.map((l, i) => (
        <View
          key={l.key}
          className={`flex-row items-center justify-between gap-3 px-4 py-3.5 ${
            i > 0 ? 'border-t-hair border-surface-line' : ''
          }`}
        >
          <Text numberOfLines={1} className="shrink font-sans text-sm text-ink-muted">
            {l.label}
          </Text>
          <Text
            numberOfLines={1}
            className="font-display-semibold text-lg tracking-tight text-ink"
          >
            {formatMoney(l.amount, l.currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}
