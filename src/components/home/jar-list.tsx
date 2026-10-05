import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistorySheet } from '@/components/history/history-sheet';
import { AmountSheet, type AmountMode } from '@/components/home/amount-sheet';
import { JarCard } from '@/components/home/jar-card';
import { MoveBasketSheet } from '@/components/home/move-basket-sheet';
import { TotalsCard } from '@/components/home/totals-card';
import { EmptyState } from '@/components/ui/empty-state';
import { OptionSheet } from '@/components/ui/option-sheet';
import { SectionLabel } from '@/components/ui/section-label';
import { NO_BASKET_LABEL, computeTotals, sortJars } from '@/store/selectors';
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
  const [basketJar, setBasketJar] = useState<Jar | null>(null);

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
    if (loose.length) result.push({ title: NO_BASKET_LABEL, data: loose });
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
        ListEmptyComponent={<EmptyState text={emptyText} />}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View className="px-5">
              <SectionLabel meta={String(section.data.length)}>{section.title}</SectionLabel>
            </View>
          ) : (
            <View className="h-5" />
          )
        }
        renderItem={({ item }) => (
          <View className="px-5">
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

      <MoveBasketSheet jar={basketJar} onClose={() => setBasketJar(null)} />

      <OptionSheet
        visible={!!moreJar}
        title={moreJar?.name ?? ''}
        options={[
          { key: 'pin', label: moreJar?.pinned ? 'Unpin' : 'Pin to top', icon: 'pin-outline' },
          {
            key: 'basket',
            label: moreJar?.basketId ? 'Move to basket' : 'Add to basket',
            icon: 'basket-outline',
          },
          { key: 'history', label: 'History & stats', icon: 'history' },
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
          // iOS can't present a modal while the "more" one is still fading out.
          if (k === 'basket') setTimeout(() => setBasketJar(j), 300);
          if (k === 'history') onHistory(j);
          if (k === 'edit') onEdit(j);
          if (k === 'archive') onArchive(j);
          if (k === 'delete') onDelete(j);
        }}
      />
    </>
  );
}
