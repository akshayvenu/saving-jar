import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { isFinished } from '@/lib/challenge';
import { formatMoney } from '@/lib/format';
import { success } from '@/theme/colors';
import type { Challenge, CurrencyCode } from '@/types';

interface Props {
  challenge: Challenge;
  /** What the jar still holds; expenses have already come out of it. */
  amount: number;
  currency: CurrencyCode;
  /** Name of the jar the surplus went to, once moved. */
  movedTo?: string;
  onEnd: () => void;
  onMove: () => void;
}

/** The real, unspent money: end early while running, then move it into a jar once it's over. */
export function SurplusCard({ challenge, amount, currency, movedTo, onEnd, onMove }: Props) {
  const finished = isFinished(challenge);
  const money = (v: number) => formatMoney(v, currency);

  return (
    <View className="mx-5 rounded-jar border-hair border-ink bg-surface-card p-4">
      <Text className="font-sans text-sm text-ink-muted">Actual surplus</Text>
      <Text className="font-display-bold text-[28px] leading-[34px] tracking-tight text-ink">
        {money(amount)}
      </Text>

      {challenge.transfer ? (
        <View className="mt-3 flex-row items-center gap-2">
          <Icon name="check-bold" size={16} color={success} />
          <Text className="flex-1 font-sans text-sm text-ink">
            Moved {money(challenge.transfer.amount)} to {movedTo ?? 'your jar'}
          </Text>
        </View>
      ) : !finished ? (
        <>
          <Text className="mb-3 mt-1 font-sans text-sm text-ink-muted">
            Still unspent. End the challenge to move it into a jar.
          </Text>
          <Button title="End challenge early" variant="secondary" compact onPress={onEnd} />
        </>
      ) : amount > 0 ? (
        <>
          <Text className="mb-3 mt-1 font-sans text-sm text-ink-muted">
            Nice work. Move it to another jar. This jar is deleted afterwards.
          </Text>
          <Button title={`Move ${money(amount)} to a jar`} icon="swap-horizontal" onPress={onMove} />
        </>
      ) : (
        <Text className="mt-1 font-sans text-sm text-ink-muted">
          Nothing left over this time. Try again with a tighter budget.
        </Text>
      )}
    </View>
  );
}
