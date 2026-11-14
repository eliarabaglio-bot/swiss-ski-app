import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SLF_URL } from '../../lib/avalanche';
import { colors, radius, space } from '../../theme';

const SOURCES = [
  {
    name: 'Bollettino neve MySwitzerland',
    what: 'Impianti e piste aperti, neve misurata, prezzi e stagione. Dati inseriti dalle stazioni (infosnow / SISAG), aggiornati ogni ora.',
    url: 'https://snow.myswitzerland.com/bolletino_delle_nevi/pista/',
  },
  { name: 'Open-Meteo', what: 'Meteo, temperature e previsioni di neve (modelli, incluso MeteoSvizzera).', url: 'https://open-meteo.com' },
  { name: 'SLF', what: 'Bollettino valanghe ufficiale (solo in inverno).', url: SLF_URL },
  { name: 'Guidle / Svizzera Turismo', what: 'Immagini delle webcam vicino alle stazioni.', url: 'https://www.myswitzerland.com/it-ch/webcams/' },
];

export default function InfoScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      <View style={styles.card}>
        <Text style={styles.title}>❄️ SwiSki</Text>
        <Text style={styles.text}>
          Meteo, neve e informazioni sulle stazioni sciistiche svizzere. Trascina verso il basso in una lista per
          aggiornare i dati.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Da sapere</Text>
        <Text style={styles.text}>• Impianti, piste e neve sono quelli comunicati dalle stazioni: alcune li aggiornano più spesso di altre.</Text>
        <Text style={styles.text}>• La neve "in arrivo" è una previsione dei modelli meteo.</Text>
        <Text style={styles.text}>• Molte stazioni hanno prezzi dinamici: controlla sempre il prezzo finale sul sito ufficiale.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Fonti dei dati</Text>
        {SOURCES.map((s) => (
          <Pressable key={s.name} onPress={() => WebBrowser.openBrowserAsync(s.url)} style={{ marginTop: space.sm }}>
            <Text style={styles.link}>{s.name} ›</Text>
            <Text style={styles.text}>{s.what}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space.sm },
  h2: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: space.xs },
  text: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: 4 },
  link: { fontSize: 15, color: colors.primary, fontWeight: '700' },
});
