import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Hatch } from '@/components/ui/hatch';
import { formatMoney } from '@/lib/format';
import { categoryLabel, computeTotals } from '@/store/selectors';
import { ink, jar as jarColors } from '@/theme/colors';
import type { Jar, JarColor } from '@/types';

interface Props {
  name: string;
  color: JarColor;
  jars: Jar[];
  onPress: () => void;
}

export function BasketCard({ name, color, jars, onPress }: Props) {
  const totals = computeTotals(jars);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${jars.length} jars`}
      onPress={onPress}
      className="min-h-[156px] w-[48%] rounded-jar border-hair border-ink bg-surface-card p-3.5 active:bg-surface-sunken"
    >
      <View className="flex-row items-start justify-between">
        <View
          style={{ backgroundColor: jarColors[color] }}
          className="h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border-hair border-ink"
        >
          <Hatch gap={6} strokeWidth={1} color="rgba(18,18,18,0.25)" />
          <MaterialCommunityIcons name="basket-outline" size={22} color={ink.DEFAULT} />
        </View>
        <View className="rounded-full bg-surface px-2 py-0.5">
          <Text className="font-display-semibold text-xs text-ink">
            {jars.length} {jars.length === 1 ? 'jar' : 'jars'}
          </Text>
        </View>
      </View>

      <Text numberOfLines={1} className="mt-3 font-display-semibold text-lg text-ink">
        {name}
      </Text>

      <View className="mt-auto gap-1 pt-2">
        {totals.length === 0 ? (
          <Text className="font-sans text-sm text-ink-muted">Empty</Text>
        ) : (
          totals.map((r) => (
            <View key={r.key}>
              <Text
                numberOfLines={1}
                className="font-sans text-[11px] uppercase tracking-wider text-ink-muted"
              >
                {categoryLabel(r.category)}
              </Text>
              <Text numberOfLines={1} className="font-display-semibold text-base text-ink">
                {formatMoney(r.total, r.currency)}
              </Text>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
}

/** Solid ink tile that sits at the end of the basket grid. */
export function NewBasketCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create basket"
      onPress={onPress}
      className="min-h-[156px] w-[48%] items-center justify-center gap-3 rounded-jar border-hair border-ink bg-ink active:opacity-85"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl border-hair border-white/40">
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </View>
      <Text className="font-display-semibold text-base text-white">New basket</Text>
    </Pressable>
  );
}
