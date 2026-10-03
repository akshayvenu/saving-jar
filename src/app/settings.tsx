import Constants from 'expo-constants';
import { ScrollView, Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/brand-mark';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectField } from '@/components/ui/select-field';
import { CURRENCIES } from '@/lib/format';
import { useJarStore } from '@/store/useJarStore';

export default function SettingsScreen() {
  const { defaultCurrency, setDefaultCurrency } = useJarStore();
  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerClassName="px-5 pb-10">
        <SectionLabel>Defaults</SectionLabel>
        <View className="rounded-jar border-hair border-ink bg-surface-card p-4">
          <SelectField
            label="Default currency"
            value={defaultCurrency}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            onChange={setDefaultCurrency}
            helper="Used for new jars"
          />
        </View>
        <View className="mt-12 items-center gap-3">
          <BrandMark size={14} />
          <Text className="font-display-bold text-xl text-ink">JamJars</Text>
          <Text className="font-sans text-sm text-ink-muted">
            Saving, made simple · v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
