import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, type PressableProps } from 'react-native';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props extends Omit<PressableProps, 'children'> {
  icon: IconName;
  label: string;
  size?: number;
  color?: string;
  className?: string;
}

/** Icon-only button with a 44pt hit area and a mandatory accessibility label. */
export function IconButton({
  icon,
  label,
  size = 24,
  color = '#1B1B1B',
  className,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className={`h-11 w-11 items-center justify-center rounded-full active:bg-black/10 ${className ?? ''}`}
      {...rest}
    >
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </Pressable>
  );
}
