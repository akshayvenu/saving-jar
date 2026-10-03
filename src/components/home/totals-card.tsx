import { Text, View } from 'react-native';

import { Hatch } from '@/components/ui/hatch';
import { formatMoney } from '@/lib/format';
import { categoryLabel, type TotalRow } from '@/store/selectors';
import { ink } from '@/theme/colors';

/** Headline total for a jar list, with any extra category/currency totals below. */
export function TotalsCard({ rows }: { rows: TotalRow[] }) {
  if (rows.length === 0) return null;
  const [first, ...rest] = rows;
  return (
    <View className="mx-5 mt-1 overflow-hidden rounded-jar border-hair border-ink bg-surface-card">
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-1">
          <Text className="font-sans text-sm text-ink-muted">
            {categoryLabel(first.category)} · {first.currency}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="font-display-bold text-[32px] leading-[38px] tracking-tight text-ink"
          >
            {formatMoney(first.total, first.currency)}
          </Text>
        </View>
        <View className="h-12 w-12 overflow-hidden rounded-2xl border-hair border-ink bg-brand">
          <Hatch gap={6} strokeWidth={1} color={ink.DEFAULT} />
        </View>
      </View>
      {rest.map((r) => (
        <View
          key={r.key}
          className="flex-row items-center justify-between border-t-hair border-surface-line px-4 py-3"
        >
          <Text className="font-sans text-sm text-ink-muted">
            {categoryLabel(r.category)} · {r.currency}
          </Text>
          <Text className="font-display-semibold text-base text-ink">
            {formatMoney(r.total, r.currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}
