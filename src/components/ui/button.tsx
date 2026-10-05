import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

import { ink } from '@/theme/colors';

import { Icon } from './icon';

type Variant = 'primary' | 'accent' | 'secondary' | 'danger' | 'outline' | 'ghost';
type IconName = React.ComponentProps<typeof Icon>['name'];

const container: Record<Variant, string> = {
  primary: 'bg-ink border-hair border-ink',
  accent: 'bg-brand border-hair border-ink',
  secondary: 'bg-surface-card border-hair border-ink',
  danger: 'bg-danger border-hair border-ink',
  outline: 'border-hair border-ink bg-transparent',
  ghost: 'bg-transparent',
};
const label: Record<Variant, string> = {
  primary: 'text-white',
  accent: 'text-white',
  secondary: 'text-ink',
  danger: 'text-white',
  outline: 'text-ink',
  ghost: 'text-ink',
};
const iconColor: Record<Variant, string> = {
  primary: '#FFFFFF',
  accent: '#FFFFFF',
  secondary: ink.DEFAULT,
  danger: '#FFFFFF',
  outline: ink.DEFAULT,
  ghost: ink.DEFAULT,
};

/** Variants that sit on a hard offset shadow and "press in" when tapped. */
const RAISED: Variant[] = ['primary', 'accent', 'secondary', 'danger'];
const SHADOW = `3px 3px 0px ${ink.DEFAULT}`;

interface Props extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  icon,
  loading,
  compact,
  disabled,
  className,
  ...rest
}: Props) {
  const raised = RAISED.includes(variant) && !disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading) }}
      disabled={disabled || loading}
      hitSlop={4}
      className={`rounded-2xl ${container[variant]} ${className ?? ''}`}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : variant === 'ghost' && pressed ? 0.6 : 1,
        boxShadow: raised && !pressed ? SHADOW : undefined,
        transform: raised && pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined,
      })}
      {...rest}
    >
      {/* Full-size hit target: on Android only child views were catching taps, not the Pressable's own padding. */}
      <View
        collapsable={false}
        className={`${compact ? 'min-h-[44px] px-4' : 'min-h-[52px] px-6'} flex-row items-center justify-center gap-2`}
      >
        {loading ? (
          <ActivityIndicator color={iconColor[variant]} />
        ) : (
          <>
            {icon && <Icon name={icon} size={20} color={iconColor[variant]} />}
            <Text className={`font-display-semibold text-base ${label[variant]}`}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
