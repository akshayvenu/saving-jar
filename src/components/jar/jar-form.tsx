import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ColorField } from '@/components/ui/color-swatches';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { CURRENCIES, formatDate, parseAmount, toMajor } from '@/lib/format';
import { CATEGORY_ORDER, categoryLabel, knownAccounts } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import type { Category, CurrencyCode, Jar, JarColor, JarInput } from '@/types';

interface Props {
  title: string;
  initial?: Jar;
  /** Basket preselected on a new jar. */
  initialBasketId?: string;
  onCancel: () => void;
  onSave: (input: JarInput) => void;
}

export function JarForm({ title, initial, initialBasketId, onCancel, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const baskets = useJarStore((s) => s.baskets);
  const jars = useJarStore((s) => s.jars);
  const hiddenAccounts = useJarStore((s) => s.hiddenAccounts);
  const hideAccount = useJarStore((s) => s.hideAccount);
  const defaultCurrency = useJarStore((s) => s.defaultCurrency);
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [basketId, setBasketId] = useState(initial?.basketId ?? initialBasketId ?? 'none');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'cash');
  const [account, setAccount] = useState(initial?.account ?? '');
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

  const accountChips = useMemo(
    () =>
      knownAccounts(jars).filter(
        (a) =>
          a.toLowerCase() !== account.trim().toLowerCase() &&
          !hiddenAccounts.includes(a.toLowerCase()),
      ),
    [jars, account, hiddenAccounts],
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
      account: account.trim() || undefined,
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

        <SectionLabel>Type & account</SectionLabel>
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
          options={CATEGORY_ORDER.map((c) => ({ value: c, label: categoryLabel(c) }))}
          onChange={setCategory}
          disabled={isEdit}
          helper={isEdit ? 'Category is fixed after creation' : undefined}
          className="mb-4"
        />
        <TextField
          label="Account (Optional)"
          value={account}
          onChangeText={setAccount}
          placeholder="e.g. HDFC, ICICI, Zerodha"
          maxLength={24}
        />
        {accountChips.length > 0 && (
          <View className="mb-4 mt-2 flex-row flex-wrap gap-2">
            {accountChips.map((a) => (
              <View
                key={a}
                className="min-h-[36px] flex-row items-center rounded-full border border-ink-muted/60 pl-3"
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Use account ${a}`}
                  onPress={() => setAccount(a)}
                  className="justify-center py-1.5"
                >
                  <Text className="text-sm text-ink dark:text-ink-dark">{a}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${a} suggestion`}
                  hitSlop={6}
                  onPress={() => hideAccount(a)}
                  className="px-2 py-1.5"
                >
                  <MaterialCommunityIcons name="close" size={16} color="#5F6368" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <SelectField
          className={accountChips.length > 0 ? undefined : 'mt-4'}
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
            // Android: Material 3 modal calendar (needs the M3 app theme plugin)
            design="material"
            title="Select date"
            firstDayOfWeek={1}
            positiveButton={{ label: 'Confirm' }}
            minimumDate={new Date()}
            onValueChange={(_, d) => {
              setShowPicker(Platform.OS === 'ios');
              setDeadline(d);
            }}
            onDismiss={() => setShowPicker(false)}
          />
        )}

        <ColorField className="mt-4" value={color} onChange={setColor} />
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
