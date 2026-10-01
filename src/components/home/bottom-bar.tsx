import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';

interface Props {
  onBaskets: () => void;
  onSort?: () => void;
  /** Basket id to preselect on the new-jar form. */
  newJarBasketId?: string;
}

export function BottomBar({ onBaskets, onSort, newJarBasketId }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      className="absolute inset-x-0 bottom-0 flex-row items-center justify-between bg-white/95 px-4 pt-3 dark:bg-surface-cardDark/95"
    >
      <View className="flex-row gap-2">
        <IconButton icon="basket-outline" label="Baskets" onPress={onBaskets} />
        {onSort && <IconButton icon="sort-variant" label="Sort jars" onPress={onSort} />}
        <IconButton
          icon="archive-outline"
          label="Archived jars"
          onPress={() => router.push('/archive')}
        />
        <IconButton icon="cog-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>
      <IconButton
        icon="plus"
        label="Create jar"
        size={30}
        className="h-14 w-14 rounded-2xl bg-jar-peach"
        onPress={() =>
          router.push({
            pathname: '/jar/new',
            params: newJarBasketId ? { basketId: newJarBasketId } : {},
          })
        }
      />
    </View>
  );
}
