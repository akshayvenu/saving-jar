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
import { useJarStore } from '@/store/useJarStore';
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
    <View style={StyleSheet.absoluteFill} pointerEvents={jar ? 'auto' : 'none'}>
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
          className="rounded-t-3xl bg-surface dark:bg-surface-cardDark"
          style={{ flexShrink: 1, paddingBottom: insets.bottom }}
        >
          <GestureDetector gesture={pan}>
            <View className="items-center pb-4 pt-3">
              <View className="h-1.5 w-10 rounded-full bg-ink-muted/40" />
            </View>
          </GestureDetector>

          <View className="border-b border-ink-muted/30 px-6 pb-4 pt-2">
            <Text
              accessibilityRole="header"
              className="font-bold text-2xl text-ink dark:text-ink-dark"
            >
              History
            </Text>
            <Text className="mt-1 text-sm text-ink-muted dark:text-ink-mutedDark">
              {txs.length} transaction{txs.length === 1 ? '' : 's'}
            </Text>
          </View>

          <FlatList
            data={txs}
            keyExtractor={(t) => t.id}
            style={{ flexShrink: 1 }}
            renderItem={({ item }) => <TransactionRow tx={item} currency={shown.currency} />}
            ListEmptyComponent={
              <View className="items-center px-8 py-12">
                <MaterialCommunityIcons name="history" size={64} color="#9AA0A6" />
                <Text className="mt-3 text-center text-lg text-ink-muted dark:text-ink-mutedDark">
                  No transactions yet.
                </Text>
              </View>
            }
          />

          <View className="items-end border-t border-ink-muted/30 px-6">
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="min-h-[52px] justify-center px-2 active:opacity-70"
            >
              <Text className="text-lg text-brand">Close</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
