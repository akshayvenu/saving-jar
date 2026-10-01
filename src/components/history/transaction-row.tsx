import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { formatMoney, formatShortDate } from '@/lib/format';
import type { CurrencyCode, Transaction } from '@/types';

export function TransactionRow({ tx, currency }: { tx: Transaction; currency: CurrencyCode }) {
  if (tx.type === 'edit') return <EditRow tx={tx} />;

  const isAdd = tx.type === 'add';
  return (
    <View className="mx-6 flex-row items-center justify-between border-b border-ink-muted/30 py-3">
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-[15px] text-ink dark:text-ink-dark">
          <Text className="uppercase">{isAdd ? 'Deposit' : 'Withdrawal'}</Text>
          {tx.note ? ` · ${tx.note}` : ''}
        </Text>
        <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">
          {formatShortDate(tx.createdAt)}
        </Text>
      </View>
      <Text className={`font-semibold text-base ${isAdd ? 'text-brand' : 'text-danger'}`}>
        {isAdd ? '+' : '−'}
        {formatMoney(tx.amount, currency)}
      </Text>
    </View>
  );
}

function EditRow({ tx }: { tx: Transaction }) {
  return (
    <View className="mx-6 flex-row items-start justify-between border-b border-ink-muted/30 py-3">
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-[15px] uppercase text-ink dark:text-ink-dark">
          Edited
        </Text>
        {tx.changes?.map((c) => (
          <Text key={c.label} className="text-sm text-ink dark:text-ink-dark">
            {c.label}: {c.from} → {c.to}
          </Text>
        ))}
        <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">
          {formatShortDate(tx.createdAt)}
        </Text>
      </View>
      <MaterialCommunityIcons name="pencil-outline" size={20} color="#9AA0A6" />
    </View>
  );
}
