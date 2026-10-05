import { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BalanceChart } from '@/components/history/balance-chart';
import { TransactionRow } from '@/components/history/transaction-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SheetHandle } from '@/components/ui/sheet-frame';
import { formatMoney, formatPercent } from '@/lib/format';
import { RANGES, balanceSeries, daysToGoal, jarStats, type StatsRange } from '@/lib/jar-stats';
import { progressOf, remainingOf } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { ink, jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

interface Props {
  /** The sheet is open while `jar` is set. */
  jar: Jar | null;
  onClose: () => void;
}

type Tab = 'chart' | 'overview' | 'activity';
const TABS: { key: Tab; label: string }[] = [
  { key: 'chart', label: 'Chart' },
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
];

const DAY = 86_400_000;
const SPRING = { damping: 80, stiffness: 500, mass: 1, overshootClamping: true };
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };

/** Bottom sheet with a jar's balance chart, stats and transactions over 7D / 1M / 1Y. */
export function HistorySheet({ jar, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  // Keep the last jar rendered while the close animation runs.
  const [shown, setShown] = useState<Jar | null>(jar);
  if (jar && jar !== shown) setShown(jar);

  const progress = useSharedValue(0);
  const drag = useSharedValue(0);
  const height = useSharedValue(800);

  useEffect(() => {
    if (jar) {
      drag.set(0);
      progress.set(withSpring(1, SPRING));
    } else {
      progress.set(
        withTiming(0, CLOSE, (done) => {
          if (done) scheduleOnRN(setShown, null);
        }),
      );
    }
  }, [jar, progress, drag]);

  useEffect(() => {
    if (!jar) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [jar, onClose]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      drag.set((d) => Math.max(0, d + e.changeY));
    })
    .onEnd((e) => {
      if (drag.get() > 120 || e.velocityY > 900) {
        scheduleOnRN(onClose);
      } else {
        drag.set(withSpring(0, SPRING));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height.get() + drag.get() }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() * 0.4 }));

  if (!shown) return null;

  const onLayout = (e: LayoutChangeEvent) => height.set(e.nativeEvent.layout.height);
  // Fixed body height so the sheet doesn't jump between tabs.
  const bodyHeight = Math.max(240, Math.min(440, windowHeight * 0.85 - 330));

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={jar ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        onLayout={onLayout}
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: windowHeight * 0.9 },
          sheetStyle,
        ]}
      >
        <View
          className="rounded-t-[32px] border-x-hair border-t-hair border-ink bg-surface"
          style={{ flexShrink: 1, paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <GestureDetector gesture={pan}>
            <View>
              <SheetHandle />
            </View>
          </GestureDetector>

          <View className="flex-row items-end justify-between px-5 pb-4">
            <View className="flex-1">
              <Text accessibilityRole="header" className="font-display-semibold text-2xl text-ink">
                History
              </Text>
              <Text numberOfLines={1} className="font-sans text-sm text-ink-muted">
                {shown.name}
              </Text>
            </View>
            <View className="rounded-full bg-ink px-3 py-1">
              <Text className="font-display-semibold text-sm text-white">
                {formatMoney(shown.saved, shown.currency)}
              </Text>
            </View>
          </View>

          <HistoryBody jar={shown} height={bodyHeight} width={windowWidth - 40} />

          <View className="px-4 pt-3">
            <Button title="Close" variant="secondary" compact onPress={onClose} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/** Range pills, tabs and tab content. Mounted per open, so `now` is when the sheet opened. */
function HistoryBody({ jar, height, width }: { jar: Jar; height: number; width: number }) {
  const all = useJarStore((s) => s.transactions);
  const [now] = useState(() => Date.now());
  const [range, setRange] = useState<StatsRange>('1m');
  const [tab, setTab] = useState<Tab>('chart');

  const rangeDays = RANGES.find((r) => r.key === range)!.days;
  const from = now - rangeDays * DAY;

  /** The jar's transactions, oldest first. */
  const txs = useMemo(
    () =>
      all.filter((t) => t.jarId === jar.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [all, jar.id],
  );
  const points = useMemo(() => balanceSeries(jar, txs, from, now), [jar, txs, from, now]);
  const stats = useMemo(() => jarStats(jar, txs, rangeDays, now), [jar, txs, rangeDays, now]);
  const recent = useMemo(
    () => txs.filter((t) => Date.parse(t.createdAt) >= from).reverse(),
    [txs, from],
  );

  const money = (minor: number) => formatMoney(Math.round(minor), jar.currency);
  const remaining = remainingOf(jar);
  const toGoal = remaining == null ? null : daysToGoal(remaining, stats.dailyAverage);
  const net = stats.depositSum - stats.withdrawalSum;

  return (
    <>
      {/* Range */}
      <View className="flex-row gap-2.5 px-5">
        {RANGES.map((r) => {
          const active = r.key === range;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setRange(r.key)}
              className={`h-10 flex-1 items-center justify-center rounded-full border-hair border-ink ${
                active ? 'bg-ink' : 'bg-surface-card active:bg-surface-sunken'
              }`}
            >
              <Text
                className={`font-display-semibold text-sm ${active ? 'text-white' : 'text-ink'}`}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tabs */}
      <View className="mx-5 mt-4 flex-row border-b-hair border-surface-line">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.key)}
              className="flex-1 items-center pt-1"
            >
              <Text
                className={`pb-2.5 text-[15px] ${
                  active ? 'font-display-semibold text-ink' : 'font-sans text-ink-muted'
                }`}
              >
                {t.label}
              </Text>
              <View
                className={`h-[3px] w-full rounded-full ${active ? 'bg-brand' : 'bg-transparent'}`}
              />
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={{ height }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'chart' && (
          <>
            <BalanceChart
              points={points}
              width={width}
              height={Math.min(260, height - 90)}
              color={jarColors[jar.color]}
            />
            <View className="mt-4 flex-row gap-2.5">
              <Tile label="In" value={money(stats.depositSum)} />
              <Tile label="Out" value={money(stats.withdrawalSum)} />
              <Tile label="Net" value={`${net > 0 ? '+' : ''}${money(net)}`} />
            </View>
          </>
        )}

        {tab === 'overview' && (
          <>
            <Heading>Financial overview</Heading>
            <Row label="Current amount" value={money(jar.saved)} />
            <Row label="Goal amount" value={jar.goal ? money(jar.goal) : '—'} />
            <Row label="Progress" value={jar.goal ? formatPercent(progressOf(jar)) : '—'} />
            <Row label="Amount remaining" value={remaining == null ? '—' : money(remaining)} />

            <Heading className="mt-6">Performance</Heading>
            <Row label="Daily average" value={money(stats.dailyAverage)} />
            <Row
              label="Days to goal"
              value={
                toGoal == null
                  ? '—'
                  : toGoal === 0
                    ? 'Reached'
                    : `${toGoal} ${toGoal === 1 ? 'day' : 'days'}`
              }
            />
            <Row label="Recent transactions (7d)" value={String(stats.recent7d)} />
          </>
        )}

        {tab === 'activity' && (
          <>
            <Heading>Transactions ({rangeDays} days)</Heading>
            <Row label="Total" value={String(stats.deposits + stats.withdrawals)} />
            <Row label="Deposits" value={String(stats.deposits)} />
            <Row label="Withdrawals" value={String(stats.withdrawals)} />
            <Row label="Edits" value={String(stats.edits)} />

            <Heading className="mt-6">Average amounts</Heading>
            <Row
              label="Avg deposit"
              value={stats.avgDeposit == null ? '—' : money(stats.avgDeposit)}
            />
            <Row
              label="Avg withdrawal"
              value={stats.avgWithdrawal == null ? '—' : money(stats.avgWithdrawal)}
            />

            <Heading className="mt-6">Log</Heading>
            <View className="overflow-hidden rounded-jar border-hair border-ink bg-surface-card">
              {recent.length ? (
                recent.map((t) => <TransactionRow key={t.id} tx={t} currency={jar.currency} />)
              ) : (
                <View className="items-center px-8 py-10">
                  <Icon name="history" size={40} color={ink.faint} />
                  <Text className="mt-3 text-center font-sans text-base text-ink-muted">
                    No transactions in this period.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

function Heading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`mb-1 flex-row items-center gap-2 ${className ?? ''}`}>
      <View className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
      <Text
        accessibilityRole="header"
        className="font-display-semibold text-sm uppercase tracking-wider text-ink"
      >
        {children}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b-hair border-surface-line py-3">
      <Text className="flex-1 font-sans text-[15px] text-ink-muted">{label}</Text>
      <Text className="font-display-semibold text-base text-ink">{value}</Text>
    </View>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl border-hair border-ink bg-surface-card px-3 py-2">
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className="font-display-semibold text-base text-ink"
      >
        {value}
      </Text>
      <Text className="font-sans text-xs text-ink-muted">{label}</Text>
    </View>
  );
}
