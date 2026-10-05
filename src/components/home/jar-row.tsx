import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { formatMoney } from '@/lib/format';
import { progressOf } from '@/store/selectors';
import { jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

interface Props {
  jar: Jar;
  onOpen: (jar: Jar) => void;
  onAdd: (jar: Jar) => void;
}

/** Compact jar line: tap to open its basket, tap + to add money. */
export function JarRow({ jar, onOpen, onAdd }: Props) {
  return (
    <View className="flex-row items-center pr-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${jar.name}, ${formatMoney(jar.saved, jar.currency)}`}
        onPress={() => onOpen(jar)}
        className="flex-1 flex-row items-center gap-3 py-3 pl-4 active:bg-surface-sunken"
      >
        <View
          style={{ backgroundColor: jarColors[jar.color] }}
          className="h-4 w-4 rounded-full border-hair border-ink"
        />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-display-semibold text-base text-ink">
            {jar.name}
          </Text>
          {jar.goal ? (
            <View className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-line">
              <View
                style={{ width: `${progressOf(jar) * 100}%` }}
                className="h-full rounded-full bg-ink"
              />
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="font-display-semibold text-base text-ink">
          {formatMoney(jar.saved, jar.currency)}
        </Text>
      </Pressable>
      <IconButton
        variant="ink"
        size={20}
        icon="plus"
        label={`Add to ${jar.name}`}
        onPress={() => onAdd(jar)}
        className="ml-2 h-10 w-10"
      />
    </View>
  );
}
