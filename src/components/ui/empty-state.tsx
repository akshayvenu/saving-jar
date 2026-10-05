import { Text, View } from 'react-native';

import { ink } from '@/theme/colors';

import { Hatch } from './hatch';
import { Icon } from './icon';

type IconName = React.ComponentProps<typeof Icon>['name'];

/** Hatched tile with an icon chip and a short hint. */
export function EmptyState({
  text,
  icon = 'wallet-plus-outline',
}: {
  text: string;
  icon?: IconName;
}) {
  return (
    <View className="mx-5 mt-6 items-center overflow-hidden rounded-jar border-hair border-ink bg-surface-card px-8 py-10">
      <Hatch color={ink.faint} gap={9} strokeWidth={1} style={{ opacity: 0.5 }} />
      <View className="h-16 w-16 items-center justify-center rounded-2xl border-hair border-ink bg-surface-card">
        <Icon name={icon} size={32} color={ink.DEFAULT} />
      </View>
      <View className="mt-4 rounded-xl bg-surface-card px-3 py-1.5">
        <Text className="text-center font-sans text-base text-ink">{text}</Text>
      </View>
    </View>
  );
}
