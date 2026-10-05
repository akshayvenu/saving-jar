import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import type { BalancePoint } from '@/lib/jar-stats';
import { toMajor } from '@/lib/format';
import { ink, surface } from '@/theme/colors';

interface Props {
  points: BalancePoint[];
  width: number;
  height: number;
  /** Area fill, usually the jar's colour. */
  color: string;
}

const AXIS_W = 44;
const PAD_TOP = 10;
const PAD_BOTTOM = 8;
const TICKS = 4;
const PAD_RIGHT = 6;

/** Rounds up to 1, 2, 2.5 or 5 × 10ⁿ so gridlines land on tidy values. */
function niceCeil(n: number) {
  if (n <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= n) ?? 10;
  return step * mag;
}

/** Short axis label in major units, e.g. 1500000 → "15k". */
function compact(minor: number) {
  const v = toMajor(minor);
  const trim = (x: number) => x.toFixed(1).replace(/\.0$/, '');
  if (v >= 1e6) return `${trim(v / 1e6)}M`;
  if (v >= 1e3) return `${trim(v / 1e3)}k`;
  return trim(v);
}

const shortDate = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Balance-over-time area chart with dashed gridlines. */
export function BalanceChart({ points, width, height, color }: Props) {
  const plotW = width - AXIS_W - PAD_RIGHT;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const yMax = niceCeil(Math.max(...points.map((p) => p.v)));

  const x = (t: number) => AXIS_W + (t1 > t0 ? ((t - t0) / (t1 - t0)) * plotW : plotW);
  const y = (v: number) => PAD_TOP + plotH - (v / yMax) * plotH;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t)},${y(p.v)}`).join(' ');
  const base = y(0);
  const area = `${line} L${x(t1)},${base} L${x(t0)},${base} Z`;
  const last = points[points.length - 1];

  return (
    <View>
      <Svg width={width} height={height}>
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const v = (yMax / TICKS) * i;
          return (
            <Line
              key={i}
              x1={AXIS_W}
              x2={width}
              y1={y(v)}
              y2={y(v)}
              stroke={i === 0 ? ink.DEFAULT : surface.line}
              strokeWidth={i === 0 ? 1.5 : 1}
              strokeDasharray={i === 0 ? undefined : '4 4'}
            />
          );
        })}
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const v = (yMax / TICKS) * i;
          return (
            <SvgText
              key={i}
              x={AXIS_W - 8}
              y={y(v) + 4}
              fontSize={11}
              fill={ink.muted}
              textAnchor="end"
            >
              {compact(v)}
            </SvgText>
          );
        })}
        <Path d={area} fill={color} fillOpacity={0.55} />
        <Path d={line} fill="none" stroke={ink.DEFAULT} strokeWidth={2} strokeLinejoin="round" />
        <Circle
          cx={x(last.t)}
          cy={y(last.v)}
          r={4}
          fill={color}
          stroke={ink.DEFAULT}
          strokeWidth={1.5}
        />
      </Svg>
      <View className="flex-row justify-between" style={{ paddingLeft: AXIS_W }}>
        <Text className="font-sans text-xs text-ink-muted">{shortDate(t0)}</Text>
        <Text className="font-sans text-xs text-ink-muted" style={{ paddingRight: PAD_RIGHT }}>
          Today
        </Text>
      </View>
    </View>
  );
}
