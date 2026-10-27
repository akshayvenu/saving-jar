import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChallengeHero } from '@/components/challenge/challenge-hero';
import { DayCard } from '@/components/challenge/day-card';
import { SurplusCard } from '@/components/challenge/surplus-card';
import { TransferAnimation } from '@/components/challenge/transfer-animation';
import { AmountSheet } from '@/components/home/amount-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { OptionSheet } from '@/components/ui/option-sheet';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionLabel } from '@/components/ui/section-label';
import { currentDay, dailyLimit, isFinished, spentOnDay, surplus } from '@/lib/challenge';
import { formatMoney } from '@/lib/format';
import { jarIcon } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const challenge = useJarStore((s) => s.challenges.find((c) => c.id === id));
  const jars = useJarStore((s) => s.jars);
  const { logExpense, removeExpense, endChallenge, transferSurplus, deleteJar } =
    useJarStore.getState();

  const [logDay, setLogDay] = useState<number | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [moving, setMoving] = useState<{ to: Jar; amount: number } | null>(null);

  const jar = jars.find((j) => j.id === challenge?.jarId);
  const movedTo = jars.find((j) => j.id === challenge?.transfer?.jarId)?.name;

  // Surplus can go to any other live savings jar in the same currency.
  const targets = useMemo(
    () =>
      jars.filter(
        (j) => j.id !== jar?.id && !j.archived && !j.debt && j.currency === jar?.currency,
      ),
    [jars, jar?.id, jar?.currency],
  );

  if (!challenge || !jar) {
    return (
      <Screen>
        <ScreenHeader title="Challenge" />
        <EmptyState text="This challenge no longer exists." />
      </Screen>
    );
  }

  const finished = isFinished(challenge);
  const today = currentDay(challenge);
  const days = Array.from({ length: challenge.days }, (_, i) => i + 1);
  const money = (v: number) => formatMoney(v, jar.currency);

  const confirmEnd = () =>
    Alert.alert('End challenge?', 'No more expenses can be logged after this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => endChallenge(challenge.id) },
    ]);

  const confirmRemove = (expenseId: string) =>
    Alert.alert('Remove expense?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeExpense(challenge.id, expenseId) },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title={jar.name}
        eyebrow="Spending challenge"
        right={
          <View
            style={{ backgroundColor: jarColors[jar.color] }}
            className="h-9 w-9 rounded-xl border-hair border-ink"
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <ChallengeHero challenge={challenge} jar={jar} />

        <View className="px-5">
          <SectionLabel>Days</SectionLabel>
        </View>
        {days.map((d) => (
          <DayCard
            key={d}
            challenge={challenge}
            day={d}
            today={today}
            currency={jar.currency}
            canLog={!finished}
            onLog={setLogDay}
            onRemove={confirmRemove}
          />
        ))}

        <View className="px-5">
          <SectionLabel>Surplus</SectionLabel>
        </View>
        <SurplusCard
          challenge={challenge}
          currency={jar.currency}
          movedTo={movedTo}
          onEnd={confirmEnd}
          onMove={() => setPickOpen(true)}
        />
        <Text className="mx-5 mt-3 text-center font-sans text-xs text-ink-muted">
          Expenses are tracked here only. Moving the surplus to another jar deletes {jar.name}.
        </Text>
      </ScrollView>

      <AmountSheet
        jar={logDay != null ? jar : null}
        mode="minus"
        title={logDay != null ? `Spent on Day ${logDay}` : undefined}
        subtitle={
          logDay != null
            ? `${money(Math.max(dailyLimit(challenge) - spentOnDay(challenge, logDay), 0))} left of ${money(dailyLimit(challenge))}`
            : undefined
        }
        submitLabel="Log expense"
        onClose={() => setLogDay(null)}
        onSubmit={(_, __, amount, note) => {
          if (logDay != null) logExpense(challenge.id, logDay, amount, note);
          setLogDay(null);
        }}
      />

      {moving && (
        <TransferAnimation
          from={jar}
          to={moving.to}
          amount={moving.amount}
          onDone={() => {
            transferSurplus(challenge.id, moving.to.id);
            deleteJar(jar.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          }}
        />
      )}

      <OptionSheet
        visible={pickOpen}
        title="Move surplus to"
        options={targets.map((j) => ({
          key: j.id,
          label: `${j.name} · ${money(j.saved)}`,
          icon: jarIcon(j),
        }))}
        onClose={() => setPickOpen(false)}
        onSelect={(jarId) => {
          setPickOpen(false);
          const to = targets.find((j) => j.id === jarId);
          if (!to) return;
          // Moving the surplus closes out this jar, so it goes with its history.
          Alert.alert(
            `Move ${money(surplus(challenge))} to ${to.name}?`,
            `"${jar.name}" and its history will be deleted. This can't be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Move & delete',
                style: 'destructive',
                // Animate first; the real transfer and delete happen when it finishes.
                onPress: () => setMoving({ to, amount: surplus(challenge) }),
              },
            ],
          );
        }}
      />
    </Screen>
  );
}
