import { Pressable, Text, View } from 'react-native';

interface Props {
  children: string;
  /** Trailing text, e.g. a count. */
  meta?: string;
  /** Right-aligned text button, e.g. "Manage ›". */
  action?: { label: string; onPress: () => void };
  className?: string;
}

/** Section heading with the small orange tile used across the app. */
export function SectionLabel({ children, meta, action, className }: Props) {
  return (
    <View className={`mb-3 mt-7 flex-row items-center gap-2 ${className ?? ''}`}>
      <View className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
      <Text accessibilityRole="header" className="font-display-semibold text-lg text-ink">
        {children}
      </Text>
      {meta ? <Text className="font-sans text-sm text-ink-muted">{meta}</Text> : null}
      {action ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={action.onPress}
          className="ml-auto active:opacity-60"
        >
          <Text className="font-display-semibold text-sm text-ink">{action.label} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
