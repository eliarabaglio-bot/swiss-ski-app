import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { RESORTS } from '../../data/resorts';
import { useSummaries } from '../../lib/summaries';
import { colors, radius, space } from '../../theme';

// Colore del segnaposto in base alla neve fresca delle ultime 24h.
function pinColor(cm: number | undefined) {
  if (cm == null) return '#9AA9B8';
  if (cm >= 20) return '#5B2BD9';
  if (cm >= 10) return '#1E6FD9';
  if (cm >= 1) return '#5FB3F9';
  return '#9AA9B8';
}

export default function MapScreen() {
  const { data } = useSummaries();

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: 46.75, longitude: 8.25, latitudeDelta: 2.6, longitudeDelta: 3.6 }}
      >
        {RESORTS.map((r) => {
          const s = data[r.id];
          return (
            <Marker key={r.id} coordinate={{ latitude: r.lat, longitude: r.lon }} pinColor={pinColor(s?.freshSnow24h)}>
              <Callout onPress={() => router.push({ pathname: '/resort/[id]', params: { id: r.id } })}>
                <View style={{ maxWidth: 220 }}>
                  <Text style={styles.calloutTitle}>{r.name}</Text>
                  <Text style={styles.calloutText}>
                    {s?.tempTop != null ? `${Math.round(s.tempTop)}° in vetta · ` : ''}
                    {s ? `${s.freshSnow24h} cm nuovi` : ''}
                  </Text>
                  <Text style={styles.calloutLink}>Apri scheda ›</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Neve ultime 24h</Text>
        {[
          ['#9AA9B8', '0 cm'],
          ['#5FB3F9', '1–9 cm'],
          ['#1E6FD9', '10–19 cm'],
          ['#5B2BD9', '20+ cm'],
        ].map(([c, l]) => (
          <View key={l} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: c }]} />
            <Text style={styles.legendText}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calloutTitle: { fontWeight: '700', color: colors.text },
  calloutText: { color: colors.muted, marginTop: 2 },
  calloutLink: { color: colors.primary, marginTop: 4, fontWeight: '600' },
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
  legendTitle: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.text },
});
