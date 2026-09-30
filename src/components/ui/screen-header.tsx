import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { IconButton } from './icon-button';

export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-1 px-3 pb-2 pt-2">
      <IconButton icon="arrow-left" label="Go back" onPress={() => router.back()} />
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 font-semibold text-2xl text-ink dark:text-ink-dark"
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
