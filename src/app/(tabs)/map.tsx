import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { freshSnow } from '../../components/ResortCard';
import type { Resort } from '../../data/types';
import { resortStatus } from '../../lib/format';
import { useStore } from '../../lib/store';
import type { WeatherSummary } from '../../lib/weather';
import { colors, radius, space } from '../../theme';

type Mode = 'stato' | 'neve';

const STATUS_COLORS = { open: '#1F9D55', lifts: '#7C8DB5', stale: '#E09B3D', soon: '#1E6FD9', closed: '#9AA9B8' } as const;

function snowColor(cm: number | null) {
  if (cm == null || cm < 1) return '#9AA9B8';
  if (cm >= 20) return '#5B2BD9';
  if (cm >= 10) return '#1E6FD9';
  return '#5FB3F9';
}

function colorFor(mode: Mode, r: Resort, w?: WeatherSummary) {
  return mode === 'stato' ? STATUS_COLORS[resortStatus(r).key] : snowColor(freshSnow(r, w));
}

const LEGEND: Record<Mode, [string, string][]> = {
  stato: [
    [STATUS_COLORS.open, 'Aperta (piste)'],
    [STATUS_COLORS.lifts, 'Solo impianti'],
    [STATUS_COLORS.stale, 'Dati vecchi'],
    [STATUS_COLORS.soon, 'Apre a breve'],
    [STATUS_COLORS.closed, 'Chiusa'],
  ],
  neve: [
    ['#9AA9B8', '0 cm'],
    ['#5FB3F9', '1–9 cm'],
    ['#1E6FD9', '10–19 cm'],
    ['#5B2BD9', '20+ cm'],
  ],
};

export default function MapScreen() {
  const { resorts, weather } = useStore();
  const [mode, setMode] = useState<Mode>('stato');

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: 46.75, longitude: 8.25, latitudeDelta: 2.6, longitudeDelta: 3.6 }}
      >
        {resorts.map((r) => {
          if (r.lat == null || r.lon == null) return null;
          const w = weather[r.id];
          const color = colorFor(mode, r, w);
          const fresh = freshSnow(r, w);
          return (
            <Marker
              key={`${r.id}-${mode}-${color}`}
              coordinate={{ latitude: r.lat, longitude: r.lon }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              {/* Pallino disegnato da noi: su Android i colori dei segnaposto standard non sono affidabili */}
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Callout onPress={() => router.push({ pathname: '/resort/[id]', params: { id: r.id } })}>
                <View style={{ maxWidth: 230 }}>
                  <Text style={styles.calloutTitle}>{r.name}</Text>
                  <Text style={styles.calloutText}>
                    {resortStatus(r).label}
                    {r.lifts ? ` · ${r.lifts.open}/${r.lifts.total} impianti` : ''}
                  </Text>
                  <Text style={styles.calloutText}>
                    {r.snowTopCm != null ? `${r.snowTopCm} cm in quota` : ''}
                    {fresh != null ? ` · ${fresh} cm nuovi` : ''}
                  </Text>
                  <Text style={styles.calloutLink}>Apri scheda ›</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.toggle}>
        {(['stato', 'neve'] as Mode[]).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleBtn, mode === m && styles.toggleActive]}>
            <Text style={[styles.toggleText, mode === m && { color: '#fff' }]}>
              {m === 'stato' ? 'Aperte / chiuse' : 'Neve 24h'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.legend}>
        {LEGEND[mode].map(([c, l]) => (
          <View key={l} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: c }]} />
            <Text style={styles.legendText}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  calloutTitle: { fontWeight: '700', color: colors.text },
  calloutText: { color: colors.muted, marginTop: 2 },
  calloutLink: { color: colors.primary, marginTop: 4, fontWeight: '600' },
  toggle: {
    position: 'absolute',
    top: space.md,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.text },
  legend: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.sm,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.text },
});
