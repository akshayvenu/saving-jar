import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { dailyLimit, spentOnDay } from '@/lib/challenge';
import { formatMoney } from '@/lib/format';
import type { Challenge, CurrencyCode } from '@/types';

interface Props {
  challenge: Challenge;
  day: number;
  /** The challenge's current day; later days are locked. */
  today: number;
  currency: CurrencyCode;
  /** False once the challenge has ended, so nothing more can be logged. */
  canLog: boolean;
  onLog: (day: number) => void;
  onRemove: (expenseId: string) => void;
}

/** One day: its limit, what was spent, the expense list and a log button. */
export function DayCard({ challenge, day, today, currency, canLog, onLog, onRemove }: Props) {
  const limit = dailyLimit(challenge);
  const spent = spentOnDay(challenge, day);
  const over = spent > limit;
  const future = day > today;
  const isToday = day === today && canLog;
  const expenses = challenge.expenses.filter((e) => e.day === day);
  const money = (v: number) => formatMoney(v, currency);

  return (
    <View
      className={`mx-5 mb-3 rounded-block bg-surface-card p-3.5 ${
        isToday ? 'border-hair border-ink' : 'border-hair border-surface-line'
      } ${future ? 'opacity-50' : ''}`}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-display-semibold text-base text-ink">
          Day {day}
          {isToday ? ' · Today' : ''}
        </Text>
        {over ? (
          <View className="rounded-full bg-danger px-2.5 py-0.5">
            <Text className="font-display-semibold text-xs text-white">
              {money(spent - limit)} over
            </Text>
          </View>
        ) : (
          <Text className="font-sans text-sm text-ink-muted">
            {money(Math.max(limit - spent, 0))} left
          </Text>
        )}
      </View>

      <Text className="mb-2 mt-0.5 font-sans text-sm text-ink-muted">
        {money(spent)} of {money(limit)}
      </Text>
      <ProgressBar progress={spent / limit} color={over ? '#D63A2F' : undefined} height={10} />

      {expenses.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`Remove expense ${money(e.amount)}`}
          accessibilityHint="Long press to remove"
          onLongPress={() => onRemove(e.id)}
          className="mt-2 flex-row items-center justify-between rounded-xl bg-surface px-3 py-2 active:bg-surface-sunken"
        >
          <Text numberOfLines={1} className="mr-3 shrink font-sans text-sm text-ink">
            {e.note ?? 'Expense'}
          </Text>
          <Text className="font-display-semibold text-sm text-ink">{money(e.amount)}</Text>
        </Pressable>
      ))}
      {expenses.length > 0 && canLog && (
        <Text className="mt-1.5 text-center font-sans text-xs text-ink-muted">
          Long press an expense to remove it
        </Text>
      )}

      {!future && canLog && (
        <Button
          title="Log expense"
          icon="plus"
          variant={isToday ? 'primary' : 'secondary'}
          compact
          className="mt-3"
          onPress={() => onLog(day)}
        />
      )}
    </View>
  );
}
