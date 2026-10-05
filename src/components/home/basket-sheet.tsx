import { router } from 'expo-router';
import { useMemo } from 'react';

import { ChoicePill, PillSheet } from '@/components/ui/pill-grid-sheet';
import { ALL_ID, NO_BASKET_LABEL, UNSORTED_ID, jarsInBasket } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { jar as jarColors } from '@/theme/colors';

interface Props {
  visible: boolean;
  /** Basket currently shown, or undefined on the overview screen. */
  currentId?: string;
  onClose: () => void;
}

export function BasketSheet({ visible, currentId, onClose }: Props) {
  const jars = useJarStore((s) => s.jars);
  const baskets = useJarStore((s) => s.baskets);
  const counts = useMemo(() => {
    const count = (id: string) => jarsInBasket(jars, id).length;
    const map: Record<string, number> = {
      [ALL_ID]: count(ALL_ID),
      [UNSORTED_ID]: count(UNSORTED_ID),
    };
    for (const b of baskets) map[b.id] = count(b.id);
    return map;
  }, [jars, baskets]);

  const go = (id: string) => {
    onClose();
    if (id === currentId) return;
    const href = { pathname: '/basket/[id]', params: { id } } as const;
    if (currentId) router.replace(href);
    else router.push(href);
  };

  return (
    <PillSheet visible={visible} title="Baskets" subtitle="Jump to a basket" onClose={onClose}>
      <ChoicePill
        label="All jars"
        count={counts[ALL_ID]}
        icon="view-grid-outline"
        selected={currentId === ALL_ID}
        onPress={() => go(ALL_ID)}
      />
      {baskets.map((b) => (
        <ChoicePill
          key={b.id}
          label={b.name}
          count={counts[b.id]}
          selected={currentId === b.id}
          color={jarColors[b.color]}
          onPress={() => go(b.id)}
        />
      ))}
      {counts[UNSORTED_ID] > 0 && (
        <ChoicePill
          label={NO_BASKET_LABEL}
          count={counts[UNSORTED_ID]}
          selected={currentId === UNSORTED_ID}
          color={jarColors.slate}
          onPress={() => go(UNSORTED_ID)}
        />
      )}
      <ChoicePill
        full
        label="New / manage baskets"
        icon="plus"
        onPress={() => {
          onClose();
          router.push('/baskets');
        }}
      />
    </PillSheet>
  );
}
