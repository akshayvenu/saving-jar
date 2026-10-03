import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { ink } from '@/theme/colors';

interface Props {
  /** Line colour. */
  color?: string;
  /** Distance between lines in px. */
  gap?: number;
  strokeWidth?: number;
  /** Solid colour painted under the lines. */
  background?: string;
  style?: ViewStyle;
}

/** SVG-safe id from React's useId (which may contain colons). */
export function useSvgId(prefix: string) {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

/** Diagonal hatch texture that fills its parent — the app's "filled" look. */
export function Hatch({
  color = ink.DEFAULT,
  gap = 6,
  strokeWidth = 1.2,
  background,
  style,
}: Props) {
  const id = useSvgId('hatch');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={id}
            patternUnits="userSpaceOnUse"
            width={gap}
            height={gap}
            patternTransform="rotate(45)"
          >
            <Line x1="0" y1="0" x2="0" y2={gap} stroke={color} strokeWidth={strokeWidth} />
          </Pattern>
        </Defs>
        {background ? <Rect width="100%" height="100%" fill={background} /> : null}
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
