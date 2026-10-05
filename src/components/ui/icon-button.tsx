import { Pressable, type PressableProps } from 'react-native';

import { ink } from '@/theme/colors';

import { Icon } from './icon';

type IconName = React.ComponentProps<typeof Icon>['name'];
type Tone = 'plain' | 'card' | 'ink';

const tone: Record<Tone, string> = {
  plain: 'active:bg-black/10',
  card: 'bg-surface-card border-hair border-ink active:bg-surface-sunken',
  ink: 'bg-ink active:opacity-80',
};

interface Props extends Omit<PressableProps, 'children'> {
  icon: IconName;
  label: string;
  size?: number;
  color?: string;
  /** `plain` is transparent, `card` is an outlined white chip, `ink` is solid black. */
  variant?: Tone;
  className?: string;
}

/** Icon-only button with a 44pt hit area and a mandatory accessibility label. */
export function IconButton({
  icon,
  label,
  size = 22,
  color,
  variant = 'plain',
  className,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className={`h-11 w-11 items-center justify-center rounded-full ${tone[variant]} ${className ?? ''}`}
      {...rest}
    >
      <Icon
        name={icon}
        size={size}
        color={color ?? (variant === 'ink' ? '#FFFFFF' : ink.DEFAULT)}
      />
    </Pressable>
  );
}
