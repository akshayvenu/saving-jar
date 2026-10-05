import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/format';
import { categoryLabel, type TotalRow } from '@/store/selectors';
import { brand } from '@/theme/colors';
import type { CurrencyCode, Jar } from '@/types';

interface Props {
  rows: TotalRow[];
  /** Active jars, used for the goal progress sums. */
  jars: Jar[];
  fallbackCurrency: CurrencyCode;
}

/** Big balance, one tab per category·currency total, and overall goal progress. */
export function BalanceHero({ rows, jars, fallbackCurrency }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const row = rows.find((r) => r.key === selectedKey) ?? rows[0];

  const { goalTotal, savedTowardGoals } = useMemo(() => {
    const group = row
      ? jars.filter((j) => j.category === row.category && j.currency === row.currency)
      : [];
    return {
      goalTotal: group.reduce((sum, j) => sum + (j.goal ?? 0), 0),
      savedTowardGoals: group.reduce(
        (sum, j) => sum + (j.goal ? Math.min(j.saved, j.goal) : 0),
        0,
      ),
    };
  }, [jars, row]);

  return (
    <View className="px-5">
      <Text className="font-sans text-sm text-ink-muted">
        {row ? `Total · ${categoryLabel(row.category)}` : 'Total saved'}
      </Text>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        className="font-display-bold text-[44px] leading-[52px] tracking-tight text-ink"
      >
        {formatMoney(row?.total ?? 0, row?.currency ?? fallbackCurrency)}
      </Text>

      {rows.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 mt-3"
          contentContainerClassName="gap-5 px-5"
        >
          {rows.map((r) => {
            const active = r.key === row?.key;
            return (
              <Pressable
                key={r.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedKey(r.key)}
                className={`border-b-2 pb-1.5 ${active ? 'border-ink' : 'border-transparent'}`}
              >
                <Text
                  className={`text-[15px] ${active ? 'font-semibold text-ink' : 'font-sans text-ink-muted'}`}
                >
                  {categoryLabel(r.category)} · {r.currency}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {goalTotal > 0 && row && (
        <View className="mt-4">
          <ProgressBar progress={savedTowardGoals / goalTotal} color={brand.DEFAULT} />
          <Text className="mt-2 font-sans text-sm text-ink-muted">
            {formatMoney(savedTowardGoals, row.currency)} of {formatMoney(goalTotal, row.currency)}{' '}
            goals · {Math.round((savedTowardGoals / goalTotal) * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}
