import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { ink, jar as jarColors } from '@/theme/colors';
import type { JarColor } from '@/types';

import { Button } from './button';

const COLORS = Object.keys(jarColors) as JarColor[];

const ROWS = [COLORS.slice(0, 4), COLORS.slice(4)];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
      <Text className="mb-1.5 ml-1 font-medium text-sm text-ink-muted">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => setOpen(true)}
        className="min-h-[54px] flex-row items-center gap-3 rounded-block border-hair border-surface-line bg-surface-card px-4 active:border-ink"
      >
        <View
          style={{ backgroundColor: jarColors[value] }}
          className="h-7 w-7 rounded-lg border-hair border-ink"
        />
        <Text className="flex-1 font-sans text-base text-ink">{capitalize(value)}</Text>
        <MaterialCommunityIcons name="palette-outline" size={20} color={ink.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-5"
          onPress={close}
          accessibilityLabel="Close"
        >
          <Pressable
            onPress={() => {}}
            style={{ boxShadow: `5px 5px 0px ${ink.DEFAULT}` }}
            className="w-full rounded-[28px] border-hair border-ink bg-surface p-5"
          >
            <Text accessibilityRole="header" className="font-display-semibold text-2xl text-ink">
              Pick a colour
            </Text>
            <Text className="mb-4 mt-1 font-sans text-sm text-ink-muted">
              Used for the card and its fill
            </Text>
            <View className="gap-3">
              {ROWS.map((row, i) => (
                <View key={i} className="flex-row gap-3">
                  {row.map((c) => {
                    const selected = c === value;
                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="radio"
                        accessibilityLabel={c}
                        accessibilityState={{ selected }}
                        onPress={() => {
                          onChange(c);
                          close();
                        }}
                        style={{
                          backgroundColor: jarColors[c],
                          flex: 1,
                          aspectRatio: 1,
                          boxShadow: selected ? `3px 3px 0px ${ink.DEFAULT}` : undefined,
                        }}
                        className={`items-center justify-center rounded-2xl border-ink active:opacity-80 ${
                          selected ? 'border-2' : 'border-hair'
                        }`}
                      >
                        {selected && (
                          <MaterialCommunityIcons name="check-bold" size={22} color={ink.DEFAULT} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
            <Button
              title="Done"
              variant="secondary"
              compact
              onPress={close}
              className="mt-5 self-end"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
