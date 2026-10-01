import '../global.css';

import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
  Jost_700Bold,
  Jost_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/jost';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme as nwColorScheme, useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useJarStore } from '@/store/useJarStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
    Jost_800ExtraBold,
  });
  const themeMode = useJarStore((s) => s.themeMode);
  const hasHydrated = useJarStore((s) => s.hasHydrated);
  const ready = fontsLoaded && hasHydrated;
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    nwColorScheme.set(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const dark = colorScheme === 'dark';
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="jar/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="jar/[id]/edit" options={{ presentation: 'modal' }} />
              <Stack.Screen name="basket/[id]" />
              <Stack.Screen name="baskets" />
              <Stack.Screen name="archive" />
              <Stack.Screen name="settings" />
            </Stack>
            <StatusBar style={dark ? 'light' : 'dark'} />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
