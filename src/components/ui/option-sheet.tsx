import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

export interface SheetOption {
  key: string;
  label: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  selected?: boolean;
  destructive?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  options: SheetOption[];
  onSelect: (key: string) => void;
  onClose: () => void;
}

/** Lightweight action / choice sheet. */
export function OptionSheet({ visible, title, options, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <View className="rounded-t-3xl bg-surface p-4 pb-10 dark:bg-surface-cardDark">
          <Text
            accessibilityRole="header"
            className="mb-2 px-2 font-semibold text-lg text-ink dark:text-ink-dark"
          >
            {title}
          </Text>
          {options.map((o) => (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              onPress={() => onSelect(o.key)}
              className="min-h-[52px] flex-row items-center gap-3 rounded-xl px-3 active:bg-black/5"
            >
              {o.icon && (
                <MaterialCommunityIcons
                  name={o.icon}
                  size={22}
                  color={o.destructive ? '#E06666' : '#5F6368'}
                />
              )}
              <Text
                className={`flex-1 text-base ${o.destructive ? 'text-danger' : 'text-ink dark:text-ink-dark'}`}
              >
                {o.label}
              </Text>
              {o.selected && <MaterialCommunityIcons name="check" size={20} color="#0F9D8A" />}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
