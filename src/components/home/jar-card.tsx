import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { formatMoney, formatPercent, formatShortDate } from '@/lib/format';
import { CATEGORY_ICON, daysUntilDeadline, progressOf, remainingOf } from '@/store/selectors';
import { ink, jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

import { JarFill } from './jar-fill';

const CARD_SHADOW = `4px 4px 0px ${ink.DEFAULT}`;

interface Props {
  jar: Jar;
  onAdd: (jar: Jar) => void;
  onMinus: (jar: Jar) => void;
  onEdit: (jar: Jar) => void;
  onDelete: (jar: Jar) => void;
  onHistory: (jar: Jar) => void;
  onTogglePin: (jar: Jar) => void;
  onToggleArchive: (jar: Jar) => void;
  onMore: (jar: Jar) => void;
}

function daysLabel(days: number) {
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} left`;
  if (days === 0) return 'Due today';
  return `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`;
}

export const JarCard = memo(function JarCard({
  jar,
  onAdd,
  onMinus,
  onEdit,
  onDelete,
  onHistory,
  onTogglePin,
  onToggleArchive,
  onMore,
}: Props) {
  const progress = progressOf(jar);
  const remaining = remainingOf(jar);
  const days = daysUntilDeadline(jar);
  const overdue = days != null && days < 0;
  const [expanded, setExpanded] = useState(false);

  return (
    // Shadow lives on the outer view so the inner `overflow-hidden` can't clip it.
    <View style={{ boxShadow: CARD_SHADOW }} className="mb-5 rounded-jar">
      <View
        style={{ backgroundColor: jarColors[jar.color] }}
        className="overflow-hidden rounded-jar border-hair border-ink"
      >
        <JarFill progress={progress} color="rgba(18,18,18,0.05)" lineColor="rgba(18,18,18,0.22)" />

        <View className="z-10 p-4">
          {/* Identity */}
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl border-hair border-ink bg-surface-card">
              <MaterialCommunityIcons
                name={CATEGORY_ICON[jar.category]}
                size={22}
                color={ink.DEFAULT}
              />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="font-display-semibold text-xl text-ink">
                {jar.name}
              </Text>
              {jar.account ? (
                <View className="flex-row items-center gap-1">
                  <MaterialCommunityIcons name="bank-outline" size={13} color={ink.muted} />
                  <Text numberOfLines={1} className="font-sans text-sm text-ink/70">
                    {jar.account}
                  </Text>
                </View>
              ) : null}
            </View>
            {!jar.archived && (
              <IconButton
                variant={jar.pinned ? 'ink' : 'card'}
                size={18}
                icon={jar.pinned ? 'pin' : 'pin-outline'}
                label={jar.pinned ? `Unpin ${jar.name}` : `Pin ${jar.name}`}
                onPress={() => onTogglePin(jar)}
              />
            )}
          </View>

          {/* Balance */}
          <View className="mt-4 flex-row items-end justify-between gap-3">
            <View className="flex-1">
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="font-display-bold text-[34px] leading-[40px] tracking-tight text-ink"
              >
                {formatMoney(jar.saved, jar.currency)}
              </Text>
              <Text className="font-sans text-sm text-ink/70">
                {jar.goal ? `of ${formatMoney(jar.goal, jar.currency)} goal` : 'No goal set'}
              </Text>
            </View>
            {jar.goal ? (
              <View className="mb-1 rounded-full bg-ink px-3 py-1">
                <Text className="font-display-semibold text-sm text-white">
                  {formatPercent(progress)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Chips */}
          {(remaining != null || (jar.deadline && days != null)) && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {remaining != null && (
                <View className="flex-row items-center gap-1.5 rounded-full border-hair border-ink bg-surface-card px-3 py-1.5">
                  <MaterialCommunityIcons name="flag-checkered" size={14} color={ink.DEFAULT} />
                  <Text className="font-sans text-sm text-ink">
                    {remaining === 0
                      ? 'Goal reached'
                      : `${formatMoney(remaining, jar.currency)} to go`}
                  </Text>
                </View>
              )}
              {jar.deadline && days != null && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Toggle deadline details"
                  accessibilityState={{ expanded }}
                  hitSlop={6}
                  onPress={() => setExpanded((v) => !v)}
                  className={`flex-row items-center gap-1.5 rounded-full border-hair border-ink px-3 py-1.5 ${
                    overdue ? 'bg-danger' : 'bg-surface-card'
                  }`}
                >
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={14}
                    color={overdue ? '#FFFFFF' : ink.DEFAULT}
                  />
                  <Text className={`font-sans text-sm ${overdue ? 'text-white' : 'text-ink'}`}>
                    {formatShortDate(jar.deadline)}
                  </Text>
                  <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={overdue ? '#FFFFFF' : ink.DEFAULT}
                  />
                </Pressable>
              )}
            </View>
          )}

          {expanded && jar.deadline && days != null && (
            <View className="mt-2 rounded-2xl border-hair border-ink bg-surface-card p-3">
              <Text
                className={`font-display-semibold text-base ${overdue ? 'text-danger' : 'text-ink'}`}
              >
                {daysLabel(days)}
              </Text>
              {remaining != null && remaining > 0 && days > 0 && (
                <View className="mt-2 flex-row gap-2">
                  <PlanStat
                    label="per day"
                    value={formatMoney(Math.ceil(remaining / days), jar.currency)}
                  />
                  <PlanStat
                    label="per week"
                    value={formatMoney(
                      Math.min(remaining, Math.ceil((remaining * 7) / days)),
                      jar.currency,
                    )}
                  />
                </View>
              )}
              {days >= 0 && remaining == null && (
                <Text className="mt-1 font-sans text-sm text-ink-muted">
                  Set a goal to see how much to save per day and week
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View className="mt-4 flex-row gap-3">
            <Button
              title="Take out"
              icon="arrow-top-right"
              variant="secondary"
              compact
              className="flex-1"
              onPress={() => onMinus(jar)}
            />
            <Button
              title="Add"
              icon="arrow-bottom-left"
              compact
              className="flex-1"
              onPress={() => onAdd(jar)}
            />
          </View>

          <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-surface-card/70 px-1">
            <IconButton
              icon="pencil-outline"
              label={`Edit ${jar.name}`}
              onPress={() => onEdit(jar)}
            />
            <IconButton
              icon={jar.archived ? 'tray-arrow-up' : 'tray-arrow-down'}
              label={jar.archived ? `Unarchive ${jar.name}` : `Archive ${jar.name}`}
              onPress={() => onToggleArchive(jar)}
            />
            <IconButton
              icon="trash-can-outline"
              label={`Delete ${jar.name}`}
              onPress={() => onDelete(jar)}
            />
            <IconButton
              icon="history"
              label={`History of ${jar.name}`}
              onPress={() => onHistory(jar)}
            />
            {!jar.archived && (
              <IconButton
                icon="dots-horizontal"
                label={`More options for ${jar.name}`}
                onPress={() => onMore(jar)}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-surface px-3 py-2">
      <Text className="font-display-semibold text-base text-ink">{value}</Text>
      <Text className="font-sans text-xs text-ink-muted">{label}</Text>
    </View>
  );
}
