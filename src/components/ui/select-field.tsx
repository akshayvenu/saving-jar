import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

import { ink } from '@/theme/colors';

import { SheetFrame } from './sheet-frame';

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
      <Text className="mb-1.5 ml-1 font-medium text-sm text-ink-muted">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`min-h-[54px] flex-row items-center justify-between rounded-block border-hair border-surface-line bg-surface-card px-4 ${
          disabled ? 'opacity-50' : 'active:border-ink'
        }`}
      >
        <Text numberOfLines={1} className="flex-1 font-sans text-base text-ink">
          {current}
        </Text>
        {!disabled && (
          <View className="h-7 w-7 items-center justify-center rounded-full bg-surface">
            <MaterialCommunityIcons name="chevron-down" size={20} color={ink.DEFAULT} />
          </View>
        )}
      </Pressable>
      {helper ? <Text className="ml-1 mt-1 font-sans text-xs text-ink-muted">{helper}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <SheetFrame title={label} className="max-h-[60%]">
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              contentContainerClassName="gap-2"
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`min-h-[52px] flex-row items-center justify-between rounded-2xl border-hair px-4 ${
                      selected
                        ? 'border-ink bg-ink'
                        : 'border-surface-line bg-surface-card active:border-ink'
                    }`}
                  >
                    <Text
                      className={`text-base ${selected ? 'font-semibold text-white' : 'font-sans text-ink'}`}
                    >
                      {item.label}
                    </Text>
                    {selected && <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />}
                  </Pressable>
                );
              }}
            />
          </SheetFrame>
        </Pressable>
      </Modal>
    </View>
  );
}
