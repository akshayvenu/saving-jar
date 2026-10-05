import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ColorField } from '@/components/ui/color-swatches';
import { Hatch } from '@/components/ui/hatch';
import { Icon } from '@/components/ui/icon';
import { SectionLabel } from '@/components/ui/section-label';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { CURRENCIES, formatDate, parseAmount, toMajor } from '@/lib/format';
import { NO_BASKET_LABEL, jarIcon, knownAccounts } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { brand, ink, jar as jarColors } from '@/theme/colors';
import type { CurrencyCode, Jar, JarColor, JarInput } from '@/types';

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
  const [debt, setDebt] = useState(initial?.debt ?? false);
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
      { value: 'none', label: NO_BASKET_LABEL },
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
      debt: debt || undefined,
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
        <View className="mb-6 mt-5 flex-row items-center justify-between">
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-display-bold text-[32px] text-ink">
              {title}
            </Text>
            <Text className="font-sans text-sm text-ink-muted">
              {isEdit ? 'Update the details of this jar' : 'Set aside money for something'}
            </Text>
          </View>
          <View
            style={{ backgroundColor: jarColors[color] }}
            className="h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border-hair border-ink"
          >
            <Hatch gap={6} strokeWidth={1} color="rgba(18,18,18,0.25)" />
            <Icon name={jarIcon({ debt })} size={26} color={ink.DEFAULT} />
          </View>
        </View>

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
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: debt }}
          onPress={() => setDebt((v) => !v)}
          className={`mb-4 min-h-[54px] flex-row items-center gap-3 rounded-block border-hair bg-surface-card px-4 py-3 ${
            debt ? 'border-ink' : 'border-surface-line'
          }`}
        >
          <View className="flex-1">
            <Text className="font-medium text-base text-ink">This is a debt</Text>
            <Text className="font-sans text-sm text-ink-muted">
              Money you owe. Counted as owed, not added to Total saved.
            </Text>
          </View>
          <Icon
            name={debt ? 'toggle-switch' : 'toggle-switch-off-outline'}
            size={40}
            color={debt ? brand.DEFAULT : ink.muted}
          />
        </Pressable>
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
                className="min-h-[36px] flex-row items-center rounded-full border-hair border-ink bg-surface-card pl-3"
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Use account ${a}`}
                  onPress={() => setAccount(a)}
                  className="justify-center py-1.5"
                >
                  <Text className="font-sans text-sm text-ink">{a}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${a} suggestion`}
                  hitSlop={6}
                  onPress={() => hideAccount(a)}
                  className="px-2 py-1.5"
                >
                  <Icon name="close" size={16} color={ink.muted} />
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
            label={debt ? 'Owed' : 'Saved'}
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

        <Text className="mb-1.5 ml-1 mt-4 font-medium text-sm text-ink-muted">
          Deadline (Optional)
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick deadline"
          onPress={() => setShowPicker(true)}
          className="min-h-[54px] flex-row items-center justify-between rounded-block border-hair border-surface-line bg-surface-card px-4 active:border-ink"
        >
          <Text className={`font-sans text-base ${deadline ? 'text-ink' : 'text-ink-faint'}`}>
            {deadline ? formatDate(deadline.toISOString()) : 'No deadline yet'}
          </Text>
          <Icon name="calendar-month-outline" size={22} color={ink.DEFAULT} />
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
        className="flex-row items-center gap-3 border-t-hair border-ink bg-surface px-5 pt-3"
      >
        <Button title="Cancel" variant="secondary" onPress={onCancel} className="flex-1" />
        <Button
          title={isEdit ? 'Save changes' : 'Create jar'}
          onPress={submit}
          className="flex-[2]"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
