import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared look for modal bottom sheets: canvas colour, ink top edge, grabber
 * and display-font title. Swallows taps so the backdrop doesn't close it.
 */
export function SheetFrame({ title, subtitle, className, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => {}}
      accessible={false}
      style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      className={`rounded-t-[32px] border-x-hair border-t-hair border-ink bg-surface px-5 ${className ?? ''}`}
    >
      <SheetHandle />
      <Text accessibilityRole="header" className="font-display-semibold text-2xl text-ink">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-0.5 font-sans text-sm text-ink-muted">{subtitle}</Text>
      ) : null}
      <View className="mt-4 shrink">{children}</View>
    </Pressable>
  );
}

export function SheetHandle() {
  return (
    <View className="items-center pb-4 pt-3">
      <View className="h-1.5 w-11 rounded-full bg-ink/25" />
    </View>
  );
}
