import { Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { categoryLabel, type TotalRow } from '@/store/selectors';

export function TotalsCard({ rows }: { rows: TotalRow[] }) {
  if (rows.length === 0) return null;
  return (
    <View className="mx-4 rounded-2xl bg-jar-peach px-4 py-3">
      <Text className="mb-1 font-bold text-xs tracking-wider text-brand">TOTALS</Text>
      {rows.map((r) => (
        <View key={r.key} className="flex-row items-center justify-between py-1">
          <Text className="text-sm tracking-wide text-ink-muted">
            {categoryLabel(r.category)} · {r.currency}
          </Text>
          <Text className="font-bold text-base text-ink">{formatMoney(r.total, r.currency)}</Text>
        </View>
      ))}
    </View>
  );
}
