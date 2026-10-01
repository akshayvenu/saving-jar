import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistorySheet } from '@/components/history/history-sheet';
import { AmountSheet, type AmountMode } from '@/components/home/amount-sheet';
import { JarCard } from '@/components/home/jar-card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useJarStore } from '@/store/useJarStore';
import type { Jar } from '@/types';

const noop = () => {};

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const jars = useJarStore((s) => s.jars);
  const { toggleArchive, deleteJar, applyAmount } = useJarStore.getState();

  const archived = useMemo(() => jars.filter((j) => j.archived), [jars]);
  const [target, setTarget] = useState<{ jar: Jar | null; mode: AmountMode }>({
    jar: null,
    mode: 'add',
  });
  const [historyJar, setHistoryJar] = useState<Jar | null>(null);

  const closeAmount = useCallback(() => setTarget((t) => ({ ...t, jar: null })), []);
  const onAdd = useCallback((j: Jar) => setTarget({ jar: j, mode: 'add' }), []);
  const onMinus = useCallback((j: Jar) => setTarget({ jar: j, mode: 'minus' }), []);
  const onEdit = useCallback(
    (j: Jar) => router.push({ pathname: '/jar/[id]/edit', params: { id: j.id } }),
    [],
  );
  const onUnarchive = useCallback((j: Jar) => toggleArchive(j.id), [toggleArchive]);
  const onDelete = useCallback(
    (j: Jar) =>
      Alert.alert('Delete jar?', `"${j.name}" and its history will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteJar(j.id) },
      ]),
    [deleteJar],
  );

  return (
    <Screen>
      <ScreenHeader title="Archive" />
      <FlatList
        data={archived}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="items-center px-8 pt-20">
            <MaterialCommunityIcons name="archive-outline" size={72} color="#9AA0A6" />
            <Text className="mt-4 text-center text-lg text-ink-muted dark:text-ink-mutedDark">
              No archived jars.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-6">
            <JarCard
              jar={item}
              onAdd={onAdd}
              onMinus={onMinus}
              onEdit={onEdit}
              onDelete={onDelete}
              onHistory={setHistoryJar}
              onTogglePin={noop}
              onToggleArchive={onUnarchive}
              onMore={noop}
            />
          </View>
        )}
      />

      <AmountSheet
        jar={target.jar}
        mode={target.mode}
        onClose={closeAmount}
        onSubmit={(jar, mode, amount, note) => {
          applyAmount(jar.id, mode, amount, note);
          closeAmount();
        }}
      />
      <HistorySheet jar={historyJar} onClose={() => setHistoryJar(null)} />
    </Screen>
  );
}
