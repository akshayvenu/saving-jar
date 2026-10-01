import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

import { Button } from '@/components/ui/button';
import { formatMoney, parseAmount } from '@/lib/format';
import type { Jar } from '@/types';

export type AmountMode = 'add' | 'minus';

interface Props {
  /** The sheet is open while `jar` is set. */
  jar: Jar | null;
  mode: AmountMode;
  onSubmit: (jar: Jar, mode: AmountMode, amount: number, note?: string) => void;
  onClose: () => void;
}

const QUICK = [100, 500, 1000];

// Critically-damped spring: glides up without bouncing.
const SPRING = { damping: 80, stiffness: 500, mass: 1, overshootClamping: true };
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };

/**
 * Bottom sheet for adding to / taking from a jar. Driven by the `jar` prop
 * and rendered in-tree (no portal), so it always opens on tap and follows
 * the keyboard frame-by-frame.
 */
export function AmountSheet({ jar, mode, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  // Keep the last jar rendered while the close animation runs.
  const [shown, setShown] = useState<Jar | null>(jar);
  if (jar && jar !== shown) setShown(jar);

  const progress = useSharedValue(0); // 0 = hidden, 1 = open
  const drag = useSharedValue(0);
  const height = useSharedValue(800);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      keyboardHeight.set(withTiming(e.endCoordinates.height, { duration: 150 })),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      keyboardHeight.set(withTiming(0, { duration: 150 })),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [keyboardHeight]);

  useEffect(() => {
    if (jar) {
      drag.set(0);
      progress.set(withSpring(1, SPRING));
      // Focus once the slide-up settles so the keyboard doesn't open mid-animation.
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    } else {
      Keyboard.dismiss();
      // Unmount and clear the form once the slide-down finishes.
      const finish = () => {
        setShown(null);
        setValue('');
        setNote('');
      };
      progress.set(
        withTiming(0, CLOSE, (done) => {
          if (done) scheduleOnRN(finish);
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

  const sheetStyle = useAnimatedStyle(() => {
    const lift = Math.max(0, keyboardHeight.get() - insets.bottom);
    return {
      transform: [{ translateY: (1 - progress.get()) * height.get() + drag.get() - lift }],
    };
  });
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() * 0.4 }));

  if (!shown) return null;

  const amount = parseAmount(value);
  const invalid = amount == null || amount <= 0;
  const isAdd = mode === 'add';

  const submit = () => {
    if (!jar || invalid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(jar, mode, amount, note);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    height.set(e.nativeEvent.layout.height);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={jar ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        onLayout={onLayout}
        style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, sheetStyle]}
      >
        <View
          className="rounded-t-3xl bg-surface px-5 dark:bg-surface-cardDark"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <GestureDetector gesture={pan}>
            <View className="items-center pb-4 pt-3">
              <View className="h-1.5 w-10 rounded-full bg-ink-muted/40" />
            </View>
          </GestureDetector>

          <Text className="font-bold text-2xl text-ink dark:text-ink-dark">
            {isAdd ? 'Add to' : 'Take from'} {shown.name}
          </Text>
          <Text className="mt-1 text-ink-muted dark:text-ink-mutedDark">
            Balance: {formatMoney(shown.saved, shown.currency)}
          </Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="0"
            accessibilityLabel="Amount"
            className="my-4 rounded-2xl border border-ink-muted/60 px-4 py-3 text-center font-bold text-4xl text-ink dark:text-ink-dark"
            style={{ fontFamily: 'Jost_700Bold' }}
          />

          <View className="mb-4 flex-row gap-2">
            {QUICK.map((q) => (
              <Pressable
                key={q}
                accessibilityRole="button"
                accessibilityLabel={`Set amount to ${q}`}
                onPress={() => setValue(String(q))}
                className="flex-1 items-center rounded-full bg-brand-soft py-2.5 active:opacity-70"
              >
                <Text className="text-brand">
                  {isAdd ? '+' : '−'}
                  {q}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            accessibilityLabel="Note"
            className="mb-5 rounded-2xl border border-ink-muted/60 px-4 py-3 text-base text-ink dark:text-ink-dark"
          />

          <Button
            title={isAdd ? 'Add' : 'Minus'}
            variant={isAdd ? 'success' : 'danger'}
            disabled={invalid}
            onPress={submit}
          />
        </View>
      </Animated.View>
    </View>
  );
}
