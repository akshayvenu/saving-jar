import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/format';
import type { TotalRow } from '@/store/selectors';
import { brand, ink } from '@/theme/colors';
import type { CurrencyCode, Jar } from '@/types';

interface Props {
  rows: TotalRow[];
  /** The selected currency; `undefined` when there are no rows. */
  row: TotalRow | undefined;
  onSelect: (key: string) => void;
  /** Active jars, used for the goal progress sums. */
  jars: Jar[];
  fallbackCurrency: CurrencyCode;
}

/** Big saved balance, money owed, a tab per currency (only when there are several), and goal progress. */
export function BalanceHero({ rows, row, onSelect, jars, fallbackCurrency }: Props) {
  // Goal progress covers savings jars only; a debt's "goal" isn't money you're saving.
  const { goalTotal, savedTowardGoals } = useMemo(() => {
    const group = row ? jars.filter((j) => !j.debt && j.currency === row.currency) : [];
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
      <Text className="font-sans text-sm text-ink-muted">Total saved</Text>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        className="font-display-bold text-[44px] leading-[52px] tracking-tight text-ink"
      >
        {formatMoney(row?.saved ?? 0, row?.currency ?? fallbackCurrency)}
      </Text>
      {row && row.owed > 0 && (
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Icon name="credit-card-outline" size={15} color={ink.muted} />
          <Text className="font-sans text-sm text-ink-muted">
            Owed{' '}
            <Text className="font-display-semibold text-ink">
              {formatMoney(row.owed, row.currency)}
            </Text>
          </Text>
        </View>
      )}

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
                onPress={() => onSelect(r.key)}
                className={`border-b-2 pb-1.5 ${active ? 'border-ink' : 'border-transparent'}`}
              >
                <Text
                  className={`text-[15px] ${active ? 'font-semibold text-ink' : 'font-sans text-ink-muted'}`}
                >
                  {r.currency}
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
