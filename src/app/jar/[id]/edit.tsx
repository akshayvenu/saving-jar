import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { JarForm } from '@/components/jar/jar-form';
import { Screen } from '@/components/ui/screen';
import { useJarStore } from '@/store/useJarStore';

export default function EditJarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jar = useJarStore((s) => s.jars.find((j) => j.id === id));
  const updateJar = useJarStore((s) => s.updateJar);

  if (!jar) return <Redirect href="/" />;
  return (
    <Screen className="pt-0">
      <JarForm
        title="Edit Jar"
        initial={jar}
        onCancel={() => router.back()}
        onSave={({ category: _fixed, ...patch }) => {
          updateJar(jar.id, patch);
          router.back();
        }}
      />
    </Screen>
  );
}
