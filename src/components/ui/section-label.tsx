import { Text } from 'react-native';

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="mb-3 mt-6 font-semibold text-base text-brand">
      {children}
    </Text>
  );
}
