import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { CURRENCIES, formatDate, parseAmount, toMajor } from '@/lib/format';
import { useJarStore } from '@/store/useJarStore';
import { jar as jarColors } from '@/theme/colors';
import type { Category, CurrencyCode, Jar, JarColor, JarInput } from '@/types';

interface Props {
  title: string;
  initial?: Jar;
  /** Basket preselected on a new jar. */
  initialBasketId?: string;
  onCancel: () => void;
  onSave: (input: JarInput) => void;
}

const COLORS = Object.keys(jarColors) as JarColor[];

export function JarForm({ title, initial, initialBasketId, onCancel, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const baskets = useJarStore((s) => s.baskets);
  const defaultCurrency = useJarStore((s) => s.defaultCurrency);
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [basketId, setBasketId] = useState(initial?.basketId ?? initialBasketId ?? 'none');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'cash');
  const [currency, setCurrency] = useState<CurrencyCode>(initial?.currency ?? defaultCurrency);
  const [saved, setSaved] = useState(initial ? String(toMajor(initial.saved)) : '');
  const [goal, setGoal] = useState(initial?.goal ? String(toMajor(initial.goal)) : '');
  const [deadline, setDeadline] = useState<Date | null>(
    initial?.deadline ? new Date(initial.deadline) : null,
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const [color, setColor] = useState<JarColor>(initial?.color ?? 'peach');
  const [showPicker, setShowPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const basketOptions = useMemo(
    () => [
      { value: 'none', label: 'None' },
      ...baskets.map((b) => ({ value: b.id, label: b.name })),
    ],
    [baskets],
  );

  const savedMinor = saved.trim() === '' ? 0 : parseAmount(saved);
  const goalMinor = goal.trim() === '' ? null : parseAmount(goal);
  const errors = {
    name: name.trim() ? undefined : 'Give your jar a name',
    saved: savedMinor == null ? 'Enter a valid amount' : undefined,
    goal:
      goal.trim() !== '' && (goalMinor == null || goalMinor <= 0)
        ? 'Enter a valid goal'
        : undefined,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setSubmitted(true);
    if (hasError) return;
    onSave({
      name: name.trim(),
      basketId: basketId === 'none' ? null : basketId,
      category,
      currency,
      saved: savedMinor ?? 0,
      goal: goalMinor,
      note: note.trim() || undefined,
      deadline: deadline?.toISOString(),
      color,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Text
          accessibilityRole="header"
          className="mb-6 mt-4 font-bold text-3xl text-ink dark:text-ink-dark"
        >
          {title}
        </Text>

        <TextField
          label="Jar name"
          value={name}
          onChangeText={setName}
          maxLength={40}
          error={submitted ? errors.name : undefined}
        />

        <SectionLabel>Category & unit</SectionLabel>
        <SelectField
          label="Basket"
          value={basketId}
          options={basketOptions}
          onChange={setBasketId}
          className="mb-4"
        />
        <SelectField
          label="Category"
          value={category}
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'cash_debt', label: 'Cash Debt' },
          ]}
          onChange={setCategory}
          disabled={isEdit}
          helper={isEdit ? 'Category is fixed after creation' : undefined}
          className="mb-4"
        />
        <SelectField
          label="Currency"
          value={currency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          onChange={setCurrency}
        />

        <SectionLabel>Amounts</SectionLabel>
        <View className="flex-row gap-4">
          <TextField
            className="flex-1"
            label="Saved"
            value={saved}
            onChangeText={setSaved}
            keyboardType="decimal-pad"
            placeholder="0"
            error={submitted ? errors.saved : undefined}
          />
          <TextField
            className="flex-1"
            label="Goal (Optional)"
            value={goal}
            onChangeText={setGoal}
            keyboardType="decimal-pad"
            placeholder="None"
            error={submitted ? errors.goal : undefined}
          />
        </View>

        <TextField
          className="mt-4"
          label="Note (Optional)"
          value={note}
          onChangeText={setNote}
          maxLength={120}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick deadline"
          onPress={() => setShowPicker(true)}
          className="mt-4 min-h-[56px] flex-row items-center justify-between rounded-2xl border border-ink-muted/60 px-4 active:bg-black/5"
        >
          <Text className="text-base text-ink dark:text-ink-dark">
            {deadline ? formatDate(deadline.toISOString()) : 'No deadline yet (Optional)'}
          </Text>
          <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#5F6368" />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={deadline ?? new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, d) => {
              setShowPicker(Platform.OS === 'ios');
              if (d) setDeadline(d);
            }}
          />
        )}

        <SectionLabel>Color</SectionLabel>
        <View className="flex-row flex-wrap gap-3">
          {COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityLabel={`Color ${c}`}
              accessibilityState={{ selected: c === color }}
              onPress={() => setColor(c)}
              style={{ backgroundColor: jarColors[c] }}
              className={`h-11 w-11 items-center justify-center rounded-full border-2 ${c === color ? 'border-ink' : 'border-transparent'}`}
            >
              {c === color && <MaterialCommunityIcons name="check" size={20} color="#1B1B1B" />}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="flex-row items-center justify-end gap-3 border-t border-black/10 px-5 pt-3"
      >
        <Button title="Cancel" variant="ghost" onPress={onCancel} />
        <Button title="Save" onPress={submit} className="min-w-[120px]" />
      </View>
    </KeyboardAvoidingView>
  );
}
