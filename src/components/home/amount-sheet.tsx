import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { formatMoney, parseAmount } from '@/lib/format';
import type { Jar } from '@/types';

export type AmountMode = 'add' | 'minus';

interface Props {
  jar: Jar | null;
  mode: AmountMode;
  onSubmit: (jar: Jar, mode: AmountMode, amount: number, note?: string) => void;
  onDismiss: () => void;
}

const QUICK = [100, 500, 1000];

// Critically-damped spring: glides up from the bottom without bouncing.
const SPRING = { damping: 80, stiffness: 500, mass: 1, overshootClamping: true };

const renderBackdrop = (p: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
);

export const AmountSheet = forwardRef<BottomSheetModal, Props>(function AmountSheet(
  { jar, mode, onSubmit, onDismiss },
  ref,
) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const inputRef = useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);

  useEffect(() => {
    setValue('');
    setNote('');
  }, [jar?.id, mode]);

  const amount = parseAmount(value);
  const invalid = amount == null || amount <= 0;
  const isAdd = mode === 'add';

  const submit = () => {
    if (!jar || invalid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(jar, mode, amount, note);
  };

  // Focus only once the slide-up has settled, so the keyboard doesn't
  // open mid-animation and make the sheet jump.
  const onChange = useCallback((index: number) => {
    if (index >= 0) inputRef.current?.focus();
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      onDismiss={onDismiss}
      onChange={onChange}
      animationConfigs={SPRING}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView className="px-5 pb-8">
        <Text className="font-bold text-2xl text-ink">
          {isAdd ? 'Add to' : 'Take from'} {jar?.name}
        </Text>
        {jar && (
          <Text className="mt-1 text-ink-muted">
            Balance: {formatMoney(jar.saved, jar.currency)}
          </Text>
        )}

        <BottomSheetTextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="0"
          accessibilityLabel="Amount"
          className="my-4 rounded-2xl border border-ink-muted/60 px-4 py-3 text-center font-bold text-4xl text-ink"
          style={{ fontFamily: 'Jost_700Bold' }}
        />

        <View className="mb-4 flex-row gap-2">
          {QUICK.map((q) => (
            <Pressable
              key={q}
              accessibilityRole="button"
              accessibilityLabel={`Set amount to ${q}`}
              onPress={() => setValue(String(q))}
              className="flex-1 items-center rounded-full bg-brand-soft py-2.5 active:opacity-70"
            >
              <Text className="text-brand">
                {isAdd ? '+' : '−'}
                {q}
              </Text>
            </Pressable>
          ))}
        </View>

        <BottomSheetTextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note (optional)"
          accessibilityLabel="Note"
          className="mb-5 rounded-2xl border border-ink-muted/60 px-4 py-3 text-base text-ink"
        />

        <Button
          title={isAdd ? 'Add' : 'Minus'}
          variant={isAdd ? 'success' : 'danger'}
          disabled={invalid}
          onPress={submit}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});
