import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Base screen container: themed background + safe-area top padding. */
export function Screen({ className, style, ...rest }: ViewProps & { className?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 bg-surface dark:bg-surface-dark ${className ?? ''}`}
      style={[{ paddingTop: insets.top }, style]}
      {...rest}
    />
  );
}
