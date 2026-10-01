import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistorySheet } from '@/components/history/history-sheet';
import { AmountSheet, type AmountMode } from '@/components/home/amount-sheet';
import { JarCard } from '@/components/home/jar-card';
import { TotalsCard } from '@/components/home/totals-card';
import { OptionSheet } from '@/components/ui/option-sheet';
import { computeTotals, sortJars } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import type { Jar } from '@/types';

interface Props {
  /** Active jars to show. */
  jars: Jar[];
  /** Group by basket (used for the "All jars" view). */
  grouped?: boolean;
  emptyText: string;
}

/** Totals, sectioned jar list and the per-jar sheets (amount, history, more). */
export function JarList({ jars, grouped, emptyText }: Props) {
  const insets = useSafeAreaInsets();
  const baskets = useJarStore((s) => s.baskets);
  const sortKey = useJarStore((s) => s.sortKey);
  const sortDir = useJarStore((s) => s.sortDir);
  const { togglePin, toggleArchive, deleteJar, applyAmount } = useJarStore.getState();

  const [target, setTarget] = useState<{ jar: Jar | null; mode: AmountMode }>({
    jar: null,
    mode: 'add',
  });
  const [moreJar, setMoreJar] = useState<Jar | null>(null);
  const [historyJar, setHistoryJar] = useState<Jar | null>(null);

  const sections = useMemo(() => {
    const sorted = sortJars(jars, sortKey, sortDir);
    const result: { title: string; data: Jar[] }[] = [];
    const pinned = sorted.filter((j) => j.pinned);
    if (pinned.length) result.push({ title: 'Pinned', data: pinned });
    const rest = sorted.filter((j) => !j.pinned);
    if (!grouped) {
      if (rest.length) result.push({ title: pinned.length ? 'Other jars' : '', data: rest });
      return result;
    }
    for (const b of baskets) {
      const data = rest.filter((j) => j.basketId === b.id);
      if (data.length) result.push({ title: b.name, data });
    }
    const loose = rest.filter((j) => !j.basketId);
    if (loose.length) result.push({ title: 'Unsorted', data: loose });
    return result;
  }, [jars, baskets, sortKey, sortDir, grouped]);

  const totals = useMemo(() => computeTotals(jars), [jars]);

  const openAmount = useCallback((jar: Jar, mode: AmountMode) => setTarget({ jar, mode }), []);
  const closeAmount = useCallback(() => setTarget((t) => ({ ...t, jar: null })), []);
  const onAdd = useCallback((j: Jar) => openAmount(j, 'add'), [openAmount]);
  const onMinus = useCallback((j: Jar) => openAmount(j, 'minus'), [openAmount]);
  const onEdit = useCallback(
    (j: Jar) => router.push({ pathname: '/jar/[id]/edit', params: { id: j.id } }),
    [],
  );
  const onHistory = useCallback((j: Jar) => setHistoryJar(j), []);
  const onPin = useCallback((j: Jar) => togglePin(j.id), [togglePin]);
  const onArchive = useCallback((j: Jar) => toggleArchive(j.id), [toggleArchive]);
  const onDelete = useCallback(
    (j: Jar) =>
      Alert.alert('Delete jar?', `"${j.name}" and its history will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteJar(j.id) },
      ]),
    [deleteJar],
  );

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(j) => j.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        ListHeaderComponent={<TotalsCard rows={totals} />}
        ListEmptyComponent={
          <View className="items-center px-8 pt-20">
            <MaterialCommunityIcons name="wallet-plus-outline" size={72} color="#9AA0A6" />
            <Text className="mt-4 text-center text-lg text-ink-muted dark:text-ink-mutedDark">
              {emptyText}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text className="mb-3 mt-5 px-6 text-lg text-ink dark:text-ink-dark">
              {section.title}
            </Text>
          ) : (
            <View className="h-4" />
          )
        }
        renderItem={({ item }) => (
          <View className="px-6">
            <JarCard
              jar={item}
              onAdd={onAdd}
              onMinus={onMinus}
              onEdit={onEdit}
              onDelete={onDelete}
              onHistory={onHistory}
              onTogglePin={onPin}
              onToggleArchive={onArchive}
              onMore={setMoreJar}
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

      <OptionSheet
        visible={!!moreJar}
        title={moreJar?.name ?? ''}
        options={[
          { key: 'pin', label: moreJar?.pinned ? 'Unpin' : 'Pin to top', icon: 'pin-outline' },
          { key: 'history', label: 'View history', icon: 'history' },
          { key: 'edit', label: 'Edit jar', icon: 'pencil-outline' },
          { key: 'archive', label: 'Archive', icon: 'archive-outline' },
          { key: 'delete', label: 'Delete jar', icon: 'trash-can-outline', destructive: true },
        ]}
        onClose={() => setMoreJar(null)}
        onSelect={(k) => {
          const j = moreJar;
          setMoreJar(null);
          if (!j) return;
          if (k === 'pin') onPin(j);
          if (k === 'history') onHistory(j);
          if (k === 'edit') onEdit(j);
          if (k === 'archive') onArchive(j);
          if (k === 'delete') onDelete(j);
        }}
      />
    </>
  );
}
