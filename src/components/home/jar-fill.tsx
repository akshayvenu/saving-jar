import { useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useSvgId } from '@/components/ui/hatch';
import { ink } from '@/theme/colors';

interface Props {
  progress: number; // 0..1
  /** The card's background colour; the liquid is a deeper shade of it. */
  color: string;
}

/** Room above the crest so the waterline stroke isn't clipped by the SVG edge. */
const PAD = 3;
/** Smallest visible fill so a tiny balance still shows a waterline. */
const MIN_FILL = 12;

function hexToHsl(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h / 6, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    const v =
      t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(h + 1 / 3)}${channel(h)}${channel(h - 1 / 3)}`;
}

/** Same hue as the card, darker and a touch more saturated. */
function shade(hex: string, darken: number, saturate: number) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s === 0 ? 0 : Math.min(1, s + saturate), Math.max(0, l - darken));
}

/**
 * Sine-like crest spanning 2w (so it can scroll left by w and loop seamlessly).
 * `wavelength` must divide w evenly. Baseline sits at y = amp + PAD.
 */
function crestPath(w: number, wavelength: number, amp: number) {
  const base = amp + PAD;
  let d = `M0 ${base} Q ${wavelength / 4} ${base - 2 * amp} ${wavelength / 2} ${base}`;
  for (let x = wavelength; x <= w * 2 + 0.5; x += wavelength / 2) d += ` T ${x} ${base}`;
  return d;
}

function WaveLayer({
  w,
  h,
  level,
  waves,
  amp,
  duration,
  reverse,
  children,
}: {
  w: number;
  h: number;
  level: SharedValue<number>;
  /** Number of crests across the card width. */
  waves: number;
  amp: number;
  duration: number;
  reverse?: boolean;
  children: (crest: string, body: string, height: number) => React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const shift = useSharedValue(0);
  const height = h + (amp + PAD) * 2;
  const crest = useMemo(() => crestPath(w, w / waves, amp), [w, waves, amp]);
  const body = `${crest} V ${height} H 0 Z`;

  useEffect(() => {
    if (reduceMotion || w === 0) return;
    shift.value = 0;
    shift.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(shift);
  }, [w, duration, reduceMotion, shift]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (reverse ? shift.value - 1 : -shift.value) * w },
      { translateY: level.value - amp - PAD },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }, style]}
    >
      <Svg width={w * 2} height={height} pointerEvents="none">
        {children(crest, body, height)}
      </Svg>
    </Animated.View>
  );
}

const BUBBLES = [
  { x: 0.14, size: 6, duration: 4200, delay: 0 },
  { x: 0.38, size: 4, duration: 3400, delay: 1400 },
  { x: 0.61, size: 7, duration: 5000, delay: 600 },
  { x: 0.83, size: 5, duration: 3800, delay: 2200 },
];

function Bubble({
  w,
  h,
  level,
  x,
  size,
  duration,
  delay,
}: {
  w: number;
  h: number;
  level: SharedValue<number>;
  x: number;
  size: number;
  duration: number;
  delay: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.quad) }), -1, false),
    );
    return () => cancelAnimation(t);
  }, [t, duration, delay]);

  const style = useAnimatedStyle(() => {
    // Rise from the bottom to just under the waterline, wobbling side to side.
    const top = level.value + 10;
    const y = interpolate(t.value, [0, 1], [h, top]);
    return {
      opacity: h - top < 30 ? 0 : interpolate(t.value, [0, 0.1, 0.8, 1], [0, 0.9, 0.9, 0]),
      transform: [
        { translateX: x * w + Math.sin(t.value * Math.PI * 4) * 3 },
        { translateY: y },
        { scale: interpolate(t.value, [0, 1], [0.6, 1.1]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size,
          borderWidth: 1.2,
          borderColor: 'rgba(255,255,255,0.85)',
          backgroundColor: 'rgba(255,255,255,0.25)',
          pointerEvents: 'none',
        },
        style,
      ]}
    />
  );
}

/** Liquid level with moving waves, a glossy waterline and rising bubbles, behind the card content. */
export function JarFill({ progress, color }: Props) {
  const reduceMotion = useReducedMotion();
  const gradientId = useSvgId('liquid');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const { w, h } = size;
  const level = useSharedValue(h);

  const palette = useMemo(
    () => ({
      surface: shade(color, 0.1, 0.12),
      deep: shade(color, 0.2, 0.18),
      back: shade(color, 0.06, 0.1),
    }),
    [color],
  );

  useEffect(() => {
    const fill = progress > 0 ? Math.max(MIN_FILL, h * Math.min(progress, 1)) : 0;
    level.value = withTiming(h - fill, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [h, progress, level]);

  return (
    <View
      style={{ pointerEvents: 'none' }}
      className="absolute inset-0 overflow-hidden"
      onLayout={onLayout}
    >
      {w > 0 && progress > 0 && (
        <>
          {/* Back wave: lighter, slower, drifting the other way for depth. */}
          <WaveLayer w={w} h={h} level={level} waves={1} amp={7} duration={6400} reverse>
            {(_, body) => <Path d={body} fill={palette.back} opacity={0.7} />}
          </WaveLayer>

          {/* Front wave: deepens toward the bottom, crisp ink waterline plus a light sheen. */}
          <WaveLayer w={w} h={h} level={level} waves={2} amp={4} duration={4200}>
            {(crest, body, height) => (
              <>
                <Defs>
                  <LinearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={height}
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0" stopColor={palette.surface} />
                    <Stop offset="1" stopColor={palette.deep} />
                  </LinearGradient>
                </Defs>
                <Path d={body} fill={`url(#${gradientId})`} />
                <Path
                  d={crest}
                  transform="translate(0 4)"
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <Path d={crest} fill="none" stroke={ink.DEFAULT} strokeWidth={1.5} />
              </>
            )}
          </WaveLayer>

          {!reduceMotion &&
            BUBBLES.map((b) => <Bubble key={b.x} w={w} h={h} level={level} {...b} />)}
        </>
      )}
    </View>
  );
}
