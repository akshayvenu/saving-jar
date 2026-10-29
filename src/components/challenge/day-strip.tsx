import { Pressable, Text, View } from 'react-native';

import { dailyLimit, dateOfDay, spentOnDay } from '@/lib/challenge';
import type { Challenge } from '@/types';

interface Props {
  challenge: Challenge;
  /** The challenge's current day; later days can't be picked. */
  today: number;
  selected: number;
  onSelect: (day: number) => void;
}

/** One chip per day with a mini meter of how much of that day's limit went. */
export function DayStrip({ challenge, today, selected, onSelect }: Props) {
  const limit = dailyLimit(challenge);

  return (
    <View className="mx-5 flex-row gap-2">
      {Array.from({ length: challenge.days }, (_, i) => i + 1).map((day) => {
        const spent = spentOnDay(challenge, day);
        const over = spent > limit;
        const future = day > today;
        const active = day === selected;
        const pct = Math.min(spent / limit, 1) * 100;
        const weekday = dateOfDay(challenge, day).toLocaleDateString(undefined, {
          weekday: 'short',
        });

        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: future }}
            accessibilityLabel={`Day ${day}${day === today ? ', today' : ''}${over ? ', over limit' : ''}`}
            disabled={future}
            onPress={() => onSelect(day)}
            className={`flex-1 items-center rounded-2xl border-hair px-1 pb-2 pt-1.5 ${
              active
                ? 'border-ink bg-ink'
                : future
                  ? 'border-surface-line bg-surface-card/60'
                  : 'border-ink bg-surface-card active:bg-surface-sunken'
            }`}
          >
            <Text
              numberOfLines={1}
              className={`font-sans text-[11px] ${active ? 'text-white/70' : 'text-ink-muted'}`}
            >
              {weekday}
            </Text>
            <Text
              className={`font-display-bold text-lg leading-6 ${
                active ? 'text-white' : future ? 'text-ink-faint' : 'text-ink'
              }`}
            >
              {day}
            </Text>
            <View
              className={`mt-1 h-1.5 w-8 overflow-hidden rounded-full ${
                active ? 'bg-white/25' : 'bg-surface-sunken'
              }`}
            >
              {pct > 0 && (
                <View
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${over ? 'bg-danger' : active ? 'bg-white' : 'bg-ink'}`}
                />
              )}
            </View>
            {day === today && (
              <View className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
