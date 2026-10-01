import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BasketCard } from '@/components/home/basket-card';
import { BasketSheet } from '@/components/home/basket-sheet';
import { BottomBar } from '@/components/home/bottom-bar';
import { TotalsCard } from '@/components/home/totals-card';
import { Screen } from '@/components/ui/screen';
import { ALL_ID, UNSORTED_ID, computeTotals, jarsInBasket } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';

export default function OverviewScreen() {
  const insets = useSafeAreaInsets();
  const jars = useJarStore((s) => s.jars);
  const baskets = useJarStore((s) => s.baskets);
  const [basketsOpen, setBasketsOpen] = useState(false);

  const active = useMemo(() => jarsInBasket(jars, ALL_ID), [jars]);
  const totals = useMemo(() => computeTotals(active), [active]);
  const unsorted = useMemo(() => jarsInBasket(jars, UNSORTED_ID), [jars]);
  const open = (id: string) => router.push({ pathname: '/basket/[id]', params: { id } });

  return (
    <Screen>
      <View className="px-5 pb-3 pt-4">
        <Text
          accessibilityRole="header"
          className="font-medium text-3xl text-ink dark:text-ink-dark"
        >
          {baskets.length} baskets · {active.length} jars
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <TotalsCard rows={totals} />
        <View className="flex-row flex-wrap justify-between gap-y-4 px-4 pt-5">
          {baskets.map((b) => (
            <BasketCard
              key={b.id}
              name={b.name}
              color={b.color}
              jars={jarsInBasket(jars, b.id)}
              onPress={() => open(b.id)}
            />
          ))}
          {unsorted.length > 0 && (
            <BasketCard name="Unsorted" color="slate" jars={unsorted} onPress={() => open(UNSORTED_ID)} />
          )}
        </View>
        {baskets.length === 0 && unsorted.length === 0 && (
          <View className="items-center px-8 pt-16">
            <MaterialCommunityIcons name="basket-plus-outline" size={72} color="#9AA0A6" />
            <Text className="mt-4 text-center text-lg text-ink-muted dark:text-ink-mutedDark">
              Create a basket to start organising your jars.
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomBar onBaskets={() => setBasketsOpen(true)} />
      <BasketSheet visible={basketsOpen} onClose={() => setBasketsOpen(false)} />
    </Screen>
  );
}
