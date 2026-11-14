import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { typicalSeasonStatus, type Resort } from '../data/resorts';
import { useFavorites } from '../lib/favorites';
import { describeWeather, type WeatherSummary } from '../lib/weather';
import { colors, radius, space } from '../theme';

export function SeasonBadge({ resort }: { resort: Resort }) {
  const inSeason = typicalSeasonStatus(resort) === 'in-stagione';
  return (
    <View style={[styles.badge, { backgroundColor: inSeason ? '#E3F6EA' : '#F1F3F5' }]}>
      <Text style={[styles.badgeText, { color: inSeason ? colors.good : colors.muted }]}>
        {inSeason ? 'In stagione' : 'Fuori stagione'}
      </Text>
    </View>
  );
}

export function ResortCard({ resort, summary }: { resort: Resort; summary?: WeatherSummary }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(resort.id);
  const w = describeWeather(summary?.weatherCode);

  return (
    <Link href={{ pathname: '/resort/[id]', params: { id: resort.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {resort.name}
            </Text>
            <Text style={styles.sub}>
              {resort.region} · {resort.baseAlt}–{resort.topAlt} m
            </Text>
          </View>
          <Pressable hitSlop={12} onPress={() => toggle(resort.id)} accessibilityLabel="Preferito">
            <Ionicons name={fav ? 'star' : 'star-outline'} size={24} color={fav ? colors.star : colors.muted} />
          </Pressable>
        </View>

        <View style={styles.stats}>
          <Stat label="In vetta" value={summary?.tempTop != null ? `${w.emoji} ${Math.round(summary.tempTop)}°` : '—'} />
          <Stat label="Neve 24h" value={summary ? `${summary.freshSnow24h} cm` : '—'} highlight={!!summary && summary.freshSnow24h >= 10} />
          <Stat label="Prev. 48h" value={summary ? `${summary.forecastSnow48h} cm` : '—'} highlight={!!summary && summary.forecastSnow48h >= 20} />
          <Stat label="Manto" value={summary?.snowDepthCm != null ? `${summary.snowDepthCm} cm` : '—'} />
        </View>

        <View style={[styles.row, { marginTop: space.sm }]}>
          <SeasonBadge resort={resort} />
          <Text style={styles.meta}>
            {resort.pistesKm} km · {resort.lifts} impianti · ~CHF {resort.dayPass}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && { color: colors.primary }]}>{value}</Text>
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
  stats: { flexDirection: 'row', marginTop: space.md, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: space.sm },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { flex: 1, textAlign: 'right', fontSize: 12, color: colors.muted },
});
