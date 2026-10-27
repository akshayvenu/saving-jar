import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { currentDay, isFinished, remaining, totalSpent } from '@/lib/challenge';
import { formatMoney } from '@/lib/format';
import { ink, jar as jarColors } from '@/theme/colors';
import type { Challenge, Jar } from '@/types';

const CARD_SHADOW = `4px 4px 0px ${ink.DEFAULT}`;

/** Summary card in the jar's colour: day counter, total spent against the budget, what's left. */
export function ChallengeHero({ challenge, jar }: { challenge: Challenge; jar: Jar }) {
  const spent = totalSpent(challenge);
  const left = remaining(challenge);
  const over = left < 0;
  const finished = isFinished(challenge);
  const money = (v: number) => formatMoney(v, jar.currency);

  return (
    <View style={{ boxShadow: CARD_SHADOW }} className="mx-5 rounded-jar">
      <View
        style={{ backgroundColor: jarColors[jar.color] }}
        className="rounded-jar border-hair border-ink p-3.5"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl border-hair border-ink bg-surface-card">
            <Icon name="timer-sand" size={18} color={ink.DEFAULT} />
          </View>
          <Text className="flex-1 font-display-semibold text-lg text-ink">
            {finished ? 'Challenge over' : `Day ${currentDay(challenge)} of ${challenge.days}`}
          </Text>
          <View className="rounded-full bg-ink px-2.5 py-1">
            <Text className="font-display-semibold text-xs text-white">
              {money(Math.round(challenge.budget / challenge.days))} / day
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="mt-3 font-display-bold text-[28px] leading-[34px] tracking-tight text-ink"
        >
          {money(spent)}
        </Text>
        <Text className="mb-3 font-sans text-sm text-ink/70">
          spent of {money(challenge.budget)}
        </Text>

        <ProgressBar progress={spent / challenge.budget} color={over ? '#D63A2F' : '#FFFFFF'} />

        <View
          className={`mt-3 self-start rounded-full border-hair border-ink px-3 py-1 ${
            over ? 'bg-danger' : 'bg-surface-card'
          }`}
        >
          <Text className={`font-display-semibold text-sm ${over ? 'text-white' : 'text-ink'}`}>
            {over ? `${money(-left)} over budget` : `${money(left)} left`}
          </Text>
        </View>
      </View>
    </View>
  );
}
