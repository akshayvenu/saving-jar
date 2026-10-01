import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { categoryLabel, computeTotals } from '@/store/selectors';
import { jar as jarColors } from '@/theme/colors';
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
      style={{ backgroundColor: jarColors[color] }}
      className="min-h-[140px] w-[48%] rounded-jar border-2 border-ink/20 p-4 active:opacity-80"
    >
      <Text numberOfLines={1} className="font-semibold text-xl text-ink">
        {name}
      </Text>
      <Text className="mb-2 text-sm text-ink/70">
        {jars.length} {jars.length === 1 ? 'jar' : 'jars'}
      </Text>
      <View className="mt-auto">
        {totals.length === 0 ? (
          <Text className="text-base text-ink/60">Empty</Text>
        ) : (
          totals.map((r) => (
            <View key={r.key}>
              <Text className="text-xs text-ink/70">{categoryLabel(r.category)}</Text>
              <Text className="font-semibold text-lg text-ink">
                {formatMoney(r.total, r.currency)}
              </Text>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
}
