import { View } from 'react-native';

import { brand, ink } from '@/theme/colors';

import { Hatch } from './hatch';

/** Three-tile logo: solid ink, brand orange, hatched. */
export function BrandMark({ size = 12 }: { size?: number }) {
  const tile = { width: size, height: size };
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="flex-row">
        <View style={tile} />
        <View style={[tile, { backgroundColor: brand.DEFAULT }]} />
      </View>
      <View className="flex-row">
        <View style={[tile, { backgroundColor: ink.DEFAULT }]} />
        <View style={[tile, { overflow: 'hidden' }]}>
          <Hatch gap={size / 3} strokeWidth={1} />
        </View>
      </View>
    </View>
  );
}
