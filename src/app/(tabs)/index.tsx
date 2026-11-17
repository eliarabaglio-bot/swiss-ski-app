import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { freshSnow, ResortCard } from '../../components/ResortCard';
import { formatUpdated, resortStatus, type StatusKey } from '../../lib/format';
import { useStore } from '../../lib/store';
import { colors, radius, shadow, space } from '../../theme';

type Sort = 'aperti' | 'neve' | 'fresca' | 'previsione' | 'prezzo' | 'nome';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'aperti', label: 'Impianti aperti' },
  { key: 'neve', label: 'Neve in quota' },
  { key: 'fresca', label: 'Neve fresca' },
  { key: 'previsione', label: 'Neve in arrivo' },
  { key: 'prezzo', label: 'Prezzo' },
  { key: 'nome', label: 'A–Z' },
];

type StatusFilter = 'tutte' | 'aperte';

const STATUS_RANK: Record<StatusKey, number> = { open: 0, lifts: 1, stale: 2, soon: 3, closed: 4 };

export default function ResortsScreen() {
  const { resorts, weather, loading, error, dataUpdatedAt, refresh } = useStore();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('tutte');
  const [sort, setSort] = useState<Sort>('aperti');

  const regions = useMemo(
    () => [...new Set(resorts.map((r) => r.region))].sort((a, b) => a.localeCompare(b, 'it')),
    [resorts],
  );
  const openCount = useMemo(() => resorts.filter((r) => resortStatus(r).key === 'open').length, [resorts]);
  const freshCount = useMemo(
    () => resorts.filter((r) => (freshSnow(r, weather[r.id]) ?? 0) >= 5).length,
    [resorts, weather],
  );
  const comingCount = useMemo(
    () => resorts.filter((r) => (weather[r.id]?.forecastSnow48h ?? 0) >= 10).length,
    [resorts, weather],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = resorts.filter(
      (r) =>
        (!region || r.region === region) &&
        (status === 'tutte' || resortStatus(r).key === 'open') &&
        (!q || [r.name, r.place, ...(r.otherNames ?? [])].some((t) => t.toLowerCase().includes(q))),
    );
    const byName = (a: (typeof resorts)[0], b: (typeof resorts)[0]) => a.name.localeCompare(b.name, 'it');
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'aperti':
          // prima le stazioni aperte, poi solo impianti, dati vecchi, in apertura, chiuse
          return (
            STATUS_RANK[resortStatus(a).key] - STATUS_RANK[resortStatus(b).key] ||
            (b.lifts?.open ?? -1) - (a.lifts?.open ?? -1) ||
            (b.lifts?.total ?? 0) - (a.lifts?.total ?? 0)
          );
        case 'neve':
          return (b.snowTopCm ?? -1) - (a.snowTopCm ?? -1) || byName(a, b);
        case 'fresca':
          return (freshSnow(b, weather[b.id]) ?? -1) - (freshSnow(a, weather[a.id]) ?? -1) || byName(a, b);
        case 'previsione':
          return (weather[b.id]?.forecastSnow48h ?? -1) - (weather[a.id]?.forecastSnow48h ?? -1) || byName(a, b);
        case 'prezzo':
          return (a.prices?.adult ?? 9999) - (b.prices?.adult ?? 9999) || byName(a, b);
        default:
          return byName(a, b);
      }
    });
  }, [resorts, weather, query, region, status, sort]);

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <ResortCard resort={item} weather={weather[item.id]} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ paddingTop: space.md }}>
          {/* Riepilogo del giorno */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Oggi in Svizzera</Text>
            <Text style={styles.heroSub}>Impianti aggiornati il {formatUpdated(dataUpdatedAt)}</Text>
            <View style={styles.kpis}>
              <Kpi value={openCount} label="aperte" icon="🟢" onPress={() => setStatus('aperte')} />
              <Kpi value={freshCount} label="con neve fresca" icon="❄️" onPress={() => setSort('fresca')} />
              <Kpi value={comingCount} label="neve in arrivo" icon="🌨️" onPress={() => setSort('previsione')} />
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cerca una stazione o località…"
              placeholderTextColor={colors.muted}
              style={styles.search}
              clearButtonMode="while-editing"
            />
            {query ? (
              <Pressable hitSlop={10} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          <Chips
            items={[
              { key: 'tutte' as StatusFilter, label: `Tutte · ${resorts.length}` },
              { key: 'aperte' as StatusFilter, label: `Aperte oggi · ${openCount}` },
            ]}
            value={status}
            onChange={setStatus}
          />
          <Chips items={[{ key: null, label: 'Tutte le regioni' }, ...regions.map((r) => ({ key: r, label: r }))]} value={region} onChange={setRegion} />
          <Chips items={SORTS} value={sort} onChange={setSort} prefix="Ordina" subtle />
          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
          <Text style={styles.count}>{list.length} stazioni</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nessuna stazione trovata.</Text>}
    />
  );
}

function Kpi({ value, label, icon, onPress }: { value: number; label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.kpi, pressed && { opacity: 0.8 }]}>
      <Text style={styles.kpiValue}>
        {icon} {value}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Pressable>
  );
}

function Chips<T>({
  items,
  value,
  onChange,
  prefix,
  subtle,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  prefix?: string;
  subtle?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {prefix ? <Text style={styles.chipPrefix}>{prefix}</Text> : null}
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={String(it.key)}
            onPress={() => onChange(it.key)}
            style={[
              styles.chip,
              subtle && styles.chipSubtle,
              active && (subtle ? styles.chipSubtleActive : styles.chipActive),
            ]}
          >
            <Text style={[styles.chipText, active && (subtle ? styles.chipSubtleTextActive : styles.chipTextActive)]}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: space.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadow.card,
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  kpis: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  kpi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  kpiValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  kpiLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginTop: space.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    ...shadow.card,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  chips: { paddingHorizontal: space.lg, paddingTop: space.sm + 2, gap: space.sm, alignItems: 'center' },
  chipPrefix: { fontSize: 12, color: colors.muted, fontWeight: '600', marginRight: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  chipSubtle: { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 10 },
  chipSubtleActive: { backgroundColor: colors.primarySoft },
  chipSubtleTextActive: { color: colors.primaryDark },
  count: { fontSize: 13, color: colors.muted, fontWeight: '700', marginHorizontal: space.lg, marginTop: space.md, marginBottom: space.md },
  error: { color: colors.warn, marginHorizontal: space.lg, marginTop: space.md, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: space.xl },
});
