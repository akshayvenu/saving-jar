import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { formatMoney, formatPercent, formatShortDate } from '@/lib/format';
import { CATEGORY_ICON, daysUntilDeadline, progressOf, remainingOf } from '@/store/selectors';
import { jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

import { JarFill } from './jar-fill';

/** Darker than theme `danger` so it stays legible on every jar colour. */
const OVERDUE = '#C62828';

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
  const bg = jarColors[jar.color];
  const days = daysUntilDeadline(jar);
  const overdue = days != null && days < 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{ backgroundColor: bg }}
      className="mb-4 overflow-hidden rounded-jar border-2 border-ink"
    >
      <JarFill progress={progress} color="rgba(0,0,0,0.16)" />
      <View className="z-10 px-4 pb-2 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            <MaterialCommunityIcons name={CATEGORY_ICON[jar.category]} size={26} color="#1B1B1B" />
            <Text numberOfLines={1} className="flex-1 font-extrabold text-2xl tracking-wide text-ink">
              {jar.name}
            </Text>
          </View>
          {!jar.archived && (
            <IconButton
              icon={jar.pinned ? 'pin' : 'pin-outline'}
              label={jar.pinned ? `Unpin ${jar.name}` : `Pin ${jar.name}`}
              onPress={() => onTogglePin(jar)}
            />
          )}
        </View>

        {jar.account ? (
          <View className="mt-0.5 flex-row items-center justify-center gap-1">
            <MaterialCommunityIcons name="bank-outline" size={16} color="#1B1B1B" />
            <Text numberOfLines={1} className="text-sm text-ink/70">
              {jar.account}
            </Text>
          </View>
        ) : null}

        <Text className="mt-1 text-center text-base tracking-wide text-ink">
          {formatMoney(jar.saved, jar.currency)}
          {jar.goal ? ` / ${formatMoney(jar.goal, jar.currency)} (${formatPercent(progress)})` : ''}
        </Text>
        {remaining != null && (
          <Text className="mt-1 text-center text-base tracking-wide text-ink">
            Remaining: {formatMoney(remaining, jar.currency)}
          </Text>
        )}
        {jar.deadline && days != null && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle deadline details"
              accessibilityState={{ expanded }}
              hitSlop={6}
              onPress={() => setExpanded((v) => !v)}
              className="mt-1 flex-row items-center justify-center gap-1"
            >
              <Text
                style={overdue ? { color: OVERDUE } : undefined}
                className="text-base tracking-wide text-ink"
              >
                Deadline: {formatShortDate(jar.deadline)}
              </Text>
              <MaterialCommunityIcons
                name={expanded ? 'menu-up' : 'menu-down'}
                size={20}
                color={overdue ? OVERDUE : '#1B1B1B'}
              />
            </Pressable>
            {expanded && (
              <View className="mt-0.5 items-center">
                <Text
                  style={overdue ? { color: OVERDUE } : undefined}
                  className="text-base tracking-wide text-ink"
                >
                  {days > 0
                    ? `${days} ${days === 1 ? 'day' : 'days'} left`
                    : days === 0
                      ? 'Due today'
                      : `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`}
                </Text>
                {remaining != null && remaining > 0 && days > 0 && (
                  <>
                    <Text className="text-base tracking-wide text-ink">
                      Save {formatMoney(Math.ceil(remaining / days), jar.currency)}/day
                    </Text>
                    <Text className="text-base tracking-wide text-ink">
                      Save{' '}
                      {formatMoney(
                        Math.min(remaining, Math.ceil((remaining * 7) / days)),
                        jar.currency,
                      )}
                      /week
                    </Text>
                    
                  </>
                )}
                {days >= 0 && remaining == null && (
                  <Text className="text-sm tracking-wide text-ink-muted">
                    Set a goal to see how much to save per day and week
                  </Text>
                )}

              </View>
            )}
          </>
        )}

        <View className="mt-3 flex-row gap-3">
          <Button
            title="Minus"
            variant="danger"
            compact
            className="flex-1 rounded-xl"
            onPress={() => onMinus(jar)}
          />
          <Button
            title="Add"
            variant="success"
            compact
            className="flex-1 rounded-xl"
            onPress={() => onAdd(jar)}
          />
        </View>

        <View className="mt-1 flex-row items-center justify-around">
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
              icon="dots-vertical"
              label={`More options for ${jar.name}`}
              onPress={() => onMore(jar)}
            />
          )}
        </View>
      </View>
    </View>
  );
});
