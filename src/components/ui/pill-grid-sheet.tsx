import { Modal, Pressable, Text, View } from 'react-native';

interface PillProps {
  label: string;
  onPress: () => void;
  /** Fill colour; unselected pills use the surface colour unless `tint` is set. */
  color?: string;
  selected?: boolean;
  full?: boolean;
}

/** Outlined, colourful choice button shared by the basket and sort sheets. */
export function ChoicePill({ label, onPress, color, selected, full }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={color ? { backgroundColor: color } : undefined}
      className={`min-h-[52px] items-center justify-center rounded-2xl px-3 active:opacity-80 ${
        full ? 'w-full' : 'w-[48%]'
      } ${color ? '' : 'bg-surface dark:bg-surface-dark'} ${
        selected ? 'border-[3px] border-ink' : 'border-2 border-ink/70'
      }`}
    >
      <Text numberOfLines={1} className="text-center text-lg text-ink">
        {label}
      </Text>
    </Pressable>
  );
}

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PillSheet({ visible, title, onClose, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <Pressable
          onPress={() => {}}
          className="rounded-t-3xl bg-surface p-4 pb-10 dark:bg-surface-cardDark"
        >
          <Text
            accessibilityRole="header"
            className="mb-4 px-2 font-semibold text-2xl text-ink dark:text-ink-dark"
          >
            {title}
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
