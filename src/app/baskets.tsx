import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useJarStore } from '@/store/useJarStore';

export default function BasketsScreen() {
  const { baskets, jars, addBasket, renameBasket, deleteBasket } = useJarStore();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    if (editingId) renameBasket(editingId, name);
    else addBasket(name);
    setName('');
    setEditingId(null);
  };

  const confirmDelete = (id: string, label: string) =>
    Alert.alert('Delete basket?', `Jars in "${label}" will move to "None".`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBasket(id) },
    ]);

  return (
    <Screen>
      <ScreenHeader title="Baskets" />
      <View className="gap-3 px-5 pb-4 pt-2">
        <TextField
          label={editingId ? 'Rename basket' : 'New basket'}
          value={name}
          onChangeText={setName}
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Button
          title={editingId ? 'Save name' : 'Add basket'}
          onPress={submit}
          disabled={!name.trim()}
        />
      </View>
      <FlatList
        data={baskets}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text className="px-8 pt-10 text-center text-ink-muted dark:text-ink-mutedDark">
            Baskets group related jars. Create one above.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="mx-4 mb-3 flex-row items-center rounded-2xl bg-surface-card p-3 pl-4 dark:bg-surface-cardDark">
            <View className="flex-1">
              <Text className="text-lg text-ink dark:text-ink-dark">{item.name}</Text>
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">
                {jars.filter((j) => j.basketId === item.id).length} jars
              </Text>
            </View>
            <IconButton
              icon="pencil-outline"
              label={`Rename ${item.name}`}
              onPress={() => {
                setEditingId(item.id);
                setName(item.name);
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
