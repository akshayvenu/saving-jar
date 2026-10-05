import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalanceHero } from '@/components/home/balance-hero';
import { AllJarsRow, BasketRow } from '@/components/home/basket-card';
import { FloatingCreateButton } from '@/components/home/bottom-bar';
import { BrandMark } from '@/components/ui/brand-mark';
import { IconButton } from '@/components/ui/icon-button';
import { ListCard } from '@/components/ui/list-card';
import { Screen } from '@/components/ui/screen';
import { SectionLabel } from '@/components/ui/section-label';
import {
  ALL_ID,
  NO_BASKET_LABEL,
  UNSORTED_ID,
  computeTotals,
  jarsInBasket,
} from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';

export default function OverviewScreen() {
  const insets = useSafeAreaInsets();
  const jars = useJarStore((s) => s.jars);
  const baskets = useJarStore((s) => s.baskets);
  const defaultCurrency = useJarStore((s) => s.defaultCurrency);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const active = useMemo(() => jarsInBasket(jars, ALL_ID), [jars]);
  const totals = useMemo(() => computeTotals(active), [active]);
  const row = totals.find((r) => r.key === selectedKey) ?? totals[0];

  const basketRows = useMemo(
    () => baskets.map((b) => ({ basket: b, jars: jarsInBasket(jars, b.id) })),
    [baskets, jars],
  );
  const unsorted = useMemo(() => jarsInBasket(jars, UNSORTED_ID), [jars]);

  const open = (id: string) => router.push({ pathname: '/basket/[id]', params: { id } });

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View className="flex-row items-center gap-2.5">
          <BrandMark size={11} />
          <Text className="font-display-bold text-2xl tracking-tight text-ink">Saving Jar</Text>
        </View>
        <IconButton
          variant="card"
          icon="cog-outline"
          label="Settings"
          onPress={() => router.push('/settings')}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <BalanceHero
          rows={totals}
          row={row}
          onSelect={setSelectedKey}
          jars={active}
          fallbackCurrency={defaultCurrency}
        />

        <View className="px-5">
          <SectionLabel action={{ label: 'Manage', onPress: () => router.push('/baskets') }}>
            Baskets
          </SectionLabel>
          <ListCard>
            {[
              ...basketRows.map(({ basket: b, jars: list }) => (
                <BasketRow
                  key={b.id}
                  name={b.name}
                  color={b.color}
                  jars={list}
                  onPress={() => open(b.id)}
                />
              )),
              ...(unsorted.length > 0
                ? [
                    <BasketRow
                      key={UNSORTED_ID}
                      name={NO_BASKET_LABEL}
                      color="slate"
                      jars={unsorted}
                      onPress={() => open(UNSORTED_ID)}
                    />,
                  ]
                : []),
              <AllJarsRow key={ALL_ID} count={active.length} onPress={() => open(ALL_ID)} />,
            ]}
          </ListCard>
        </View>

        {active.length === 0 && (
          <Text className="px-8 pt-5 text-center font-sans text-base text-ink-muted">
            Tap + to create your first jar. Baskets are optional — use them to group jars later.
          </Text>
        )}
      </ScrollView>

      <FloatingCreateButton />
    </Screen>
  );
}
