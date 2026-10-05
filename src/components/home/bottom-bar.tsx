import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { ink } from '@/theme/colors';

interface Props {
  onBaskets: () => void;
  onSort?: () => void;
  /** Basket id to preselect on the new-jar form. */
  newJarBasketId?: string;
}

const SHADOW = `3px 3px 0px ${ink.DEFAULT}`;

/** Floating dock: outlined tool pill on the left, solid ink "create" tile on the right. */
export function BottomBar({ onBaskets, onSort, newJarBasketId }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
      className="absolute inset-x-0 bottom-0 flex-row items-center justify-between px-5"
    >
      <View
        style={{ boxShadow: SHADOW }}
        className="flex-row gap-1 rounded-full border-hair border-ink bg-surface-card p-1.5"
      >
        <IconButton icon="basket-outline" label="Baskets" onPress={onBaskets} />
        {onSort && <IconButton icon="sort-variant" label="Sort jars" onPress={onSort} />}
        <IconButton
          icon="archive-outline"
          label="Archived jars"
          onPress={() => router.push('/archive')}
        />
        <IconButton icon="cog-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>
      <CreateJarButton basketId={newJarBasketId} />
    </View>
  );
}

/** Brand-colored "+" tile that opens the new-jar form, optionally preselecting a basket. */
export function CreateJarButton({ basketId }: { basketId?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create jar"
      hitSlop={6}
      onPress={() =>
        router.push({
          pathname: '/jar/new',
          params: basketId ? { basketId } : {},
        })
      }
      style={({ pressed }) => ({
        boxShadow: pressed ? undefined : SHADOW,
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined,
      })}
      className="h-[58px] w-[58px] items-center justify-center rounded-[20px] border-hair border-ink bg-brand"
    >
      <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
    </Pressable>
  );
}

/** Home screen variant: just the create button, floating bottom-right. */
export function FloatingCreateButton() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
      className="absolute inset-x-0 bottom-0 items-end px-5"
    >
      <CreateJarButton />
    </View>
  );
}
