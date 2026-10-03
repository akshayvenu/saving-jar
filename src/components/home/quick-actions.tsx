import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { accent, ink } from '@/theme/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface QuickAction {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
  /** Highlight tile (sky blue), e.g. the primary action. */
  highlight?: boolean;
}

/** 2-column grid of big outlined action tiles. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-3 px-5">
      {actions.map((a) => (
        <Pressable
          key={a.key}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          onPress={a.onPress}
          style={a.highlight ? { backgroundColor: accent.blue } : undefined}
          className={`min-h-[64px] w-[48.5%] flex-row items-center gap-3 rounded-block border-hair border-ink px-4 ${
            a.highlight ? 'active:opacity-80' : 'bg-surface-card active:bg-surface-sunken'
          }`}
        >
          <MaterialCommunityIcons name={a.icon} size={26} color={ink.DEFAULT} />
          <Text numberOfLines={1} className="flex-1 font-display-semibold text-base text-ink">
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
