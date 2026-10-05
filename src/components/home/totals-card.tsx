import { Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { categoryLabel, type TotalRow } from '@/store/selectors';

/** Category/currency totals for a jar list, one equal-weight row each. */
export function TotalsCard({ rows }: { rows: TotalRow[] }) {
  if (rows.length === 0) return null;
  return (
    <View className="mx-5 mt-1 overflow-hidden rounded-jar border-hair border-ink bg-surface-card">
      {rows.map((r, i) => (
        <View
          key={r.key}
          className={`flex-row items-center justify-between gap-3 px-4 py-3.5 ${
            i > 0 ? 'border-t-hair border-surface-line' : ''
          }`}
        >
          <Text numberOfLines={1} className="shrink font-sans text-sm text-ink-muted">
            {categoryLabel(r.category)} · {r.currency}
          </Text>
          <Text
            numberOfLines={1}
            className="font-display-semibold text-lg tracking-tight text-ink"
          >
            {formatMoney(r.total, r.currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}
