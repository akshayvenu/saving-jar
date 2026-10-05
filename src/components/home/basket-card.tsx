import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { computeTotals } from '@/store/selectors';
import { ink, jar as jarColors } from '@/theme/colors';
import type { Jar, JarColor } from '@/types';

interface Props {
  name: string;
  color: JarColor;
  jars: Jar[];
  onPress: () => void;
}

/** Compact basket line: color dot, name, jar count, headline total and chevron. */
export function BasketRow({ name, color, jars, onPress }: Props) {
  const [first, ...rest] = computeTotals(jars);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${jars.length} jars`}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-sunken"
    >
      <View
        style={{ backgroundColor: jarColors[color] }}
        className="h-4 w-4 rounded-full border-hair border-ink"
      />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-display-semibold text-base text-ink">
          {name}
        </Text>
        <Text className="font-sans text-sm text-ink-muted">
          {jars.length} {jars.length === 1 ? 'jar' : 'jars'}
        </Text>
      </View>
      <View className="items-end">
        <Text numberOfLines={1} className="font-display-semibold text-base text-ink">
          {first ? formatMoney(first.total, first.currency) : 'Empty'}
        </Text>
        {rest.length > 0 && (
          <Text className="font-sans text-xs text-ink-muted">+{rest.length} more</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={ink.muted} />
    </Pressable>
  );
}

/** Last row of the baskets list: jumps to the flat "All jars" view. */
export function AllJarsRow({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="See all jars"
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-sunken"
    >
      <MaterialCommunityIcons name="view-grid-outline" size={16} color={ink.DEFAULT} />
      <Text className="flex-1 font-display-semibold text-base text-ink">See all jars</Text>
      <Text className="font-sans text-sm text-ink-muted">{count}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={ink.muted} />
    </Pressable>
  );
}
