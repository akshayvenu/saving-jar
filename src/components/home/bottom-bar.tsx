import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { OptionSheet } from '@/components/ui/option-sheet';
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
      <CreateButton basketId={newJarBasketId} />
    </View>
  );
}

/** Brand-colored "+" tile offering a new jar (optionally preselecting a basket) or a new basket. */
export function CreateButton({ basketId }: { basketId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create"
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          boxShadow: pressed ? undefined : SHADOW,
          transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined,
        })}
        className="h-[58px] w-[58px] items-center justify-center rounded-[20px] border-hair border-ink bg-brand"
      >
        <Icon name="plus" size={30} color="#FFFFFF" />
      </Pressable>
      <OptionSheet
        visible={open}
        title="Create"
        options={[
          { key: 'jar', label: 'New Jar', icon: 'beaker-plus-outline' },
          { key: 'basket', label: 'New Basket', icon: 'basket-plus-outline' },
        ]}
        onClose={() => setOpen(false)}
        onSelect={(key) => {
          setOpen(false);
          if (key === 'jar') {
            router.push({ pathname: '/jar/new', params: basketId ? { basketId } : {} });
          } else router.push({ pathname: '/baskets', params: { new: '1' } });
        }}
      />
    </>
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
      <CreateButton />
    </View>
  );
}
