import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

export interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  helper?: string;
  className?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  helper,
  className,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? '';

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`min-h-[56px] flex-row items-center justify-between rounded-2xl border border-ink-muted/60 px-4 dark:border-ink-mutedDark/60 ${disabled ? 'opacity-50' : 'active:bg-black/5'}`}
      >
        <Text className="text-base text-ink dark:text-ink-dark">
          {label}: {current}
        </Text>
        {!disabled && <MaterialCommunityIcons name="chevron-down" size={22} color="#5F6368" />}
      </Pressable>
      {helper ? (
        <Text className="ml-2 mt-1 text-xs text-ink-muted dark:text-ink-mutedDark">{helper}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <View className="max-h-[60%] rounded-t-3xl bg-surface p-4 pb-8 dark:bg-surface-cardDark">
            <Text className="mb-2 px-2 font-semibold text-lg text-ink dark:text-ink-dark">
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: item.value === value }}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="min-h-[48px] flex-row items-center justify-between rounded-xl px-3 active:bg-black/5"
                >
                  <Text className="text-base text-ink dark:text-ink-dark">{item.label}</Text>
                  {item.value === value && (
                    <MaterialCommunityIcons name="check" size={20} color="#0F9D8A" />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
