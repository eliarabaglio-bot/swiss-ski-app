import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Resort } from '../data/types';
import { useFavorites } from '../lib/favorites';
import { formatUpdated, resortStatus } from '../lib/format';
import { describeWeather, type WeatherSummary } from '../lib/weather';
import { colors, radius, space } from '../theme';

export function StatusBadge({ resort }: { resort: Resort }) {
  const s = resortStatus(resort);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export function freshSnow(r: Resort, w?: WeatherSummary): number | null {
  // Preferisci la misura della stazione; se manca, la stima del modello
  if (r.newSnowTopCm != null && r.hasCurrentData) return r.newSnowTopCm;
  return w?.modelSnow24h ?? null;
}

function ResortCardBase({ resort, weather }: { resort: Resort; weather?: WeatherSummary }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(resort);
  const w = describeWeather(weather?.weatherCode);
  const fresh = freshSnow(resort, weather);
  const lifts = resort.lifts;
  const price = resort.prices?.adult;

  return (
    <Link href={{ pathname: '/resort/[id]', params: { id: resort.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {resort.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {resort.place} · {resort.region}
            </Text>
            <Text style={styles.updated} numberOfLines={1}>
              Bollettino: {resort.reportUpdatedAt ? formatUpdated(resort.reportUpdatedAt + '+01:00') : 'senza data'}
            </Text>
          </View>
          <Pressable hitSlop={12} onPress={() => toggle(resort)} accessibilityLabel="Preferito">
            <Ionicons name={fav ? 'star' : 'star-outline'} size={24} color={fav ? colors.star : colors.muted} />
          </Pressable>
        </View>

        <View style={styles.stats}>
          <Stat
            label="Impianti"
            value={lifts ? `${lifts.open}/${lifts.total}` : '—'}
            color={lifts && lifts.open > 0 && resortStatus(resort).key === 'open' ? colors.good : undefined}
          />
          <Stat label="Neve in quota" value={resort.snowTopCm != null ? `${resort.snowTopCm} cm` : '—'} />
          <Stat label="Neve 24h" value={fresh != null ? `${fresh} cm` : '—'} color={fresh != null && fresh >= 10 ? colors.primary : undefined} />
          <Stat
            label="Prev. 48h"
            value={weather ? `${weather.forecastSnow48h} cm` : '—'}
            color={weather && weather.forecastSnow48h >= 20 ? colors.primary : undefined}
          />
        </View>

        <View style={[styles.row, { marginTop: space.sm }]}>
          <StatusBadge resort={resort} />
          <Text style={styles.meta} numberOfLines={1}>
            {weather?.temp != null ? `${w.emoji} ${Math.round(weather.temp)}°  ·  ` : ''}
            {resort.pistesKm ? `${resort.pistesKm.open}/${Math.round(resort.pistesKm.total)} km  ·  ` : ''}
            {price != null ? `CHF ${price}` : resort.prices?.dynamic ? 'prezzo dinamico' : ''}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

export const ResortCard = memo(ResortCardBase);

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.lg,
    marginHorizontal: space.lg,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  updated: { fontSize: 11, color: colors.muted, marginTop: 1 },
  stats: { flexDirection: 'row', marginTop: space.md, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: space.sm },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { flex: 1, textAlign: 'right', fontSize: 12, color: colors.muted },
});
