import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Pressable,
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

import { TransactionRow } from '@/components/history/transaction-row';
import { Button } from '@/components/ui/button';
import { SheetHandle } from '@/components/ui/sheet-frame';
import { formatMoney } from '@/lib/format';
import { useJarStore } from '@/store/useJarStore';
import { ink } from '@/theme/colors';
import type { Jar } from '@/types';

interface Props {
  /** The sheet is open while `jar` is set. */
  jar: Jar | null;
  onClose: () => void;
}

const SPRING = { damping: 80, stiffness: 500, mass: 1, overshootClamping: true };
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };

/** Bottom sheet listing a jar's transactions, newest first. */
export function HistorySheet({ jar, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const all = useJarStore((s) => s.transactions);
  // Keep the last jar rendered while the close animation runs.
  const [shown, setShown] = useState<Jar | null>(jar);
  if (jar && jar !== shown) setShown(jar);

  const txs = useMemo(
    () =>
      shown
        ? all
            .filter((t) => t.jarId === shown.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [all, shown],
  );

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

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={jar ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        onLayout={onLayout}
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: windowHeight * 0.85 },
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
                {shown.name} · {txs.length} {txs.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            <View className="rounded-full bg-ink px-3 py-1">
              <Text className="font-display-semibold text-sm text-white">
                {formatMoney(shown.saved, shown.currency)}
              </Text>
            </View>
          </View>

          <View
            style={{ flexShrink: 1 }}
            className="mx-4 overflow-hidden rounded-jar border-hair border-ink bg-surface-card"
          >
            <FlatList
              data={txs}
              keyExtractor={(t) => t.id}
              style={{ flexShrink: 1 }}
              renderItem={({ item }) => <TransactionRow tx={item} currency={shown.currency} />}
              ListEmptyComponent={
                <View className="items-center px-8 py-12">
                  <MaterialCommunityIcons name="history" size={48} color={ink.faint} />
                  <Text className="mt-3 text-center font-sans text-base text-ink-muted">
                    No transactions yet.
                  </Text>
                </View>
              }
            />
          </View>

          <View className="px-4 pt-3">
            <Button title="Close" variant="secondary" compact onPress={onClose} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
