import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { IconButton } from './icon-button';

interface Props {
  title: string;
  /** Small muted line above the title. */
  eyebrow?: string;
  right?: React.ReactNode;
}

/** Back chip, centred title, optional trailing slot (kept balanced with a spacer). */
export function ScreenHeader({ title, eyebrow, right }: Props) {
  return (
    <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
      <IconButton variant="card" icon="arrow-left" label="Go back" onPress={() => router.back()} />
      <View className="flex-1 items-center">
        {eyebrow ? (
          <Text
            numberOfLines={1}
            className="font-sans text-xs uppercase tracking-widest text-ink-muted"
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="font-display-semibold text-2xl text-ink"
        >
          {title}
        </Text>
      </View>
      <View className="h-11 min-w-[44px] items-center justify-center">{right}</View>
    </View>
  );
}
