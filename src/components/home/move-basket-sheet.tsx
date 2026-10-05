import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoicePill } from '@/components/ui/pill-grid-sheet';
import { SheetFrame } from '@/components/ui/sheet-frame';
import { TextField } from '@/components/ui/text-field';
import { NO_BASKET_LABEL } from '@/store/selectors';
import { useJarStore } from '@/store/useJarStore';
import { jar as jarColors } from '@/theme/colors';
import type { Jar } from '@/types';

interface Props {
  /** The sheet is open while `jar` is set. */
  jar: Jar | null;
  onClose: () => void;
}

/** Pick a basket for a jar, or create one on the spot (the only way in when none exist). */
export function MoveBasketSheet({ jar, onClose }: Props) {
  const baskets = useJarStore((s) => s.baskets);
  const [name, setName] = useState('');

  const close = () => {
    setName('');
    onClose();
  };

  const moveTo = (basketId: string | null) => {
    if (jar && basketId !== jar.basketId) useJarStore.getState().updateJar(jar.id, { basketId });
    close();
  };

  const create = () => {
    if (!name.trim()) return;
    moveTo(useJarStore.getState().addBasket(name));
  };

  const empty = baskets.length === 0;

  return (
    <Modal visible={!!jar} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={close}
          accessibilityLabel="Close"
        >
          <SheetFrame
            title={jar?.basketId ? 'Move to basket' : 'Add to basket'}
            subtitle={
              empty ? 'No baskets yet — create one for this jar' : (jar?.name ?? undefined)
            }
          >
            {!empty && (
              <View className="mb-4 flex-row flex-wrap justify-between gap-y-2.5">
                {baskets.map((b) => (
                  <ChoicePill
                    key={b.id}
                    label={b.name}
                    color={jarColors[b.color]}
                    selected={jar?.basketId === b.id}
                    onPress={() => moveTo(b.id)}
                  />
                ))}
                {jar?.basketId ? (
                  <ChoicePill
                    label={NO_BASKET_LABEL}
                    color={jarColors.slate}
                    onPress={() => moveTo(null)}
                  />
                ) : null}
              </View>
            )}
            <TextField
              label="New basket"
              value={name}
              onChangeText={setName}
              maxLength={30}
              autoFocus={empty}
              returnKeyType="done"
              onSubmitEditing={create}
              className="mb-3"
            />
            <Button
              title="Create & add"
              icon="plus"
              onPress={create}
              disabled={!name.trim()}
            />
          </SheetFrame>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
