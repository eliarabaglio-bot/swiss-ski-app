import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { freshSnow, ResortCard } from '../../components/ResortCard';
import { formatUpdated, resortStatus } from '../../lib/format';
import { useStore } from '../../lib/store';
import { colors, radius, space } from '../../theme';

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

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = resorts.filter(
      (r) =>
        (!region || r.region === region) &&
        (status === 'tutte' || resortStatus(r).key === 'open') &&
        (!q || r.name.toLowerCase().includes(q) || r.place.toLowerCase().includes(q)),
    );
    const byName = (a: (typeof resorts)[0], b: (typeof resorts)[0]) => a.name.localeCompare(b.name, 'it');
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'aperti':
          return (b.lifts?.open ?? -1) - (a.lifts?.open ?? -1) || (b.lifts?.total ?? 0) - (a.lifts?.total ?? 0);
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
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cerca una stazione o località…"
            placeholderTextColor={colors.muted}
            style={styles.search}
            clearButtonMode="while-editing"
          />
          <Chips
            items={[
              { key: 'tutte' as StatusFilter, label: `Tutte (${resorts.length})` },
              { key: 'aperte' as StatusFilter, label: `🟢 Aperte oggi (${openCount})` },
            ]}
            value={status}
            onChange={setStatus}
          />
          <Chips items={[{ key: null, label: 'Tutte le regioni' }, ...regions.map((r) => ({ key: r, label: r }))]} value={region} onChange={setRegion} />
          <Chips items={SORTS} value={sort} onChange={setSort} prefix="Ordina: " />
          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
          <Text style={styles.updated}>
            {list.length} stazioni · impianti aggiornati il {formatUpdated(dataUpdatedAt)}
          </Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nessuna stazione trovata.</Text>}
    />
  );
}

function Chips<T>({
  items,
  value,
  onChange,
  prefix,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  prefix?: string;
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
            style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={[styles.chipText, active && { color: '#fff' }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: space.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  chips: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm, alignItems: 'center' },
  chipPrefix: { fontSize: 12, color: colors.muted },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  updated: { fontSize: 12, color: colors.muted, marginHorizontal: space.lg, marginTop: space.md, marginBottom: space.sm },
  error: { color: colors.warn, marginHorizontal: space.lg, marginTop: space.md, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: space.xl },
});
