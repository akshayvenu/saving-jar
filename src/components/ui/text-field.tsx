import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  helper?: string;
  error?: string;
  right?: React.ReactNode;
  className?: string;
}

/** Outlined field with the label sitting on the border (Material-style). */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, helper, error, right, editable = true, className, ...rest },
  ref,
) {
  return (
    <View className={className}>
      <View
        className={`min-h-[56px] flex-row items-center rounded-2xl border px-4 ${
          error ? 'border-danger' : 'border-ink-muted/60 dark:border-ink-mutedDark/60'
        } ${editable ? '' : 'opacity-50'}`}
      >
        <Text className="absolute -top-2.5 left-3 bg-surface px-1 text-sm text-ink-muted dark:bg-surface-dark dark:text-ink-mutedDark">
          {label}
        </Text>
        <TextInput
          ref={ref}
          editable={editable}
          accessibilityLabel={label}
          placeholderTextColor="#9AA0A6"
          className="flex-1 py-3 font-sans text-base text-ink dark:text-ink-dark"
          {...rest}
        />
        {right}
      </View>
      {error || helper ? (
        <Text
          className={`ml-2 mt-1 text-xs ${error ? 'text-danger' : 'text-ink-muted dark:text-ink-mutedDark'}`}
        >
          {error ?? helper}
        </Text>
      ) : null}
    </View>
  );
});
