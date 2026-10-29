import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { currentDay, dailyLimit, isFinished, remaining, spentOnDay, totalSpent } from '@/lib/challenge';
import { formatMoney } from '@/lib/format';
import { danger, ink, jar as jarColors } from '@/theme/colors';
import type { Challenge, Jar } from '@/types';

const CARD_SHADOW = `4px 4px 0px ${ink.DEFAULT}`;

/** Summary card in the jar's colour: what's left of the budget, today's allowance and the jar balance. */
export function ChallengeHero({ challenge, jar }: { challenge: Challenge; jar: Jar }) {
  const spent = totalSpent(challenge);
  const left = remaining(challenge);
  const over = left < 0;
  const finished = isFinished(challenge);
  const today = currentDay(challenge);
  const daysToGo = challenge.days - today;
  const todayLeft = dailyLimit(challenge) - spentOnDay(challenge, today);
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
          <View className="flex-1">
            <Text className="font-display-semibold text-lg leading-6 text-ink">
              {finished ? 'Challenge over' : `Day ${today} of ${challenge.days}`}
            </Text>
            {!finished && (
              <Text className="font-sans text-xs text-ink/70">
                {daysToGo === 0
                  ? 'Last day'
                  : `${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} to go`}
              </Text>
            )}
          </View>
          <View className="rounded-full bg-ink px-2.5 py-1">
            <Text className="font-display-semibold text-xs text-white">
              {money(dailyLimit(challenge))} / day
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className={`mt-4 font-display-bold text-[34px] leading-[40px] tracking-tight ${
            over ? 'text-danger' : 'text-ink'
          }`}
        >
          {money(Math.abs(left))}
        </Text>
        <Text className="mb-3 font-sans text-sm text-ink/70">
          {over ? 'over budget' : 'left'} of {money(challenge.budget)}
        </Text>

        <ProgressBar progress={spent / challenge.budget} color={over ? danger : '#FFFFFF'} />

        <View className="mt-3 flex-row gap-2">
          <Stat label="Spent" value={money(spent)} />
          {finished ? (
            <Stat label="Days" value={`${challenge.days}`} />
          ) : (
            <Stat
              label={todayLeft < 0 ? 'Over today' : 'Left today'}
              value={money(Math.abs(todayLeft))}
              danger={todayLeft < 0}
            />
          )}
          <Stat label={`In ${jar.name}`} value={money(jar.saved)} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, danger: isDanger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View className="flex-1 rounded-2xl border-hair border-ink bg-surface-card px-2.5 py-2">
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`font-display-semibold text-base ${isDanger ? 'text-danger' : 'text-ink'}`}
      >
        {value}
      </Text>
      <Text numberOfLines={1} className="font-sans text-xs text-ink-muted">
        {label}
      </Text>
    </View>
  );
}
