import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SLF_URL } from '../../lib/avalanche';
import { colors, radius, space } from '../../theme';

const SOURCES = [
  { name: 'Open-Meteo', what: 'Meteo, temperature, nevicate e altezza neve (stima da modelli, incluso MeteoSvizzera).', url: 'https://open-meteo.com' },
  { name: 'SLF', what: 'Bollettino valanghe ufficiale (solo in inverno).', url: SLF_URL },
  { name: 'Windy Webcams', what: 'Immagini delle webcam vicino alle stazioni.', url: 'https://www.windy.com/webcams' },
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
        <Text style={styles.text}>• L'altezza della neve è una stima dei modelli meteo, non una misura sulle piste.</Text>
        <Text style={styles.text}>• I prezzi delle giornaliere sono indicativi: molte stazioni hanno prezzi dinamici.</Text>
        <Text style={styles.text}>
          • "In stagione" indica il periodo tipico di apertura. Lo stato reale degli impianti è sul sito della stazione
          (in arrivo nell'app).
        </Text>
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
