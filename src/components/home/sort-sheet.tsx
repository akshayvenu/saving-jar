import { View } from 'react-native';

import { ChoicePill, PillSheet } from '@/components/ui/pill-grid-sheet';
import { useJarStore } from '@/store/useJarStore';
import { accent } from '@/theme/colors';
import type { SortDir, SortKey } from '@/types';

const FIELDS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount' },
  { key: 'goal', label: 'Goal' },
  { key: 'remaining', label: 'Remaining' },
  { key: 'progress', label: 'Progress' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'manual', label: 'Newest' },
];

const DIRS: { key: SortDir; label: string }[] = [
  { key: 'asc', label: 'Ascending' },
  { key: 'desc', label: 'Descending' },
];

export function SortSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const sortKey = useJarStore((s) => s.sortKey);
  const sortDir = useJarStore((s) => s.sortDir);
  const { setSortKey, setSortDir } = useJarStore.getState();

  return (
    <PillSheet visible={visible} title="Sort By" onClose={onClose}>
      <View className="w-[48%] gap-3">
        {FIELDS.map((f) => (
          <ChoicePill
            key={f.key}
            full
            label={f.label}
            selected={f.key === sortKey}
            color={f.key === sortKey ? accent.blue : undefined}
            onPress={() => setSortKey(f.key)}
          />
        ))}
      </View>
      <View className="w-[48%] gap-3">
        {DIRS.map((d) => (
          <ChoicePill
            key={d.key}
            full
            label={d.label}
            selected={d.key === sortDir}
            color={d.key === sortDir ? accent.pink : undefined}
            onPress={() => setSortDir(d.key)}
          />
        ))}
      </View>
    </PillSheet>
  );
}
