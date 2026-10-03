import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ColorField } from '@/components/ui/color-swatches';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionLabel } from '@/components/ui/section-label';
import { TextField } from '@/components/ui/text-field';
import { useJarStore } from '@/store/useJarStore';
import { ink, jar as jarColors } from '@/theme/colors';
import type { JarColor } from '@/types';

export default function BasketsScreen() {
  const { baskets, jars, addBasket, renameBasket, recolorBasket, deleteBasket } = useJarStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState<JarColor>(
    () => (Object.keys(jarColors) as JarColor[])[baskets.length % 8],
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setEditingId(null);
    setColor((Object.keys(jarColors) as JarColor[])[(baskets.length + 1) % 8]);
  };

  const submit = () => {
    if (!name.trim()) return;
    if (editingId) {
      renameBasket(editingId, name);
      recolorBasket(editingId, color);
    } else addBasket(name, color);
    reset();
  };

  const confirmDelete = (id: string, label: string) =>
    Alert.alert('Delete basket?', `Jars in "${label}" will move to "Unsorted".`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBasket(id) },
    ]);

  return (
    <Screen>
      <ScreenHeader title="Baskets" eyebrow="Manage" />
      <View
        style={{ boxShadow: `4px 4px 0px ${ink.DEFAULT}` }}
        className="mx-5 mb-2 mt-2 gap-4 rounded-jar border-hair border-ink bg-surface-card p-4"
      >
        <TextField
          label={editingId ? 'Rename basket' : 'New basket'}
          value={name}
          onChangeText={setName}
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <ColorField value={color} onChange={setColor} />
        <View className="flex-row gap-3">
          {editingId && (
            <Button title="Cancel" variant="secondary" onPress={reset} className="flex-1" />
          )}
          <Button
            title={editingId ? 'Save basket' : 'Add basket'}
            icon={editingId ? 'check' : 'plus'}
            onPress={submit}
            disabled={!name.trim()}
            className="flex-[2]"
          />
        </View>
      </View>
      <FlatList
        data={baskets}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          baskets.length > 0 ? (
            <View className="px-5">
              <SectionLabel meta={String(baskets.length)}>Your baskets</SectionLabel>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="basket-plus-outline"
            text="Baskets group related jars. Create one above."
          />
        }
        renderItem={({ item }) => (
          <View
            className={`mx-5 mb-2.5 flex-row items-center gap-3 rounded-block border-ink bg-surface-card p-2.5 pl-3 ${
              editingId === item.id ? 'border-2' : 'border-hair'
            }`}
          >
            <View
              style={{ backgroundColor: jarColors[item.color] }}
              className="h-11 w-11 items-center justify-center rounded-2xl border-hair border-ink"
            >
              <MaterialCommunityIcons name="basket-outline" size={20} color={ink.DEFAULT} />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="font-display-semibold text-base text-ink">
                {item.name}
              </Text>
              <Text className="font-sans text-sm text-ink-muted">
                {jars.filter((j) => j.basketId === item.id).length} jars
              </Text>
            </View>
            <IconButton
              icon="pencil-outline"
              label={`Edit ${item.name}`}
              onPress={() => {
                setEditingId(item.id);
                setName(item.name);
                setColor(item.color);
              }}
            />
            <IconButton
              icon="trash-can-outline"
              label={`Delete ${item.name}`}
              onPress={() => confirmDelete(item.id, item.name)}
            />
          </View>
        )}
      />
    </Screen>
  );
}
