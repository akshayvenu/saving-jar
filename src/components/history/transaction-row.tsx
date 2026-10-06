import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { formatMoney, formatShortDate } from '@/lib/format';
import { ink } from '@/theme/colors';
import type { CurrencyCode, Transaction } from '@/types';

export function TransactionRow({ tx, currency }: { tx: Transaction; currency: CurrencyCode }) {
  if (tx.type === 'edit') return <EditRow tx={tx} />;

  const isAdd = tx.type === 'add';
  return (
    <View className="flex-row items-center gap-3 border-b-hair border-surface-line px-4 py-3">
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl border-hair border-ink ${
          isAdd ? 'bg-ink' : 'bg-surface-card'
        }`}
      >
        <Icon
          name={isAdd ? 'arrow-bottom-left' : 'arrow-top-right'}
          size={20}
          color={isAdd ? '#FFFFFF' : ink.DEFAULT}
        />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-semibold text-[15px] text-ink">
          {isAdd ? 'Deposit' : 'Withdrawal'}
          {tx.note ? <Text className="font-sans text-ink-muted"> · {tx.note}</Text> : null}
        </Text>
        <Text className="font-sans text-[13px] text-ink-muted">
          {formatShortDate(tx.createdAt)}
          {tx.interest
            ? ` · ${formatMoney(tx.amount, currency)} principal · ${formatMoney(tx.interest, currency)} interest`
            : ''}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`font-display-semibold text-base ${isAdd ? 'text-success' : 'text-ink'}`}>
          {isAdd ? '+' : '−'}
          {formatMoney(tx.amount + (tx.interest ?? 0), currency)}
        </Text>
        <Text className="font-sans text-[12px] text-ink-muted">
          {formatMoney(tx.balanceAfter, currency)}
        </Text>
      </View>
    </View>
  );
}

function EditRow({ tx }: { tx: Transaction }) {
  return (
    <View className="flex-row items-start gap-3 border-b-hair border-surface-line px-4 py-3">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface">
        <Icon name="pencil-outline" size={20} color={ink.muted} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-[15px] text-ink">Edited</Text>
        {tx.changes?.map((c) => (
          <Text key={c.label} className="font-sans text-sm text-ink">
            <Text className="font-sans text-ink-muted">{c.label}: </Text>
            {c.from} → {c.to}
          </Text>
        ))}
        <Text className="font-sans text-[13px] text-ink-muted">
          {formatShortDate(tx.createdAt)}
        </Text>
      </View>
    </View>
  );
}
