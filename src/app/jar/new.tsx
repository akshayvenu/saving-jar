import { router, useLocalSearchParams } from 'expo-router';

import { JarForm } from '@/components/jar/jar-form';
import { Screen } from '@/components/ui/screen';
import { useJarStore } from '@/store/useJarStore';

export default function NewJarScreen() {
  const addJar = useJarStore((s) => s.addJar);
  const { basketId } = useLocalSearchParams<{ basketId?: string }>();
  return (
    <Screen className="pt-0">
      <JarForm
        title="New Jar"
        initialBasketId={basketId}
        onCancel={() => router.back()}
        onSave={(input) => {
          addJar(input);
          router.back();
        }}
      />
    </Screen>
  );
}
