import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BasketSheet } from '@/components/home/basket-sheet';
import { BottomBar } from '@/components/home/bottom-bar';
import { JarList } from '@/components/home/jar-list';
import { SortSheet } from '@/components/home/sort-sheet';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ALL_ID, UNSORTED_ID, jarsInBasket } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { jar as jarColors } from '@/theme/colors';

export default function BasketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jars = useJarStore((s) => s.jars);
  const basket = useJarStore((s) => s.baskets.find((b) => b.id === id));
  const [sortOpen, setSortOpen] = useState(false);
  const [basketsOpen, setBasketsOpen] = useState(false);

  const scoped = useMemo(() => jarsInBasket(jars, id), [jars, id]);
  const title = id === ALL_ID ? 'All jars' : id === UNSORTED_ID ? 'Unsorted' : (basket?.name ?? '');
  const dot = basket ? jarColors[basket.color] : id === UNSORTED_ID ? jarColors.slate : undefined;
  const real = !!basket;

  return (
    <Screen>
      <ScreenHeader
        title={title}
        right={
          dot ? <View style={{ backgroundColor: dot }} className="mr-3 h-5 w-5 rounded-full" /> : null
        }
      />
      <JarList
        jars={scoped}
        grouped={id === ALL_ID}
        emptyText="No jars here yet. Tap + to create one."
      />
      <BottomBar
        onBaskets={() => setBasketsOpen(true)}
        onSort={() => setSortOpen(true)}
        newJarBasketId={real ? id : undefined}
      />
      <SortSheet visible={sortOpen} onClose={() => setSortOpen(false)} />
      <BasketSheet visible={basketsOpen} currentId={id} onClose={() => setBasketsOpen(false)} />
    </Screen>
  );
}
