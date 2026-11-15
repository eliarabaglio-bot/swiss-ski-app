import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import { freshSnow, StatusBadge } from '../../components/ResortCard';
import type { Resort } from '../../data/types';
import { resortStatus } from '../../lib/format';
import { MAP_HTML, type MapPoint } from '../../lib/mapHtml';
import { useStore } from '../../lib/store';
import type { WeatherSummary } from '../../lib/weather';
import { colors, radius, space } from '../../theme';

type Mode = 'stato' | 'neve';

// I tipi di react-native-webview non sono ancora allineati con React 19: usiamo un tipo semplificato
type WebViewHandle = { injectJavaScript: (js: string) => void };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WebView = RNWebView as unknown as React.ComponentType<any>;

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
    [STATUS_COLORS.lifts, 'Impianti aperti, piste n.d.'],
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
  const { resorts, weather, getResort } = useStore();
  const [mode, setMode] = useState<Mode>('stato');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const web = useRef<WebViewHandle>(null);

  const points = useMemo<MapPoint[]>(
    () =>
      resorts
        .filter((r) => r.lat != null && r.lon != null)
        .map((r) => ({ id: r.id, name: r.name, lat: r.lat!, lon: r.lon!, color: colorFor(mode, r, weather[r.id]) })),
    [resorts, weather, mode],
  );

  // invia i punti alla mappa quando cambiano
  useEffect(() => {
    if (!ready) return;
    web.current?.injectJavaScript(
      `window.setPoints(${JSON.stringify(points)}, ${JSON.stringify(selectedId)}); true;`,
    );
    // selectedId non serve come dipendenza: la selezione la gestisce già la mappa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, ready]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') setReady(true);
      if (msg.type === 'select') setSelectedId(msg.id);
    } catch {}
  }, []);

  const selected = selectedId ? getResort(selectedId) : undefined;
  const openResort = (id: string) => router.push({ pathname: '/resort/[id]', params: { id } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <WebView
        ref={web}
        // baseUrl: i server delle cartine vogliono sapere da dove arriva la richiesta
        source={{ html: MAP_HTML, baseUrl: 'https://swiski.app/' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
      />

      <View style={styles.toggle}>
        {(['stato', 'neve'] as Mode[]).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleBtn, mode === m && styles.toggleActive]}>
            <Text style={[styles.toggleText, mode === m && { color: '#fff' }]}>
              {m === 'stato' ? 'Aperte / chiuse' : 'Neve 24h'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.legend} pointerEvents="none">
        {LEGEND[mode].map(([c, l]) => (
          <View key={l} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: c }]} />
            <Text style={styles.legendText}>{l}</Text>
          </View>
        ))}
      </View>

      {selected ? (
        <Pressable style={styles.sheet} onPress={() => openResort(selected.id)}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {selected.name}
            </Text>
            <Text style={styles.sheetSub} numberOfLines={1}>
              {selected.place} · {selected.region}
            </Text>
            <View style={styles.sheetRow}>
              <StatusBadge resort={selected} />
              <Text style={styles.sheetFacts} numberOfLines={1}>
                {selected.lifts ? `${selected.lifts.open}/${selected.lifts.total} impianti` : ''}
                {selected.snowTopCm != null ? ` · ${selected.snowTopCm} cm` : ''}
                {(() => {
                  const f = freshSnow(selected, weather[selected.id]);
                  return f ? ` · +${f} cm` : '';
                })()}
              </Text>
            </View>
            <Text style={styles.sheetLink}>Tocca per aprire la scheda ›</Text>
          </View>
          <Pressable hitSlop={12} onPress={() => setSelectedId(null)} style={styles.sheetClose}>
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </Pressable>
      ) : (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>Tocca un pallino per vedere la stazione · ingrandisci per i nomi</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    top: 64,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.sm,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.text },
  sheet: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 13, color: colors.muted },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sheetFacts: { flex: 1, fontSize: 13, color: colors.text },
  sheetLink: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 2 },
  sheetClose: { paddingLeft: space.sm },
  hint: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,34,51,0.75)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hintText: { color: '#fff', fontSize: 12 },
});
