import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

type Variant = 'primary' | 'danger' | 'success' | 'outline' | 'ghost';

const container: Record<Variant, string> = {
  primary: 'bg-brand',
  danger: 'bg-danger border-2 border-ink',
  success: 'bg-success border-2 border-ink',
  outline: 'border-2 border-brand bg-transparent',
  ghost: 'bg-transparent',
};
const label: Record<Variant, string> = {
  primary: 'text-white',
  danger: 'text-ink',
  success: 'text-ink',
  outline: 'text-brand',
  ghost: 'text-ink dark:text-ink-dark',
};

interface Props extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  loading,
  compact,
  disabled,
  className,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      hitSlop={4}
      className={`overflow-hidden rounded-full ${container[variant]} ${className ?? ''}`}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.8 : 1 })}
      {...rest}
    >
      {/* Full-size hit target: on Android only child views were catching taps, not the Pressable's own padding. */}
      <View
        collapsable={false}
        className={`${compact ? 'min-h-[40px]' : 'min-h-[48px]'} items-center justify-center px-6`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className={`font-medium text-base ${label[variant]}`}>{title}</Text>
        )}
      </View>
    </Pressable>
  );
}
