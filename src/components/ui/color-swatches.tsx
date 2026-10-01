import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { jar as jarColors } from '@/theme/colors';
import type { JarColor } from '@/types';

const COLORS = Object.keys(jarColors) as JarColor[];

export function ColorSwatches({
  value,
  onChange,
}: {
  value: JarColor;
  onChange: (c: JarColor) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {COLORS.map((c) => (
        <Pressable
          key={c}
          accessibilityRole="radio"
          accessibilityLabel={c}
          accessibilityState={{ selected: c === value }}
          onPress={() => onChange(c)}
          style={{ backgroundColor: jarColors[c] }}
          className={`h-11 w-11 items-center justify-center rounded-full border-2 ${c === value ? 'border-ink' : 'border-transparent'}`}
        >
          {c === value && <MaterialCommunityIcons name="check" size={20} color="#1B1B1B" />}
        </Pressable>
      ))}
    </View>
  );
}
