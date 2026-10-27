import { useState } from 'react';
import { Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { signInWithGoogle } from '@/lib/google-auth';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = async () => {
    setLoading(true);
    setError(null);
    try {
      // On success the auth listener flips the route guard, so there's nothing to navigate to here.
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <BrandMark size={20} />
        <Text className="mt-4 font-display-bold text-3xl text-ink">Saving Jar</Text>
        <Text className="text-center font-sans text-base text-ink-muted">
          Sign in to start saving. New here? Your account is created automatically.
        </Text>
      </View>
      <View className="gap-3 px-5 pb-12">
        {error && <Text className="text-center font-sans text-sm text-danger">{error}</Text>}
        <Button title="Continue with Google" icon="google" loading={loading} onPress={onPress} />
      </View>
    </Screen>
  );
}
