import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectField } from '@/components/ui/select-field';
import { CURRENCIES } from '@/lib/format';
import { signOut } from '@/lib/google-auth';
import { syncNow } from '@/lib/sync';
import { useAuthStore } from '@/store/useAuthStore';
import { useJarStore } from '@/store/useJarStore';
import { useSyncStore } from '@/store/useSyncStore';
import { ink } from '@/theme/colors';

function syncLabel(s: { enabled: boolean; status: string; lastSyncedAt?: number }) {
  if (!s.enabled) return 'Backup is off for the dev user. Data stays on this phone.';
  if (s.status === 'syncing') return 'Backing up…';
  if (s.status === 'offline') return 'Offline. Changes are saved on this phone and will back up later.';
  if (s.status === 'error') return 'Backup failed. Your data is safe on this phone. Try again.';
  if (!s.lastSyncedAt) return 'Your jars back up automatically.';
  const mins = Math.floor((Date.now() - s.lastSyncedAt) / 60000);
  return mins < 1 ? 'Backed up just now' : `Backed up ${mins} min ago`;
}

export default function SettingsScreen() {
  const { defaultCurrency, setDefaultCurrency } = useJarStore();
  const user = useAuthStore((s) => s.user);
  const sync = useSyncStore();
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
        <SectionLabel>Jars</SectionLabel>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/archive')}
          className="flex-row items-center gap-3 rounded-jar border-hair border-ink bg-surface-card p-4 active:bg-surface-sunken"
        >
          <Icon name="archive-outline" size={22} color={ink.DEFAULT} />
          <Text className="flex-1 font-display-semibold text-base text-ink">Archived jars</Text>
          <Icon name="chevron-right" size={20} color={ink.muted} />
        </Pressable>
        <SectionLabel>Cloud backup</SectionLabel>
        <View className="gap-3 rounded-jar border-hair border-ink bg-surface-card p-4">
          <Text className="font-sans text-sm text-ink-muted">{syncLabel(sync)}</Text>
          {sync.enabled && (
            <Button
              title="Sync now"
              variant="outline"
              icon="cloud-sync-outline"
              compact
              loading={sync.status === 'syncing'}
              onPress={syncNow}
            />
          )}
        </View>
        <SectionLabel>Account</SectionLabel>
        <View className="gap-3 rounded-jar border-hair border-ink bg-surface-card p-4">
          <View>
            <Text className="font-display-semibold text-base text-ink">
              {user?.name ?? 'Signed in'}
            </Text>
            {user?.email && <Text className="font-sans text-sm text-ink-muted">{user.email}</Text>}
          </View>
          <Button title="Sign out" variant="outline" icon="logout" compact onPress={signOut} />
        </View>
        <View className="mt-12 items-center gap-3">
          <BrandMark size={14} />
          <Text className="font-display-bold text-xl text-ink">Saving Jar</Text>
          <Text className="font-sans text-sm text-ink-muted">
            Saving, made simple · v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
