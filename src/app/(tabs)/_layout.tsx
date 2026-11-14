import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'SwiSki', tabBarLabel: 'Stazioni', tabBarIcon: icon('snow') }} />
      <Tabs.Screen name="map" options={{ title: 'Mappa', tabBarIcon: icon('map') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Preferiti', tabBarIcon: icon('star') }} />
      <Tabs.Screen name="info" options={{ title: 'Info', tabBarIcon: icon('information-circle') }} />
    </Tabs>
  );
}
