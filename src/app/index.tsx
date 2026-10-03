import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalanceHero } from '@/components/home/balance-hero';
import { BasketCard, NewBasketCard } from '@/components/home/basket-card';
import { QuickActions } from '@/components/home/quick-actions';
import { BrandMark } from '@/components/ui/brand-mark';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { SectionLabel } from '@/components/ui/section-label';
import { ALL_ID, UNSORTED_ID, computeTotals, jarsInBasket } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';

export default function OverviewScreen() {
  const insets = useSafeAreaInsets();
  const jars = useJarStore((s) => s.jars);
  const baskets = useJarStore((s) => s.baskets);
  const defaultCurrency = useJarStore((s) => s.defaultCurrency);

  const active = useMemo(() => jarsInBasket(jars, ALL_ID), [jars]);
  const totals = useMemo(() => computeTotals(active), [active]);
  const unsorted = useMemo(() => jarsInBasket(jars, UNSORTED_ID), [jars]);
  const open = (id: string) => router.push({ pathname: '/basket/[id]', params: { id } });

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View className="flex-row items-center gap-2.5">
          <BrandMark size={11} />
          <Text className="font-display-bold text-2xl tracking-tight text-ink">JamJars</Text>
        </View>
        <IconButton
          variant="card"
          icon="cog-outline"
          label="Settings"
          onPress={() => router.push('/settings')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <BalanceHero rows={totals} jars={active} fallbackCurrency={defaultCurrency} />

        <View className="mt-5">
          <QuickActions
            actions={[
              {
                key: 'new',
                label: 'New jar',
                icon: 'plus',
                highlight: true,
                onPress: () => router.push('/jar/new'),
              },
              {
                key: 'all',
                label: 'All jars',
                icon: 'view-grid-outline',
                onPress: () => open(ALL_ID),
              },
              {
                key: 'baskets',
                label: 'Baskets',
                icon: 'basket-outline',
                onPress: () => router.push('/baskets'),
              },
              {
                key: 'archive',
                label: 'Archive',
                icon: 'archive-outline',
                onPress: () => router.push('/archive'),
              },
            ]}
          />
        </View>

        <View className="px-5">
          <SectionLabel meta={`${baskets.length} · ${active.length} jars`}>Baskets</SectionLabel>
        </View>
        <View className="flex-row flex-wrap justify-between gap-y-3 px-5">
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
            <BasketCard
              name="Unsorted"
              color="slate"
              jars={unsorted}
              onPress={() => open(UNSORTED_ID)}
            />
          )}
          <NewBasketCard onPress={() => router.push('/baskets')} />
        </View>
        {baskets.length === 0 && unsorted.length === 0 && (
          <Text className="px-8 pt-5 text-center font-sans text-base text-ink-muted">
            Create a basket to start organising your jars.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
