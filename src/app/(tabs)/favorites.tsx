import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ResortCard } from '../../components/ResortCard';
import { RESORTS } from '../../data/resorts';
import { useFavorites } from '../../lib/favorites';
import { useSummaries } from '../../lib/summaries';
import { colors, space } from '../../theme';

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const { data, loading, refresh } = useSummaries();
  const list = RESORTS.filter((r) => favorites.includes(r.id));

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <ResortCard resort={item} summary={data[item.id]} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingTop: space.md, paddingBottom: space.xl, flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>Nessun preferito</Text>
          <Text style={styles.emptyText}>Tocca la stella di una stazione per vederla qui.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: space.sm },
  emptyText: { fontSize: 14, color: colors.muted, marginTop: space.xs, textAlign: 'center' },
});
