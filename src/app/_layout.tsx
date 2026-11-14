import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../lib/favorites';
import { StoreProvider } from '../lib/store';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="resort/[id]" options={{ title: '', headerBackTitle: 'Indietro' }} />
        </Stack>
      </StoreProvider>
    </FavoritesProvider>
  );
}
