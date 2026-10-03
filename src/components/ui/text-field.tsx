import { forwardRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { ink } from '@/theme/colors';

interface Props extends TextInputProps {
  label: string;
  helper?: string;
  error?: string;
  right?: React.ReactNode;
  className?: string;
}

/** Label above a white block; the outline turns ink while focused. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, helper, error, right, editable = true, className, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const border = error ? 'border-danger' : focused ? 'border-ink' : 'border-surface-line';

  return (
    <View className={className}>
      <Text className="mb-1.5 ml-1 font-medium text-sm text-ink-muted">{label}</Text>
      <View
        className={`min-h-[54px] flex-row items-center rounded-block border-hair bg-surface-card px-4 ${border} ${
          editable ? '' : 'opacity-50'
        }`}
      >
        <TextInput
          ref={ref}
          editable={editable}
          accessibilityLabel={label}
          placeholderTextColor={ink.faint}
          className="flex-1 py-3 font-sans text-base text-ink"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {right}
      </View>
      {error || helper ? (
        <Text className={`ml-1 mt-1 font-sans text-xs ${error ? 'text-danger' : 'text-ink-muted'}`}>
          {error ?? helper}
        </Text>
      ) : null}
    </View>
  );
});
