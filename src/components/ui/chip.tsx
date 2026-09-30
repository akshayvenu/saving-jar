import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function PremiumChip() {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5">
      <MaterialCommunityIcons name="lock-outline" size={14} color="#0F9D8A" />
      <Text className="text-sm text-brand">Premium</Text>
    </View>
  );
}
