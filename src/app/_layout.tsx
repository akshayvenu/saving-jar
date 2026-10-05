import '../global.css';

// Per-weight imports: the package index requires every weight's .ttf, which would all ship.
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme as nwColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { useJarStore } from '@/store/useJarStore';
import { surface } from '@/theme/colors';

/** Navigation background matches the canvas so screen transitions don't flash white. */
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: surface.DEFAULT, card: surface.DEFAULT },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    ...Icon.font,
  });
  const hasHydrated = useJarStore((s) => s.hasHydrated);
  const ready = fontsLoaded && hasHydrated;

  useEffect(() => {
    nwColorScheme.set('light');
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <BottomSheetModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: surface.DEFAULT },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="jar/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="jar/[id]/edit" options={{ presentation: 'modal' }} />
              <Stack.Screen name="basket/[id]" />
              <Stack.Screen name="baskets" />
              <Stack.Screen name="archive" />
              <Stack.Screen name="settings" />
            </Stack>
            <StatusBar style="dark" />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
