import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ResortCard } from '../../components/ResortCard';
import { REGIONS, RESORTS, type Region } from '../../data/resorts';
import { useSummaries } from '../../lib/summaries';
import { colors, radius, space } from '../../theme';

type Sort = 'neve' | 'previsione' | 'nome' | 'quota' | 'prezzo';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'neve', label: 'Neve fresca' },
  { key: 'previsione', label: 'Neve in arrivo' },
  { key: 'quota', label: 'Quota' },
  { key: 'prezzo', label: 'Prezzo' },
  { key: 'nome', label: 'A–Z' },
];

export default function ResortsScreen() {
  const { data, loading, error, updatedAt, refresh } = useSummaries();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region | null>(null);
  const [sort, setSort] = useState<Sort>('neve');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = RESORTS.filter(
      (r) => (!region || r.region === region) && (!q || r.name.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'neve':
          return (data[b.id]?.freshSnow24h ?? -1) - (data[a.id]?.freshSnow24h ?? -1) || a.name.localeCompare(b.name);
        case 'previsione':
          return (data[b.id]?.forecastSnow48h ?? -1) - (data[a.id]?.forecastSnow48h ?? -1) || a.name.localeCompare(b.name);
        case 'quota':
          return b.topAlt - a.topAlt;
        case 'prezzo':
          return a.dayPass - b.dayPass;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [query, region, sort, data]);

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <ResortCard resort={item} summary={data[item.id]} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ paddingTop: space.md }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cerca una stazione…"
            placeholderTextColor={colors.muted}
            style={styles.search}
            clearButtonMode="while-editing"
          />
          <Chips
            items={[{ key: null, label: 'Tutte' }, ...REGIONS.map((r) => ({ key: r, label: r }))]}
            value={region}
            onChange={setRegion}
          />
          <Chips items={SORTS} value={sort} onChange={setSort} prefix="Ordina: " />
          {error ? <Text style={styles.error}>⚠️ {error} — trascina verso il basso per riprovare</Text> : null}
          <Text style={styles.updated}>
            {list.length} stazioni
            {updatedAt ? ` · aggiornato alle ${updatedAt.toLocaleTimeString('it-CH', { hour: '2-digit', minute: '2-digit' })}` : ''}
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
  error: { color: colors.bad, marginHorizontal: space.lg, marginTop: space.md },
  empty: { textAlign: 'center', color: colors.muted, marginTop: space.xl },
});
