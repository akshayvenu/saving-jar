import Constants from 'expo-constants';
import { ScrollView, Text, View } from 'react-native';

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
        <SelectField
          label="Default currency"
          value={defaultCurrency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          onChange={setDefaultCurrency}
        />
        <View className="mt-10 items-center">
          <Text className="text-ink-muted dark:text-ink-mutedDark">
            Jam Jars v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
