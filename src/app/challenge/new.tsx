import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { formatMoney } from '@/lib/format';
import { useJarStore } from '@/store/useJarStore';

const DURATIONS = [3, 5, 7];

export default function NewChallengeScreen() {
  const { jarId } = useLocalSearchParams<{ jarId: string }>();
  const insets = useSafeAreaInsets();
  const jar = useJarStore((s) => s.jars.find((j) => j.id === jarId));
  const startChallenge = useJarStore((s) => s.startChallenge);

  const [days, setDays] = useState(3);

  if (!jar) return null;

  // The budget is the jar's current balance and can't be changed.
  const amount = jar.saved;
  const invalid = amount <= 0;
  const money = (v: number) => formatMoney(v, jar.currency);
  const perDay = invalid ? 0 : Math.round(amount / days);

  return (
    <Screen>
      <ScreenHeader title="New challenge" eyebrow={jar.name} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Budget"
          value={money(amount)}
          editable={false}
          error={invalid ? 'Add money to this jar before starting a challenge' : undefined}
          helper={`Your jar's current balance, spread over the days`}
        />

        <Text className="mb-1.5 ml-1 mt-5 font-medium text-sm text-ink-muted">Duration</Text>
        <View className="flex-row gap-2">
          {DURATIONS.map((d) => {
            const active = d === days;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${d} days`}
                onPress={() => setDays(d)}
                className={`flex-1 items-center rounded-full border-hair border-ink py-2.5 ${
                  active ? 'bg-ink' : 'bg-surface-card active:bg-surface-sunken'
                }`}
              >
                <Text className={`font-display-semibold ${active ? 'text-white' : 'text-ink'}`}>
                  {d} days
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-5 rounded-block border-hair border-ink bg-surface-card p-4">
          <Text className="font-display-semibold text-2xl text-ink">{money(perDay)} / day</Text>
          <Text className="mt-0.5 font-sans text-sm text-ink-muted">
            {money(perDay * 7)} / week at this pace
          </Text>
        </View>

        <Button
          title="Start challenge"
          icon="timer-sand"
          className="mt-6"
          disabled={invalid}
          onPress={() => {
            if (invalid) return;
            const id = startChallenge(jar.id, amount, days);
            router.replace({ pathname: '/challenge/[id]', params: { id } });
          }}
        />
      </ScrollView>
    </Screen>
  );
}
