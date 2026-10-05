import { Modal, Pressable, Text, View } from 'react-native';

import { Icon } from './icon';
import { SheetFrame } from './sheet-frame';

interface PillProps {
  label: string;
  onPress: () => void;
  /** Swatch shown at the start of the pill. */
  color?: string;
  /** Optional trailing count, e.g. jars in a basket. */
  count?: number;
  icon?: React.ComponentProps<typeof Icon>['name'];
  selected?: boolean;
  full?: boolean;
}

/** Outlined choice tile shared by the basket and sort sheets; selected = solid ink. */
export function ChoicePill({ label, onPress, color, count, icon, selected, full }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={`min-h-[54px] flex-row items-center gap-2.5 rounded-2xl border-hair border-ink px-3 ${
        full ? 'w-full' : 'w-[48.5%]'
      } ${selected ? 'bg-ink' : 'bg-surface-card active:bg-surface-sunken'}`}
    >
      {color ? (
        <View
          style={{ backgroundColor: color }}
          className={`h-6 w-6 rounded-lg border-hair ${selected ? 'border-white' : 'border-ink'}`}
        />
      ) : null}
      {icon ? (
        <Icon name={icon} size={20} color={selected ? '#FFFFFF' : '#121212'} />
      ) : null}
      <Text
        numberOfLines={1}
        className={`flex-1 font-medium text-base ${selected ? 'text-white' : 'text-ink'}`}
      >
        {label}
      </Text>
      {count != null ? (
        <Text
          className={`font-display-semibold text-sm ${selected ? 'text-white/70' : 'text-ink-muted'}`}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

interface SheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PillSheet({ visible, title, subtitle, onClose, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <SheetFrame title={title} subtitle={subtitle}>
          <View className="flex-row flex-wrap justify-between gap-y-2.5">{children}</View>
        </SheetFrame>
      </Pressable>
    </Modal>
  );
}
