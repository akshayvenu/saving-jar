import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { jar as jarColors } from '@/theme/colors';
import type { JarColor } from '@/types';

const COLORS = Object.keys(jarColors) as JarColor[];

const ROWS = [COLORS.slice(0, 4), COLORS.slice(4)];

interface Props {
  value: JarColor;
  onChange: (c: JarColor) => void;
  label?: string;
  className?: string;
}

/** Field row showing the current colour; tapping opens a "Pick a colour" dialog. */
export function ColorField({ value, onChange, label = 'Colour', className }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => setOpen(true)}
        className="min-h-[56px] flex-row items-center justify-between rounded-2xl border border-ink-muted/60 px-4 active:bg-black/5 dark:border-ink-mutedDark/60"
      >
        <Text className="text-base text-ink dark:text-ink-dark">{label}</Text>
        <View
          style={{ backgroundColor: jarColors[value] }}
          className="h-8 w-8 rounded-lg border border-ink/30"
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-5"
          onPress={close}
          accessibilityLabel="Close"
        >
          <Pressable
            onPress={() => {}}
            className="w-full rounded-3xl bg-surface p-6 dark:bg-surface-cardDark"
          >
            <Text accessibilityRole="header" className="text-3xl text-ink dark:text-ink-dark">
              Pick a colour
            </Text>
            <Text className="mb-4 mt-4 text-base text-ink-muted dark:text-ink-mutedDark">
              Standard colours
            </Text>
            <View className="gap-3">
              {ROWS.map((row, i) => (
                <View key={i} className="flex-row gap-3">
                  {row.map((c) => (
                    <Pressable
                      key={c}
                      accessibilityRole="radio"
                      accessibilityLabel={c}
                      accessibilityState={{ selected: c === value }}
                      onPress={() => {
                        onChange(c);
                        close();
                      }}
                      style={{ backgroundColor: jarColors[c], flex: 1, aspectRatio: 1 }}
                      className={`rounded-2xl active:opacity-80 ${
                        c === value ? 'border-[3px] border-ink' : 'border border-ink/20'
                      }`}
                    />
                  ))}
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              hitSlop={8}
              className="mt-6 self-end px-2 py-1 active:opacity-60"
            >
              <Text className="font-medium text-lg text-accent-blue">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
