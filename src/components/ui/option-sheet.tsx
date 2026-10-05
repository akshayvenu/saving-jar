import { Modal, Pressable, Text, View } from 'react-native';

import { danger, ink } from '@/theme/colors';

import { Icon } from './icon';
import { SheetFrame } from './sheet-frame';

export interface SheetOption {
  key: string;
  label: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
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

/** Lightweight action / choice sheet: a stack of outlined rows with icon tiles. */
export function OptionSheet({ visible, title, options, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <SheetFrame title={title}>
          <View className="overflow-hidden rounded-block border-hair border-ink bg-surface-card">
            {options.map((o, i) => (
              <Pressable
                key={o.key}
                accessibilityRole="button"
                onPress={() => onSelect(o.key)}
                className={`min-h-[56px] flex-row items-center gap-3 px-3 active:bg-surface ${
                  i > 0 ? 'border-t-hair border-surface-line' : ''
                }`}
              >
                {o.icon && (
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-xl ${
                      o.destructive ? 'bg-danger/10' : 'bg-surface'
                    }`}
                  >
                    <Icon
                      name={o.icon}
                      size={20}
                      color={o.destructive ? danger : ink.DEFAULT}
                    />
                  </View>
                )}
                <Text
                  className={`flex-1 font-medium text-base ${o.destructive ? 'text-danger' : 'text-ink'}`}
                >
                  {o.label}
                </Text>
                {o.selected && (
                  <Icon name="check" size={20} color={ink.DEFAULT} />
                )}
              </Pressable>
            ))}
          </View>
        </SheetFrame>
      </Pressable>
    </Modal>
  );
}
