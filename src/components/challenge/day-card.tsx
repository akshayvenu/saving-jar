import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { dailyLimit, dateOfDay, spentOnDay } from '@/lib/challenge';
import { formatMoney } from '@/lib/format';
import { danger, ink } from '@/theme/colors';
import type { Challenge, CurrencyCode } from '@/types';

interface Props {
  challenge: Challenge;
  day: number;
  /** The challenge's current day. */
  today: number;
  currency: CurrencyCode;
  /** False once the challenge has ended, so nothing more can be logged. */
  canLog: boolean;
  onLog: (day: number) => void;
  onRemove: (expenseId: string) => void;
}

/** One day: what was spent against its limit, the expense list and a log button. */
export function DayCard({ challenge, day, today, currency, canLog, onLog, onRemove }: Props) {
  const limit = dailyLimit(challenge);
  const spent = spentOnDay(challenge, day);
  const over = spent > limit;
  const isToday = day === today && canLog;
  const expenses = challenge.expenses.filter((e) => e.day === day).reverse();
  const money = (v: number) => formatMoney(v, currency);
  const date = dateOfDay(challenge, day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <View className="mx-5 rounded-jar border-hair border-ink bg-surface-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="shrink">
          <Text className="font-display-semibold text-base text-ink">
            {isToday ? 'Today' : `Day ${day}`}
          </Text>
          <Text className="font-sans text-xs text-ink-muted">
            {isToday ? `Day ${day} · ${date}` : date}
          </Text>
        </View>
        <View
          className={`rounded-full border-hair border-ink px-2.5 py-1 ${
            over ? 'bg-danger' : 'bg-surface'
          }`}
        >
          <Text className={`font-display-semibold text-xs ${over ? 'text-white' : 'text-ink'}`}>
            {over ? `${money(spent - limit)} over` : `${money(limit - spent)} left`}
          </Text>
        </View>
      </View>

      <View className="mb-2 mt-3 flex-row items-baseline gap-1.5">
        <Text className="font-display-bold text-2xl tracking-tight text-ink">{money(spent)}</Text>
        <Text className="font-sans text-sm text-ink-muted">of {money(limit)}</Text>
      </View>
      <ProgressBar progress={spent / limit} color={over ? danger : undefined} height={10} />

      <View className="mt-4 gap-2">
        {expenses.length === 0 ? (
          <View className="flex-row items-center justify-center gap-2 rounded-2xl border-hair border-dashed border-surface-line py-4">
            <Icon name="check" size={16} color={ink.muted} />
            <Text className="font-sans text-sm text-ink-muted">Nothing spent yet</Text>
          </View>
        ) : (
          expenses.map((e) => (
            <View
              key={e.id}
              className="flex-row items-center gap-3 rounded-2xl bg-surface py-1 pl-3 pr-1"
            >
              <View className="h-8 w-8 items-center justify-center rounded-xl border-hair border-ink bg-surface-card">
                <Icon name="arrow-top-right" size={16} color={ink.DEFAULT} />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-sans text-sm text-ink">
                  {e.note ?? 'Expense'}
                </Text>
                <Text className="font-sans text-xs text-ink-muted">
                  {new Date(e.createdAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text className="font-display-semibold text-sm text-ink">−{money(e.amount)}</Text>
              {canLog ? (
                <IconButton
                  icon="close"
                  size={16}
                  color={ink.muted}
                  label={`Remove expense ${money(e.amount)}`}
                  onPress={() => onRemove(e.id)}
                />
              ) : (
                <View className="w-2" />
              )}
            </View>
          ))
        )}
      </View>

      {canLog && (
        <Button
          title={isToday ? 'Log expense' : `Log for Day ${day}`}
          icon="plus"
          variant={isToday ? 'primary' : 'secondary'}
          compact
          className="mt-4"
          onPress={() => onLog(day)}
        />
      )}
    </View>
  );
}
