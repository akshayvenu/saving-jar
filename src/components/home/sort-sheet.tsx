import { View } from 'react-native';

import { ChoicePill, PillSheet } from '@/components/ui/pill-grid-sheet';
import { useJarStore } from '@/store/useJarStore';
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

const DIRS: { key: SortDir; label: string; icon: 'sort-ascending' | 'sort-descending' }[] = [
  { key: 'asc', label: 'Ascending', icon: 'sort-ascending' },
  { key: 'desc', label: 'Descending', icon: 'sort-descending' },
];

export function SortSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const sortKey = useJarStore((s) => s.sortKey);
  const sortDir = useJarStore((s) => s.sortDir);
  const { setSortKey, setSortDir } = useJarStore.getState();

  return (
    <PillSheet
      visible={visible}
      title="Sort by"
      subtitle="Pinned jars always stay on top"
      onClose={onClose}
    >
      <View className="w-[48.5%] gap-2.5">
        {FIELDS.map((f) => (
          <ChoicePill
            key={f.key}
            full
            label={f.label}
            selected={f.key === sortKey}
            onPress={() => setSortKey(f.key)}
          />
        ))}
      </View>
      <View className="w-[48.5%] gap-2.5">
        {DIRS.map((d) => (
          <ChoicePill
            key={d.key}
            full
            label={d.label}
            selected={d.key === sortDir}
            icon={d.icon}
            onPress={() => setSortDir(d.key)}
          />
        ))}
      </View>
    </PillSheet>
  );
}
