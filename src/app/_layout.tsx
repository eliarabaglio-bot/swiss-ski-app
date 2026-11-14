import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../lib/favorites';
import { SummariesProvider } from '../lib/summaries';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <SummariesProvider>
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
      </SummariesProvider>
    </FavoritesProvider>
  );
}
