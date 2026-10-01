import { router } from 'expo-router';
import { useMemo } from 'react';

import { ChoicePill, PillSheet } from '@/components/ui/pill-grid-sheet';
import { ALL_ID, UNSORTED_ID, jarsInBasket } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { accent, jar as jarColors } from '@/theme/colors';

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
    const map: Record<string, number> = {
      [ALL_ID]: jarsInBasket(jars, ALL_ID).length,
      [UNSORTED_ID]: jarsInBasket(jars, UNSORTED_ID).length,
    };
    for (const b of baskets) map[b.id] = jarsInBasket(jars, b.id).length;
    return map;
  }, [jars, baskets]);

  const go = (id: string) => {
    onClose();
    if (id === currentId) return;
    if (currentId) router.replace({ pathname: '/basket/[id]', params: { id } });
    else router.push({ pathname: '/basket/[id]', params: { id } });
  };

  return (
    <PillSheet visible={visible} title="Baskets" onClose={onClose}>
      <ChoicePill
        label={`All jars (${counts[ALL_ID]})`}
        selected={currentId === ALL_ID}
        color={accent.blue}
        onPress={() => go(ALL_ID)}
      />
      {baskets.map((b) => (
        <ChoicePill
          key={b.id}
          label={`${b.name} (${counts[b.id]})`}
          selected={currentId === b.id}
          color={jarColors[b.color]}
          onPress={() => go(b.id)}
        />
      ))}
      {counts[UNSORTED_ID] > 0 && (
        <ChoicePill
          label={`Unsorted (${counts[UNSORTED_ID]})`}
          selected={currentId === UNSORTED_ID}
          color={jarColors.slate}
          onPress={() => go(UNSORTED_ID)}
        />
      )}
      <ChoicePill
        full
        label="+ New / Manage baskets"
        color={accent.pink}
        onPress={() => {
          onClose();
          router.push('/baskets');
        }}
      />
    </PillSheet>
  );
}
