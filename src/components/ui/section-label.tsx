import { Text, View } from 'react-native';

interface Props {
  children: string;
  /** Trailing text, e.g. a count. */
  meta?: string;
  className?: string;
}

/** Section heading with the small orange tile used across the app. */
export function SectionLabel({ children, meta, className }: Props) {
  return (
    <View className={`mb-3 mt-7 flex-row items-center gap-2 ${className ?? ''}`}>
      <View className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
      <Text accessibilityRole="header" className="font-display-semibold text-lg text-ink">
        {children}
      </Text>
      {meta ? <Text className="font-sans text-sm text-ink-muted">{meta}</Text> : null}
    </View>
  );
}
