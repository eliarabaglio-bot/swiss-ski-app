import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SeasonBadge } from '../../components/ResortCard';
import { getResort } from '../../data/resorts';
import { DANGER, fetchDangerLevel, SLF_URL, type DangerLevel } from '../../lib/avalanche';
import { useFavorites } from '../../lib/favorites';
import { describeWeather, fetchDetail, type WeatherDetail } from '../../lib/weather';
import { fetchWebcams, windyKey, type Webcam } from '../../lib/webcams';
import { colors, radius, space } from '../../theme';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export default function ResortScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resort = getResort(id);
  const { isFavorite, toggle } = useFavorites();

  const [weather, setWeather] = useState<WeatherDetail | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [danger, setDanger] = useState<DangerLevel | null | undefined>(undefined);
  const [webcams, setWebcams] = useState<Webcam[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!resort) return;
    setLoading(true);
    setWeatherError(null);
    await Promise.all([
      fetchDetail(resort)
        .then(setWeather)
        .catch((e) => setWeatherError(e?.message ?? 'Errore')),
      fetchDangerLevel(resort.lat, resort.lon)
        .then(setDanger)
        .catch(() => setDanger(null)),
      fetchWebcams(resort.lat, resort.lon)
        .then(setWebcams)
        .catch(() => setWebcams([])),
    ]);
    setLoading(false);
  }, [resort]);

  useEffect(() => {
    load();
  }, [load]);

  if (!resort) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Stazione non trovata.</Text>
      </View>
    );
  }

  const fav = isFavorite(resort.id);
  const now = describeWeather(weather?.weatherCode);
  const open = (url: string) => WebBrowser.openBrowserAsync(url);

  return (
    <>
      <Stack.Screen
        options={{
          title: resort.name,
          headerRight: () => (
            <Pressable hitSlop={12} onPress={() => toggle(resort.id)}>
              <Ionicons name={fav ? 'star' : 'star-outline'} size={24} color={fav ? colors.star : colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        {/* Intestazione */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{now.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTemp}>
              {weather?.tempTop != null ? `${Math.round(weather.tempTop)}°` : '—'}
              <Text style={styles.heroTempSub}> in vetta ({resort.topAlt} m)</Text>
            </Text>
            <Text style={styles.heroLabel}>
              {now.label}
              {weather?.tempBase != null ? ` · ${Math.round(weather.tempBase)}° a valle (${resort.baseAlt} m)` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              <SeasonBadge resort={resort} />
              <Text style={styles.muted}>{resort.region}</Text>
            </View>
          </View>
        </View>
        {weatherError ? <Text style={{ color: colors.bad }}>⚠️ {weatherError}</Text> : null}
        {!weather && !weatherError ? <ActivityIndicator color={colors.primary} /> : null}

        {/* Neve */}
        <Section title="❄️ Neve">
          <View style={styles.grid}>
            <Big label="Manto (stima)" value={weather?.snowDepthCm != null ? `${weather.snowDepthCm} cm` : '—'} />
            <Big label="Ultime 24h" value={weather ? `${weather.freshSnow24h} cm` : '—'} />
            <Big label="Prossime 48h" value={weather ? `${weather.forecastSnow48h} cm` : '—'} />
          </View>
          <View style={styles.grid}>
            <Big label="Vento" value={weather?.windKmh != null ? `${Math.round(weather.windKmh)} km/h` : '—'} />
            <Big label="Zero termico" value={weather?.freezingLevel != null ? `${Math.round(weather.freezingLevel)} m` : '—'} />
          </View>
        </Section>

        {/* Previsioni */}
        <Section title="📅 Prossimi 7 giorni (in vetta)">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {weather?.days.map((d, i) => {
              const w = describeWeather(d.code);
              const day = i === 0 ? 'Oggi' : DAY_NAMES[new Date(d.date + 'T12:00:00').getDay()];
              return (
                <View key={d.date} style={styles.day}>
                  <Text style={styles.dayName}>{day}</Text>
                  <Text style={{ fontSize: 24 }}>{w.emoji}</Text>
                  <Text style={styles.dayTemp}>
                    {d.tMax}° / <Text style={styles.muted}>{d.tMin}°</Text>
                  </Text>
                  <Text style={[styles.daySnow, d.snowCm > 0 && { color: colors.primary }]}>
                    {d.snowCm > 0 ? `❄ ${d.snowCm} cm` : '—'}
                  </Text>
                  <Text style={styles.dayMeta}>☀ {d.sunHours}h</Text>
                </View>
              );
            })}
          </ScrollView>
        </Section>

        {/* Valanghe */}
        <Section title="⚠️ Pericolo valanghe">
          {danger === undefined ? (
            <ActivityIndicator color={colors.primary} />
          ) : danger === null ? (
            <Text style={styles.muted}>Nessun bollettino attivo per questa zona (fuori stagione o dato non disponibile).</Text>
          ) : (
            <View style={[styles.danger, { backgroundColor: DANGER[danger].color }]}>
              <Text style={[styles.dangerText, { color: DANGER[danger].text }]}>{DANGER[danger].label}</Text>
            </View>
          )}
          <LinkRow label="Bollettino completo SLF" onPress={() => open(SLF_URL)} />
        </Section>

        {/* Impianti e prezzi */}
        <Section title="🚡 Impianti e prezzi">
          <View style={styles.grid}>
            <Big label="Piste" value={`${resort.pistesKm} km`} />
            <Big label="Impianti" value={`${resort.lifts}`} />
            <Big label="Giornaliera" value={`~CHF ${resort.dayPass}`} />
          </View>
          <Text style={styles.note}>
            {resort.dynamicPricing ? 'Prezzo dinamico: varia in base al giorno e all’anticipo. ' : ''}
            Valori indicativi per il comprensorio. Lo stato in tempo reale degli impianti aperti sarà aggiunto presto.
          </Text>
          <LinkRow label="Impianti aperti e prezzi sul sito ufficiale" onPress={() => open(resort.website)} />
        </Section>

        {/* Webcam */}
        <Section title="📷 Webcam">
          {webcams === null ? (
            <ActivityIndicator color={colors.primary} />
          ) : webcams.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {webcams.map((c) => (
                <Pressable key={c.id} onPress={() => c.playerUrl && open(c.playerUrl)} style={styles.cam}>
                  <Image source={{ uri: c.imageUrl }} style={styles.camImg} />
                  <Text style={styles.camTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.muted}>
              {windyKey()
                ? 'Nessuna webcam trovata nelle vicinanze.'
                : 'Webcam integrate non ancora attive (manca la chiave Windy). Puoi vederle sul sito della stazione.'}
            </Text>
          )}
          <LinkRow label="Webcam sul sito della stazione" onPress={() => open(resort.website)} />
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.big}>
      <Text style={styles.bigValue}>{value}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkRow}>
      <Text style={styles.link}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted, fontSize: 13 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  heroEmoji: { fontSize: 52 },
  heroTemp: { fontSize: 34, fontWeight: '800', color: colors.text },
  heroTempSub: { fontSize: 14, fontWeight: '500', color: colors.muted },
  heroLabel: { fontSize: 14, color: colors.text, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: colors.border, gap: space.sm },
  h2: { fontSize: 16, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', gap: space.sm },
  big: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.sm, padding: space.md, alignItems: 'center' },
  bigValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  bigLabel: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
  day: { width: 76, alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: space.sm, gap: 2 },
  dayName: { fontSize: 12, fontWeight: '700', color: colors.text },
  dayTemp: { fontSize: 13, fontWeight: '700', color: colors.text },
  daySnow: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  dayMeta: { fontSize: 11, color: colors.muted },
  danger: { borderRadius: radius.sm, padding: space.md, alignItems: 'center' },
  dangerText: { fontSize: 18, fontWeight: '800' },
  note: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: space.xs },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  cam: { width: 220 },
  camImg: { width: 220, height: 124, borderRadius: radius.sm, backgroundColor: colors.border },
  camTitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
});
