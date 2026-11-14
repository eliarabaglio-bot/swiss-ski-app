import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBadge } from '../../components/ResortCard';
import type { Lift, LiftKind, Resort, Webcam } from '../../data/types';
import { DANGER, fetchDangerLevel, SLF_URL, type DangerLevel } from '../../lib/avalanche';
import { useFavorites } from '../../lib/favorites';
import { formatDate, formatUpdated, isStale, it, KIND_LABEL, KIND_ORDER, MAX_REPORT_AGE_DAYS, peakToday } from '../../lib/format';
import { useStore } from '../../lib/store';
import { describeWeather, fetchDetail, type WeatherDetail } from '../../lib/weather';
import { colors, radius, space } from '../../theme';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const open = (url: string) => WebBrowser.openBrowserAsync(url);

export default function ResortScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getResort } = useStore();
  const resort = getResort(id);
  const { isFavorite, toggle } = useFavorites();

  const [weather, setWeather] = useState<WeatherDetail | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [danger, setDanger] = useState<DangerLevel | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [cam, setCam] = useState<Webcam | null>(null);

  const load = useCallback(async () => {
    if (!resort) return;
    setLoading(true);
    setWeatherError(null);
    await Promise.all([
      fetchDetail(resort)
        .then(setWeather)
        .catch((e) => setWeatherError(e?.message ?? 'Errore')),
      resort.lat != null && resort.lon != null
        ? fetchDangerLevel(resort.lat, resort.lon)
            .then(setDanger)
            .catch(() => setDanger(null))
        : Promise.resolve(setDanger(null)),
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

  const fav = isFavorite(resort);
  const now = describeWeather(weather?.weatherCode);

  return (
    <>
      <Stack.Screen
        options={{
          title: resort.name,
          headerRight: () => (
            <Pressable hitSlop={12} onPress={() => toggle(resort)}>
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
        {resort.image ? <Image source={{ uri: resort.image }} style={styles.cover} /> : null}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{now.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTemp}>
              {weather?.temp != null ? `${Math.round(weather.temp)}°` : '—'}
              <Text style={styles.heroTempSub}>{resort.topAlt ? ` a ${resort.topAlt} m` : ` a ${resort.place}`}</Text>
            </Text>
            <Text style={styles.heroLabel}>
              {now.label}
              {weather?.tempBase != null ? ` · ${Math.round(weather.tempBase)}° a ${resort.baseAlt} m` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm, alignItems: 'center' }}>
              <StatusBadge resort={resort} />
              <Text style={styles.muted}>{resort.region}</Text>
            </View>
          </View>
        </View>
        {weatherError ? <Text style={{ color: colors.bad }}>⚠️ {weatherError}</Text> : null}

        <FreshnessBanner resort={resort} />

        {resort.comments ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>📢 Comunicazione della stazione</Text>
            <Text style={styles.noticeText}>{resort.comments}</Text>
          </View>
        ) : null}

        <LiftsSection resort={resort} />
        <SnowSection resort={resort} weather={weather} />
        <WebcamSection resort={resort} onOpen={setCam} />
        <PricesSection resort={resort} />

        {/* Previsioni */}
        <Section title="📅 Prossimi 7 giorni">
          {!weather && !weatherError ? <ActivityIndicator color={colors.primary} /> : null}
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
          <View style={styles.grid}>
            <Big label="Vento" value={weather?.windKmh != null ? `${Math.round(weather.windKmh)} km/h` : '—'} />
            <Big label="Zero termico" value={weather?.freezingLevel != null ? `${Math.round(weather.freezingLevel)} m` : '—'} />
          </View>
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

        <Section title="ℹ️ Info">
          <Row label="Orari impianti" value={resort.openFrom ? `${resort.openFrom} – ${resort.openUntil ?? '?'}` : '—'} />
          <Row label="Stagione" value={`${formatDate(resort.seasonStart, true)} – ${formatDate(resort.seasonEnd, true)}`} />
          <Row label="Bollettino aggiornato" value={resort.reportUpdatedAt ? formatUpdated(resort.reportUpdatedAt + '+01:00') : 'senza data'} />
          {resort.website ? <LinkRow label="Sito ufficiale" onPress={() => open(resort.website!)} /> : null}
          <LinkRow label="Bollettino completo su MySwitzerland" onPress={() => open(resort.url)} />
        </Section>
      </ScrollView>

      <WebcamViewer cam={cam} onClose={() => setCam(null)} />
    </>
  );
}

// ---------- Affidabilità ----------

function FreshnessBanner({ resort }: { resort: Resort }) {
  const when = resort.reportUpdatedAt ? formatUpdated(resort.reportUpdatedAt + '+01:00') : null;
  const peak = peakToday(resort);
  if (isStale(resort)) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>⚠️ Dati probabilmente non aggiornati</Text>
        <Text style={styles.noticeText}>
          {when
            ? `La stazione ha aggiornato il bollettino l'ultima volta il ${when} (più di ${MAX_REPORT_AGE_DAYS} giorni fa).`
            : 'La stazione non fornisce dati aggiornati.'}{' '}
          Impianti e piste aperti potrebbero essere diversi: controlla sul sito ufficiale.
        </Text>
        {resort.website ? <LinkRow label="Sito ufficiale" onPress={() => open(resort.website!)} /> : null}
      </View>
    );
  }
  return (
    <View style={styles.fresh}>
      <Text style={styles.freshText}>
        ✓ Bollettino della stazione aggiornato il {when}
        {peak ? `\nOggi erano aperti fino a ${peak.lifts} impianti e ${peak.pistesKm} km di piste.` : ''}
      </Text>
    </View>
  );
}

// ---------- Impianti ----------

function LiftsSection({ resort }: { resort: Resort }) {
  const [showAll, setShowAll] = useState(false);
  const groups = useMemo(() => {
    const m = new Map<LiftKind, Lift[]>();
    for (const l of resort.liftList) m.set(l.kind, [...(m.get(l.kind) ?? []), l]);
    return KIND_ORDER.filter((k) => m.has(k)).map((k) => ({ kind: k, lifts: m.get(k)! }));
  }, [resort.liftList]);

  return (
    <Section title="🚡 Impianti e piste">
      <View style={styles.grid}>
        <Big
          label="Impianti aperti"
          value={resort.lifts ? `${resort.lifts.open}/${resort.lifts.total}` : '—'}
          color={resort.lifts && resort.lifts.open > 0 ? colors.good : undefined}
        />
        <Big label="Piste aperte" value={resort.pistesKm ? `${resort.pistesKm.open}/${Math.round(resort.pistesKm.total)} km` : '—'} />
        <Big label="Discese a valle" value={resort.runsToValley ? `${resort.runsToValley.open}/${resort.runsToValley.total}` : '—'} />
      </View>

      {groups.length ? (
        <>
          <View style={{ gap: 6 }}>
            {groups.map(({ kind, lifts }) => {
              const o = lifts.filter((l) => l.status === 'open').length;
              return (
                <View key={kind} style={styles.kindRow}>
                  <Text style={styles.kindLabel}>
                    {KIND_LABEL[kind].icon} {KIND_LABEL[kind].many}
                  </Text>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${(o / lifts.length) * 100}%` }]} />
                  </View>
                  <Text style={[styles.kindValue, o > 0 && { color: colors.good }]}>
                    {o}/{lifts.length}
                  </Text>
                </View>
              );
            })}
          </View>
          <Pressable onPress={() => setShowAll((v) => !v)} style={styles.linkRow}>
            <Text style={styles.link}>{showAll ? 'Nascondi elenco' : `Mostra tutti i ${resort.liftList.length} impianti`}</Text>
            <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
          </Pressable>
          {showAll
            ? resort.liftList.map((l, i) => (
                <View key={`${l.name}-${i}`} style={styles.liftRow}>
                  <View
                    style={[
                      styles.liftDot,
                      { backgroundColor: l.status === 'open' ? colors.good : l.status === 'closed' ? colors.bad : '#C5CED6' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liftName}>{l.name}</Text>
                    <Text style={styles.liftType}>
                      {KIND_LABEL[l.kind].one}
                      {/(\d) persons/.test(l.type) ? ` · ${l.type.match(/(\d) persons/)![1]} posti` : ''}
                    </Text>
                  </View>
                  <Text style={styles.liftStatus}>
                    {l.status === 'open' ? 'Aperto' : l.status === 'closed' ? 'Chiuso' : l.status === 'partial' ? 'Parziale' : 'n.d.'}
                  </Text>
                </View>
              ))
            : null}
        </>
      ) : (
        <Text style={styles.note}>
          La stazione non pubblica l'elenco dei singoli impianti. I dettagli sono sul sito ufficiale.
        </Text>
      )}
      {resort.pistesKm && resort.pistesKm.open > 0 && resort.lifts?.open === 0 ? (
        <Text style={styles.note}>
          ⚠️ La stazione indica piste aperte ma nessun impianto: il dato sulle piste è probabilmente vecchio.
        </Text>
      ) : null}
      {groups.length && resort.lifts && resort.liftList.filter((l) => l.status === 'open').length !== resort.lifts.open ? (
        <Text style={styles.note}>
          ⚠️ L'elenco dei singoli impianti non coincide con il totale comunicato dalla stazione: potrebbe non essere aggiornato.
        </Text>
      ) : null}
      <Row label="Condizioni piste" value={it(resort.slopeCondition)} />
      {!resort.hasCurrentData ? (
        <Text style={styles.note}>⚠️ La stazione al momento non fornisce dati aggiornati: verifica sul sito ufficiale.</Text>
      ) : null}
    </Section>
  );
}

// ---------- Neve ----------

function SnowSection({ resort, weather }: { resort: Resort; weather: WeatherDetail | null }) {
  return (
    <Section title="❄️ Neve">
      <View style={styles.grid}>
        <Big label={resort.topAlt ? `In quota (${resort.topAlt} m)` : 'In quota'} value={resort.snowTopCm != null ? `${resort.snowTopCm} cm` : '—'} />
        <Big label={resort.baseAlt ? `In paese (${resort.baseAlt} m)` : 'In paese'} value={resort.snowBaseCm != null ? `${resort.snowBaseCm} cm` : '—'} />
      </View>
      <View style={styles.grid}>
        <Big
          label="Nuova (24h)"
          value={resort.newSnowTopCm != null ? `${resort.newSnowTopCm} cm` : weather ? `~${weather.modelSnow24h} cm` : '—'}
        />
        <Big label="In arrivo (48h)" value={weather ? `${weather.forecastSnow48h} cm` : '—'} color={colors.primary} />
      </View>
      <Row label="Qualità neve" value={it(resort.snowCondition)} />
      <Row label="Ultima nevicata" value={it(resort.lastSnowfall)} />
      <Text style={styles.note}>Neve misurata dalla stazione. "In arrivo" è una previsione dei modelli meteo.</Text>
    </Section>
  );
}

// ---------- Webcam ----------

function WebcamSection({ resort, onOpen }: { resort: Resort; onOpen: (c: Webcam) => void }) {
  const cams = resort.webcams ?? [];
  // per non usare immagini vecchie dalla cache: cambia ogni 10 minuti
  const bust = Math.floor(Date.now() / 600000);
  return (
    <Section title="📷 Webcam">
      {cams.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {cams.map((c) => (
            <Pressable key={c.id} onPress={() => onOpen(c)} style={styles.cam}>
              <Image source={{ uri: `${c.image}?v=${bust}` }} style={styles.camImg} />
              <Text style={styles.camTitle} numberOfLines={1}>
                {c.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.muted}>Nessuna webcam trovata vicino a questa stazione.</Text>
      )}
    </Section>
  );
}

function WebcamViewer({ cam, onClose }: { cam: Webcam | null; onClose: () => void }) {
  const bust = Math.floor(Date.now() / 600000);
  const [aspect, setAspect] = useState(16 / 9);
  useEffect(() => {
    if (!cam) return;
    Image.getSize(
      `${cam.full}?v=${bust}`,
      (w, h) => h > 0 && setAspect(w / h),
      () => setAspect(16 / 9),
    );
  }, [cam, bust]);
  return (
    <Modal visible={!!cam} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.viewer}>
        {cam ? (
          <>
            {/* Panorama: si scorre in orizzontale */}
            <ScrollView horizontal contentContainerStyle={{ alignItems: 'center' }}>
              <Image source={{ uri: `${cam.full}?v=${bust}` }} style={[styles.viewerImg, { aspectRatio: aspect }]} resizeMode="contain" />
            </ScrollView>
            <View style={styles.viewerBar}>
              <Text style={styles.viewerTitle} numberOfLines={2}>
                {cam.title}
              </Text>
              {cam.player ? (
                <Pressable onPress={() => open(cam.player!)} style={styles.viewerBtn}>
                  <Text style={styles.viewerBtnText}>Live / 360°</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onClose} style={styles.viewerBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

// ---------- Prezzi ----------

function PricesSection({ resort }: { resort: Resort }) {
  const p = resort.prices;
  const fmt = (v: number | null | undefined) => (v != null ? `CHF ${v}` : '—');
  return (
    <Section title="🎟️ Giornaliera">
      {p && (p.adult != null || p.child != null) ? (
        <View style={styles.grid}>
          <Big label="Adulti" value={fmt(p.adult)} />
          <Big label="Ragazzi" value={fmt(p.youth)} />
          <Big label="Bambini" value={fmt(p.child)} />
        </View>
      ) : null}
      <Text style={styles.note}>
        {p?.dynamic
          ? `Prezzi dinamici: cambiano in base al giorno e a quanto in anticipo acquisti${p.adult != null ? ' (indicato il prezzo "a partire da")' : ''}.`
          : p
            ? 'Prezzi pubblicati dalla stazione.'
            : 'La stazione non ha pubblicato i prezzi.'}
      </Text>
      {resort.website ? <LinkRow label="Biglietti sul sito ufficiale" onPress={() => open(resort.website!)} /> : null}
    </Section>
  );
}

// ---------- componenti base ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

function Big({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.big}>
      <Text style={[styles.bigValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  cover: { width: '100%', height: 170, borderRadius: radius.lg, backgroundColor: colors.border },
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
  notice: { backgroundColor: '#FFF7E6', borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: '#F5D9A3' },
  noticeTitle: { fontWeight: '700', color: '#8A5A00', marginBottom: 4 },
  noticeText: { color: '#5C4300', fontSize: 13, lineHeight: 18 },
  fresh: { backgroundColor: '#E9F7EF', borderRadius: radius.md, padding: space.md },
  freshText: { color: '#1F6B40', fontSize: 13, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: colors.border, gap: space.sm },
  h2: { fontSize: 16, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', gap: space.sm },
  big: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.sm, padding: space.md, alignItems: 'center' },
  bigValue: { fontSize: 17, fontWeight: '800', color: colors.text },
  bigLabel: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kindLabel: { width: 150, fontSize: 13, color: colors.text },
  bar: { flex: 1, height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.good },
  kindValue: { width: 44, textAlign: 'right', fontWeight: '700', color: colors.text },
  liftRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.bg },
  liftDot: { width: 10, height: 10, borderRadius: 5 },
  liftName: { fontSize: 14, color: colors.text },
  liftType: { fontSize: 11, color: colors.muted },
  liftStatus: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
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
  cam: { width: 240 },
  camImg: { width: 240, height: 135, borderRadius: radius.sm, backgroundColor: colors.border },
  camTitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
  viewer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  viewerImg: { height: 420 },
  viewerBar: { position: 'absolute', top: 48, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  viewerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },
  viewerBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  viewerBtnText: { color: '#fff', fontWeight: '700' },
});
