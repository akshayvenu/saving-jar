import { Text, View } from 'react-native';

import { formatDate, formatMoney } from '@/lib/format';
import type { CurrencyCode, Transaction } from '@/types';

export function TransactionRow({ tx, currency }: { tx: Transaction; currency: CurrencyCode }) {
  const isAdd = tx.type === 'add';
  return (
    <View className="mx-4 mb-3 flex-row items-center justify-between rounded-2xl bg-surface-card p-4 dark:bg-surface-cardDark">
      <View className="flex-1 pr-3">
        <Text className="text-base text-ink dark:text-ink-dark">
          {tx.note ?? (isAdd ? 'Added' : 'Withdrawn')}
        </Text>
        <Text className="mt-0.5 text-sm text-ink-muted dark:text-ink-mutedDark">
          {formatDate(tx.createdAt)}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`font-semibold text-lg ${isAdd ? 'text-brand' : 'text-danger'}`}>
          {isAdd ? '+' : '−'}
          {formatMoney(tx.amount, currency)}
        </Text>
        <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">
          Balance {formatMoney(tx.balanceAfter, currency)}
        </Text>
      </View>
    </View>
  );
}
