import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Resort } from '../data/types';
import { useFavorites } from '../lib/favorites';
import { formatUpdated, resortStatus, type StatusKey } from '../lib/format';
import { describeWeather, type WeatherSummary } from '../lib/weather';
import { colors, radius, shadow, space } from '../theme';

/** Colore della barra laterale e dei pallini per ogni stato. */
export const STATUS_ACCENT: Record<StatusKey, string> = {
  open: '#1F9D55',
  lifts: '#7C8DB5',
  stale: '#E09B3D',
  soon: '#1E6FD9',
  closed: '#B7C3CF',
};

export function StatusBadge({ resort }: { resort: Resort }) {
  const s = resortStatus(resort);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: STATUS_ACCENT[s.key] }]} />
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
  const status = resortStatus(resort);
  const w = describeWeather(weather?.weatherCode);
  const fresh = freshSnow(resort, weather);
  const lifts = resort.lifts;
  const price = resort.prices?.adult;
  const isOpen = status.key === 'open';

  return (
    <Link href={{ pathname: '/resort/[id]', params: { id: resort.id } }} asChild>
      <Pressable style={styles.card} android_ripple={{ color: 'rgba(30,111,217,0.08)', borderless: false }}>
        <View style={[styles.accent, { backgroundColor: STATUS_ACCENT[status.key] }]} />
        <View style={styles.body}>
          {/* Intestazione */}
          <View style={styles.headRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {resort.name}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                <Ionicons name="location-outline" size={12} color={colors.muted} /> {resort.place} · {resort.region}
              </Text>
            </View>
            <Pressable
              hitSlop={12}
              onPress={() => toggle(resort)}
              accessibilityLabel={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
              style={[styles.starBtn, fav && styles.starBtnOn]}
            >
              <Ionicons name={fav ? 'star' : 'star-outline'} size={20} color={fav ? colors.star : colors.muted} />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <StatusBadge resort={resort} />
            <Text style={styles.updated} numberOfLines={1}>
              {resort.reportUpdatedAt ? `agg. ${formatUpdated(resort.reportUpdatedAt + '+01:00')}` : 'senza data'}
            </Text>
          </View>

          {/* Dati principali */}
          <View style={styles.tiles}>
            <Tile
              icon="🚡"
              label="Impianti"
              value={lifts ? `${lifts.open}/${lifts.total}` : '—'}
              color={lifts && lifts.open > 0 && isOpen ? colors.good : undefined}
            />
            <Tile icon="🏔️" label="In quota" value={resort.snowTopCm != null ? `${resort.snowTopCm}` : '—'} unit="cm" />
            <Tile
              icon="❄️"
              label="Nuova 24h"
              value={fresh != null ? `${fresh}` : '—'}
              unit="cm"
              color={fresh != null && fresh >= 10 ? colors.primary : undefined}
            />
            <Tile
              icon="🌨️"
              label="In arrivo"
              value={weather ? `${weather.forecastSnow48h}` : '—'}
              unit="cm"
              color={weather && weather.forecastSnow48h >= 20 ? colors.primary : undefined}
            />
          </View>

          {/* Etichette in fondo */}
          <View style={styles.pills}>
            {weather?.temp != null ? (
              <Pill text={`${w.emoji} ${Math.round(weather.temp)}°`} />
            ) : null}
            {resort.pistesKm ? <Pill text={`⛷️ ${resort.pistesKm.open}/${Math.round(resort.pistesKm.total)} km`} /> : null}
            {price != null ? (
              <Pill text={`🎟️ ${resort.prices?.dynamic ? 'da ' : ''}CHF ${price}`} strong />
            ) : resort.prices?.dynamic ? (
              <Pill text="🎟️ prezzo dinamico" />
            ) : null}
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export const ResortCard = memo(ResortCardBase);

function Tile({ icon, label, value, unit, color }: { icon: string; label: string; value: string; unit?: string; color?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={[styles.tileValue, color ? { color } : null]} numberOfLines={1}>
        {value}
        {unit && value !== '—' ? <Text style={styles.tileUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Pill({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <View style={[styles.pill, strong && styles.pillStrong]}>
      <Text style={[styles.pillText, strong && styles.pillTextStrong]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    ...shadow.card,
  },
  accent: { width: 5, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  body: { flex: 1, padding: space.lg, paddingLeft: space.md + 2 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  name: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 3 },
  starBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  starBtnOn: { backgroundColor: '#FFF6D6' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  updated: { fontSize: 11, color: colors.muted, flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  tile: {
    flex: 1,
    backgroundColor: colors.tile,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tileIcon: { fontSize: 15, marginBottom: 2 },
  tileValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  tileUnit: { fontSize: 11, fontWeight: '600', color: colors.muted },
  tileLabel: { fontSize: 10.5, color: colors.muted, marginTop: 1, fontWeight: '600' },
  pills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pill: { backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillStrong: { backgroundColor: colors.primarySoft },
  pillText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  pillTextStrong: { color: colors.primaryDark },
});
