import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

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
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      className={`min-h-[48px] items-center justify-center rounded-full px-6 active:opacity-80 ${container[variant]} ${disabled ? 'opacity-40' : ''} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`font-medium text-base ${label[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
