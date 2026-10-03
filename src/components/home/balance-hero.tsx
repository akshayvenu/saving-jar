import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Hatch } from '@/components/ui/hatch';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/format';
import { categoryLabel, type TotalRow } from '@/store/selectors';
import { brand, ink, jar as jarColors } from '@/theme/colors';
import type { CurrencyCode, Jar } from '@/types';

const MAX_BARS = 6;
const CHART_HEIGHT = 124;

interface Props {
  rows: TotalRow[];
  /** Active jars, used for the per-jar breakdown chart. */
  jars: Jar[];
  fallbackCurrency: CurrencyCode;
}

/** Big balance, one tab per category·currency total, and a hatched bar chart of its jars. */
export function BalanceHero({ rows, jars, fallbackCurrency }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const row = rows.find((r) => r.key === selectedKey) ?? rows[0];

  const group = useMemo(
    () =>
      row
        ? jars
            .filter((j) => j.category === row.category && j.currency === row.currency)
            .sort((a, b) => b.saved - a.saved)
        : [],
    [jars, row],
  );
  const goalTotal = group.reduce((sum, j) => sum + (j.goal ?? 0), 0);
  const savedTowardGoals = group.reduce(
    (sum, j) => sum + (j.goal ? Math.min(j.saved, j.goal) : 0),
    0,
  );

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

      <View className="mt-4 rounded-jar border-hair border-ink bg-surface-card p-4">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-display-semibold text-base text-ink">Jar breakdown</Text>
            <Text className="font-sans text-sm text-ink-muted">
              {group.length} {group.length === 1 ? 'jar' : 'jars'}
              {group.length > MAX_BARS ? ` · top ${MAX_BARS}` : ''}
            </Text>
          </View>
          {goalTotal > 0 && row && (
            <View className="rounded-full bg-brand px-2.5 py-1">
              <Text className="font-display-semibold text-xs text-white">
                {Math.round((savedTowardGoals / goalTotal) * 100)}% of goals
              </Text>
            </View>
          )}
        </View>

        {group.length === 0 ? (
          <View
            style={{ height: CHART_HEIGHT }}
            className="mt-4 items-center justify-center overflow-hidden rounded-2xl"
          >
            <Hatch color={ink.faint} gap={8} />
            <View className="rounded-full bg-surface-card px-3 py-1">
              <Text className="font-sans text-sm text-ink-muted">No jars yet</Text>
            </View>
          </View>
        ) : (
          <BarChart jars={group.slice(0, MAX_BARS)} />
        )}

        {goalTotal > 0 && row && (
          <View className="mt-4 border-t-hair border-surface-line pt-3">
            <View className="mb-2 flex-row justify-between">
              <Text className="font-sans text-sm text-ink-muted">Saved toward goals</Text>
              <Text className="font-display-semibold text-sm text-ink">
                {formatMoney(savedTowardGoals, row.currency)} /{' '}
                {formatMoney(goalTotal, row.currency)}
              </Text>
            </View>
            <ProgressBar progress={savedTowardGoals / goalTotal} color={brand.DEFAULT} />
          </View>
        )}
      </View>
    </View>
  );
}

function BarChart({ jars }: { jars: Jar[] }) {
  const max = Math.max(...jars.map((j) => j.saved), 1);
  return (
    <View className="mt-4">
      <View style={{ height: CHART_HEIGHT + 30 }} className="flex-row items-end gap-2">
        {jars.map((j, i) => {
          const h = Math.max((j.saved / max) * CHART_HEIGHT, 10);
          return (
            <View
              key={j.id}
              accessible
              accessibilityLabel={`${j.name}: ${formatMoney(j.saved, j.currency)}`}
              className="flex-1 items-center"
            >
              {i === 0 && (
                <View className="mb-1.5 rounded-md bg-ink px-1.5 py-0.5">
                  <Text numberOfLines={1} className="font-display-semibold text-[11px] text-white">
                    {formatMoney(j.saved, j.currency)}
                  </Text>
                </View>
              )}
              <View
                style={{ height: h, backgroundColor: i === 0 ? jarColors[j.color] : undefined }}
                className="w-full overflow-hidden rounded-t-lg border-hair border-b-0 border-ink"
              >
                <Hatch gap={6} strokeWidth={1} color={ink.DEFAULT} />
              </View>
            </View>
          );
        })}
      </View>
      <View className="h-[1.5px] bg-ink" />
      <View className="mt-1.5 flex-row gap-2">
        {jars.map((j) => (
          <Text
            key={j.id}
            numberOfLines={1}
            className="flex-1 text-center font-sans text-xs text-ink-muted"
          >
            {j.name}
          </Text>
        ))}
      </View>
    </View>
  );
}
