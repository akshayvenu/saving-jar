import { useState } from 'react';
import { View } from 'react-native';

import { ink } from '@/theme/colors';

import { Hatch } from './hatch';

interface Props {
  /** 0..1 */
  progress: number;
  /** Solid fill under the hatching. */
  color?: string;
  height?: number;
  className?: string;
}

/** Outlined track with a hatched fill — reads as "how full is the jar". */
export function ProgressBar({ progress, color, height = 14, className }: Props) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;
  const [trackWidth, setTrackWidth] = useState(0);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={{ height }}
      className={`overflow-hidden rounded-full border-hair border-ink bg-surface-card ${className ?? ''}`}
    >
      {pct > 0 && (
        <View
          style={{ width: `${pct}%`, backgroundColor: color }}
          className="h-full overflow-hidden rounded-full border-r-hair border-ink"
        >
          {/* Hatch spans the whole track at a fixed pixel width and the fill clips it,
              so the texture always covers the fill and doesn't shift as progress changes
              (a percentage-sized SVG doesn't reliably redraw on Android when its parent resizes). */}
          {trackWidth > 0 && (
            <Hatch
              key={trackWidth}
              color={ink.DEFAULT}
              gap={5}
              strokeWidth={1}
              style={{ right: undefined, width: trackWidth }}
            />
          )}
        </View>
      )}
    </View>
  );
}
