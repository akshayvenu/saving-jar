import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

/** One bordered card holding rows separated by thin dividers. */
export function ListCard({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <View className="overflow-hidden rounded-jar border-hair border-ink bg-surface-card">
      {items.map((child, i) => (
        <View key={i} className={i > 0 ? 'border-t-hair border-surface-line' : ''}>
          {child}
        </View>
      ))}
    </View>
  );
}
