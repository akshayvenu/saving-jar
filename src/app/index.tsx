import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmountSheet, type AmountMode } from '@/components/home/amount-sheet';
import { BalanceHero } from '@/components/home/balance-hero';
import { AllJarsRow, BasketRow } from '@/components/home/basket-card';
import { FloatingCreateButton } from '@/components/home/bottom-bar';
import { JarRow } from '@/components/home/jar-row';
import { BrandMark } from '@/components/ui/brand-mark';
import { IconButton } from '@/components/ui/icon-button';
import { ListCard } from '@/components/ui/list-card';
import { Screen } from '@/components/ui/screen';
import { SectionLabel } from '@/components/ui/section-label';
import {
  ALL_ID,
  UNSORTED_ID,
  computeTotals,
  jarsInBasket,
  sortJars,
} from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import type { Jar } from '@/types';

const FALLBACK_JARS = 3;

export default function OverviewScreen() {
  const insets = useSafeAreaInsets();
  const jars = useJarStore((s) => s.jars);
  const baskets = useJarStore((s) => s.baskets);
  const defaultCurrency = useJarStore((s) => s.defaultCurrency);
  const [target, setTarget] = useState<{ jar: Jar | null; mode: AmountMode }>({
    jar: null,
    mode: 'add',
  });

  const active = useMemo(() => jarsInBasket(jars, ALL_ID), [jars]);
  const totals = useMemo(() => computeTotals(active), [active]);
  const unsorted = useMemo(() => jarsInBasket(jars, UNSORTED_ID), [jars]);

  const pinned = useMemo(() => active.filter((j) => j.pinned), [active]);
  const featured = useMemo(
    () => (pinned.length > 0 ? pinned : sortJars(active, 'amount', 'desc').slice(0, FALLBACK_JARS)),
    [pinned, active],
  );

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
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <BalanceHero rows={totals} jars={active} fallbackCurrency={defaultCurrency} />

        {featured.length > 0 && (
          <View className="px-5">
            <SectionLabel>{pinned.length > 0 ? 'Pinned' : 'Your jars'}</SectionLabel>
            <ListCard>
              {featured.map((j) => (
                <JarRow
                  key={j.id}
                  jar={j}
                  onOpen={(x) => open(x.basketId ?? UNSORTED_ID)}
                  onAdd={(x) => setTarget({ jar: x, mode: 'add' })}
                />
              ))}
            </ListCard>
          </View>
        )}

        <View className="px-5">
          <SectionLabel action={{ label: 'Manage', onPress: () => router.push('/baskets') }}>
            Baskets
          </SectionLabel>
          <ListCard>
            {[
              ...baskets.map((b) => (
                <BasketRow
                  key={b.id}
                  name={b.name}
                  color={b.color}
                  jars={jarsInBasket(jars, b.id)}
                  onPress={() => open(b.id)}
                />
              )),
              ...(unsorted.length > 0
                ? [
                    <BasketRow
                      key={UNSORTED_ID}
                      name="Unsorted"
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

        {baskets.length === 0 && unsorted.length === 0 && (
          <Text className="px-8 pt-5 text-center font-sans text-base text-ink-muted">
            Create a basket to start organising your jars.
          </Text>
        )}
      </ScrollView>

      <FloatingCreateButton />

      <AmountSheet
        jar={target.jar}
        mode={target.mode}
        onClose={() => setTarget((t) => ({ ...t, jar: null }))}
        onSubmit={(jar, mode, amount, note) => {
          useJarStore.getState().applyAmount(jar.id, mode, amount, note);
          setTarget((t) => ({ ...t, jar: null }));
        }}
      />
    </Screen>
  );
}
