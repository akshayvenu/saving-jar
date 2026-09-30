import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

import { TransactionRow } from '@/components/history/transaction-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useJarStore } from '@/store/useJarStore';

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jar = useJarStore((s) => s.jars.find((j) => j.id === id));
  const all = useJarStore((s) => s.transactions);
  const txs = useMemo(
    () => all.filter((t) => t.jarId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, id],
  );

  return (
    <Screen>
      <ScreenHeader title={jar ? `${jar.name} · History` : 'History'} />
      <FlatList
        data={txs}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
        renderItem={({ item }) => <TransactionRow tx={item} currency={jar?.currency ?? 'INR'} />}
        ListEmptyComponent={
          <View className="items-center px-8 pt-24">
            <MaterialCommunityIcons name="history" size={64} color="#9AA0A6" />
            <Text className="mt-3 text-center text-lg text-ink-muted dark:text-ink-mutedDark">
              No transactions yet.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
