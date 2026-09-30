import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmountSheet, type AmountMode } from '@/components/home/amount-sheet';
import { JarCard } from '@/components/home/jar-card';
import { TotalsCard } from '@/components/home/totals-card';
import { IconButton } from '@/components/ui/icon-button';
import { OptionSheet } from '@/components/ui/option-sheet';
import { Screen } from '@/components/ui/screen';
import { computeTotals, sortJars } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import type { Jar, SortKey } from '@/types';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'manual', label: 'Newest first' },
  { key: 'name', label: 'Name' },
  { key: 'progress', label: 'Progress' },
  { key: 'amount', label: 'Amount saved' },
  { key: 'deadline', label: 'Deadline' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { jars, baskets, sortKey } = useJarStore();
  const { togglePin, deleteJar, applyAmount, setSortKey } = useJarStore.getState();

  const sheetRef = useRef<BottomSheetModal>(null);
  const [target, setTarget] = useState<{ jar: Jar | null; mode: AmountMode }>({
    jar: null,
    mode: 'add',
  });
  const [sortOpen, setSortOpen] = useState(false);
  const [moreJar, setMoreJar] = useState<Jar | null>(null);

  const sections = useMemo(() => {
    const sorted = sortJars(jars, sortKey);
    const result: { title: string; data: Jar[] }[] = [];
    const pinned = sorted.filter((j) => j.pinned);
    if (pinned.length) result.push({ title: 'Pinned', data: pinned });
    for (const b of baskets) {
      const data = sorted.filter((j) => !j.pinned && j.basketId === b.id);
      if (data.length) result.push({ title: b.name, data });
    }
    const loose = sorted.filter((j) => !j.pinned && !j.basketId);
    if (loose.length)
      result.push({ title: result.length ? 'Other jars' : 'All jars', data: loose });
    return result;
  }, [jars, baskets, sortKey]);

  const totals = useMemo(() => computeTotals(jars), [jars]);

  const openAmount = useCallback((jar: Jar, mode: AmountMode) => {
    setTarget({ jar, mode });
    sheetRef.current?.present();
  }, []);
  const onAdd = useCallback((j: Jar) => openAmount(j, 'add'), [openAmount]);
  const onMinus = useCallback((j: Jar) => openAmount(j, 'minus'), [openAmount]);
  const onEdit = useCallback(
    (j: Jar) => router.push({ pathname: '/jar/[id]/edit', params: { id: j.id } }),
    [],
  );
  const onHistory = useCallback(
    (j: Jar) => router.push({ pathname: '/jar/[id]/history', params: { id: j.id } }),
    [],
  );
  const onPin = useCallback((j: Jar) => togglePin(j.id), [togglePin]);
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
      <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
        <Text
          accessibilityRole="header"
          className="font-medium text-3xl text-ink dark:text-ink-dark"
        >
          {jars.length} jars · {baskets.length} baskets
        </Text>
      </View>

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
              No jars yet. Tap + to create your first one.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text className="mb-3 mt-5 px-6 text-lg text-ink dark:text-ink-dark">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <JarCard
              jar={item}
              onAdd={onAdd}
              onMinus={onMinus}
              onEdit={onEdit}
              onDelete={onDelete}
              onHistory={onHistory}
              onTogglePin={onPin}
              onMore={setMoreJar}
            />
          </View>
        )}
      />

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="absolute inset-x-0 bottom-0 flex-row items-center justify-between bg-white/95 px-4 pt-3 dark:bg-surface-cardDark/95"
      >
        <View className="flex-row gap-2">
          <IconButton icon="sort-variant" label="Sort jars" onPress={() => setSortOpen(true)} />
          <IconButton
            icon="basket-outline"
            label="Manage baskets"
            onPress={() => router.push('/baskets')}
          />
          <IconButton
            icon="cog-outline"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>
        <IconButton
          icon="plus"
          label="Create jar"
          size={30}
          className="h-14 w-14 rounded-2xl bg-jar-peach"
          onPress={() => router.push('/jar/new')}
        />
      </View>

      <AmountSheet
        ref={sheetRef}
        jar={target.jar}
        mode={target.mode}
        onDismiss={() => setTarget((t) => ({ ...t, jar: null }))}
        onSubmit={(jar, mode, amount, note) => {
          applyAmount(jar.id, mode, amount, note);
          sheetRef.current?.dismiss();
        }}
      />

      <OptionSheet
        visible={sortOpen}
        title="Sort by"
        options={SORT_OPTIONS.map((o) => ({ ...o, selected: o.key === sortKey }))}
        onClose={() => setSortOpen(false)}
        onSelect={(k) => {
          setSortKey(k as SortKey);
          setSortOpen(false);
        }}
      />

      <OptionSheet
        visible={!!moreJar}
        title={moreJar?.name ?? ''}
        options={[
          { key: 'pin', label: moreJar?.pinned ? 'Unpin' : 'Pin to top', icon: 'pin-outline' },
          { key: 'history', label: 'View history', icon: 'history' },
          { key: 'edit', label: 'Edit jar', icon: 'pencil-outline' },
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
          if (k === 'delete') onDelete(j);
        }}
      />
    </Screen>
  );
}
