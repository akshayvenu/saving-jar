import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/lib/format';
import { ink, jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

const TILE_H = 92;
const GAP = 120;
const TRAVEL = TILE_H + GAP;
const CARD_SHADOW = `4px 4px 0px ${ink.DEFAULT}`;

interface Props {
  from: Jar;
  to: Jar;
  /** Minor units moving across. */
  amount: number;
  /** Fires once the animation has finished; the caller does the real transfer and delete. */
  onDone: () => void;
}

/**
 * Full-screen "moving and deleting" moment: the surplus flies from the finished jar into the
 * destination jar, then the finished jar shakes, shrinks and vanishes.
 */
export function TransferAnimation({ from, to, amount, onDone }: Props) {
  const fade = useSharedValue(0);
  const chipY = useSharedValue(0);
  const chipScale = useSharedValue(0);
  const destScale = useSharedValue(1);
  const plus = useSharedValue(0);
  const srcScale = useSharedValue(1);
  const srcRot = useSharedValue(0);
  const srcOpacity = useSharedValue(1);
  const trash = useSharedValue(0);
  const done = useSharedValue(0);
  const [phase, setPhase] = useState<'move' | 'delete'>('move');
  // Held in a ref so a parent re-render can't restart the animation.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  const money = (v: number) => formatMoney(v, from.currency);

  useEffect(() => {
    const finish = () => doneRef.current();
    fade.set(withTiming(1, { duration: 200 }));

    // 1. The amount pops out of the source and glides down into the destination.
    chipY.set(withDelay(500, withTiming(TRAVEL, { duration: 750, easing: Easing.inOut(Easing.cubic) })));

    // 2. It lands: the chip melts away, the destination bumps and shows what it gained.
    chipScale.set(
      withSequence(
        withDelay(300, withSpring(1, { damping: 12, stiffness: 220 })),
        withDelay(450, withTiming(0.3, { duration: 160 })),
      ),
    );
    destScale.set(
      withDelay(
        1250,
        withSequence(withSpring(1.08, { damping: 8, stiffness: 300 }), withSpring(1)),
      ),
    );
    plus.set(withDelay(1280, withTiming(1, { duration: 250 })));
    const t1 = setTimeout(() => {
      setPhase('delete');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1550);

    // 3. The finished jar shakes, shrinks and disappears.
    srcRot.set(
      withDelay(
        1550,
        withSequence(
          withTiming(-5, { duration: 70 }),
          withTiming(5, { duration: 110 }),
          withTiming(-5, { duration: 110 }),
          withTiming(0, { duration: 70 }),
        ),
      ),
    );
    trash.set(withDelay(1580, withTiming(1, { duration: 200 })));
    srcScale.set(withDelay(1900, withTiming(0.2, { duration: 350, easing: Easing.in(Easing.back(1.5)) })));
    srcOpacity.set(withDelay(1950, withTiming(0, { duration: 300 })));

    // 4. Hand control back once everything has settled.
    done.set(
      withDelay(
        2450,
        withTiming(1, { duration: 1 }, (finished) => {
          if (finished) scheduleOnRN(finish);
        }),
      ),
    );
    return () => clearTimeout(t1);
  }, [fade, chipY, chipScale, destScale, plus, srcScale, srcRot, srcOpacity, trash, done]);

  // Block the hardware back button until the transfer has been applied.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const overlay = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const chip = useAnimatedStyle(() => ({
    opacity: chipScale.get() > 0.35 ? 1 : chipScale.get() / 0.35,
    transform: [{ translateY: chipY.get() }, { scale: chipScale.get() }],
  }));
  const dest = useAnimatedStyle(() => ({ transform: [{ scale: destScale.get() }] }));
  const plusStyle = useAnimatedStyle(() => ({ opacity: plus.get() }));
  const src = useAnimatedStyle(() => ({
    opacity: srcOpacity.get(),
    transform: [{ rotate: `${srcRot.get()}deg` }, { scale: srcScale.get() }],
  }));
  const trashStyle = useAnimatedStyle(() => ({
    opacity: trash.get(),
    transform: [{ scale: 0.6 + trash.get() * 0.4 }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 200 }, overlay]}
      className="items-center justify-center bg-surface"
      accessibilityLiveRegion="polite"
      accessibilityLabel={phase === 'move' ? 'Moving surplus' : `Deleting ${from.name}`}
    >
      <Text className="mb-8 font-display-semibold text-xl text-ink">
        {phase === 'move' ? `Moving ${money(amount)}…` : `Deleting ${from.name}…`}
      </Text>

      <View style={{ width: '78%', height: TILE_H + GAP + TILE_H }}>
        <Animated.View style={[{ height: TILE_H }, src]}>
          <Tile jar={from} balance={money(from.saved)} />
          <Animated.View
            style={[StyleSheet.absoluteFill, trashStyle]}
            className="items-center justify-center rounded-jar bg-danger"
          >
            <Icon name="trash-can-outline" size={34} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', top: TILE_H + GAP }, { left: 0, right: 0, height: TILE_H }, dest]}>
          <Tile jar={to} balance={money(to.saved)} />
          <Animated.View
            style={plusStyle}
            className="absolute -top-3 right-3 rounded-full border-hair border-ink bg-success px-3 py-1"
          >
            <Text className="font-display-semibold text-sm text-white">+{money(amount)}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: TILE_H / 2 - 20, alignSelf: 'center' }, chip]}
          className="rounded-full border-hair border-ink bg-brand px-4 py-2"
        >
          <Text className="font-display-bold text-base text-white">{money(amount)}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function Tile({ jar, balance }: { jar: Jar; balance: string }) {
  return (
    <View style={{ boxShadow: CARD_SHADOW }} className="rounded-jar">
      <View
        style={{ backgroundColor: jarColors[jar.color], height: TILE_H }}
        className="justify-center rounded-jar border-hair border-ink px-4"
      >
        <Text numberOfLines={1} className="font-display-semibold text-lg text-ink">
          {jar.name}
        </Text>
        <Text className="font-display-bold text-2xl text-ink">{balance}</Text>
      </View>
    </View>
  );
}
