import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Line, Path, Pattern } from 'react-native-svg';

import { useSvgId } from '@/components/ui/hatch';

interface Props {
  progress: number; // 0..1
  /** Solid tint under the liquid's hatching. */
  color: string;
  /** Hatch line colour. */
  lineColor?: string;
}

const AMP = 6;

/** Path spanning two wavelengths (2w) so it can scroll left by w and loop seamlessly. */
function wavePath(w: number, h: number) {
  const p = w;
  return `M0 ${AMP} Q ${p / 4} 0 ${p / 2} ${AMP} T ${p} ${AMP} T ${p * 1.5} ${AMP} T ${p * 2} ${AMP} V ${h + AMP * 2} H 0 Z`;
}

function WaveLayer({
  w,
  h,
  level,
  color,
  lineColor,
  opacity,
  duration,
  reverse,
}: {
  w: number;
  h: number;
  level: SharedValue<number>;
  color: string;
  lineColor?: string;
  opacity: number;
  duration: number;
  reverse?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const hatchId = useSvgId('liquid');
  const shift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || w === 0) return;
    shift.value = 0;
    shift.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(shift);
  }, [w, duration, reduceMotion, shift]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (reverse ? shift.value - 1 : -shift.value) * w },
      { translateY: level.value - AMP },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: 0, opacity, pointerEvents: 'none' }, style]}
    >
      <Svg width={w * 2} height={h + AMP * 2} pointerEvents="none">
        {lineColor ? (
          <Defs>
            <Pattern
              id={hatchId}
              patternUnits="userSpaceOnUse"
              width={7}
              height={7}
              patternTransform="rotate(45)"
            >
              <Line x1="0" y1="0" x2="0" y2="7" stroke={lineColor} strokeWidth={1.3} />
            </Pattern>
          </Defs>
        ) : null}
        <Path d={wavePath(w, h)} fill={color} />
        {lineColor ? <Path d={wavePath(w, h)} fill={`url(#${hatchId})`} /> : null}
      </Svg>
    </Animated.View>
  );
}

/** Hatched liquid level with a gently moving wave crest, rendered behind the card content. */
export function JarFill({ progress, color, lineColor }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const { w, h } = size;
  const level = useSharedValue(h);

  useEffect(() => {
    level.value = withTiming(h * (1 - progress), {
      duration: 600,
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
          <WaveLayer
            w={w}
            h={h}
            level={level}
            color={color}
            opacity={0.45}
            duration={5200}
            reverse
          />
          <WaveLayer
            w={w}
            h={h}
            level={level}
            color={color}
            lineColor={lineColor}
            opacity={1}
            duration={3600}
          />
        </>
      )}
    </View>
  );
}
