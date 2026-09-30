import { Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { categoryLabel, type TotalRow } from '@/store/selectors';

export function TotalsCard({ rows }: { rows: TotalRow[] }) {
  if (rows.length === 0) return null;
  return (
    <View className="mx-4 rounded-3xl bg-jar-peach p-4">
      <Text className="mb-2 font-semibold tracking-wider text-brand">TOTALS</Text>
      {rows.map((r) => (
        <View key={r.key} className="flex-row items-center justify-between py-1.5">
          <Text className="text-base text-ink-muted">
            {categoryLabel(r.category)} · {r.currency}
          </Text>
          <Text className="font-semibold text-xl text-ink">{formatMoney(r.total, r.currency)}</Text>
        </View>
      ))}
    </View>
  );
}
