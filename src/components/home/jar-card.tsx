import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { formatMoney, formatPercent } from '@/lib/format';
import { progressOf, remainingOf } from '@/store/selectors';
import { jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

import { JarFill } from './jar-fill';

interface Props {
  jar: Jar;
  onAdd: (jar: Jar) => void;
  onMinus: (jar: Jar) => void;
  onEdit: (jar: Jar) => void;
  onDelete: (jar: Jar) => void;
  onHistory: (jar: Jar) => void;
  onTogglePin: (jar: Jar) => void;
  onMore: (jar: Jar) => void;
}

export const JarCard = memo(function JarCard({
  jar,
  onAdd,
  onMinus,
  onEdit,
  onDelete,
  onHistory,
  onTogglePin,
  onMore,
}: Props) {
  const progress = progressOf(jar);
  const remaining = remainingOf(jar);
  const bg = jarColors[jar.color];

  return (
    <View
      style={{ backgroundColor: bg }}
      className="mb-5 overflow-hidden rounded-jar border-2 border-ink"
    >
      <JarFill progress={progress} color="rgba(0,0,0,0.16)" />
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            <MaterialCommunityIcons name="wallet-outline" size={26} color="#1B1B1B" />
            <Text numberOfLines={1} className="flex-1 font-bold text-2xl text-ink">
              {jar.name}
            </Text>
          </View>
          <IconButton
            icon={jar.pinned ? 'pin' : 'pin-outline'}
            label={jar.pinned ? `Unpin ${jar.name}` : `Pin ${jar.name}`}
            onPress={() => onTogglePin(jar)}
          />
        </View>

        <Text className="mt-1 text-center text-lg text-ink">
          {formatMoney(jar.saved, jar.currency)}
          {jar.goal ? ` / ${formatMoney(jar.goal, jar.currency)} (${formatPercent(progress)})` : ''}
        </Text>
        {remaining != null && (
          <Text className="mt-1 text-center text-lg text-ink">
            Remaining: {formatMoney(remaining, jar.currency)}
          </Text>
        )}

        <View className="mt-4 flex-row gap-3">
          <Button
            title="Minus"
            variant="danger"
            className="flex-1 rounded-xl"
            onPress={() => onMinus(jar)}
          />
          <Button
            title="Add"
            variant="success"
            className="flex-1 rounded-xl"
            onPress={() => onAdd(jar)}
          />
        </View>

        <View className="mt-3 flex-row items-center justify-around">
          <IconButton
            icon="pencil-outline"
            label={`Edit ${jar.name}`}
            onPress={() => onEdit(jar)}
          />
          <IconButton
            icon="tray-arrow-down"
            label={`Quick add to ${jar.name}`}
            onPress={() => onAdd(jar)}
          />
          <IconButton
            icon="trash-can-outline"
            label={`Delete ${jar.name}`}
            onPress={() => onDelete(jar)}
          />
          <IconButton
            icon="history"
            label={`History of ${jar.name}`}
            onPress={() => onHistory(jar)}
          />
          <IconButton
            icon="dots-vertical"
            label={`More options for ${jar.name}`}
            onPress={() => onMore(jar)}
          />
        </View>
      </View>
    </View>
  );
});
