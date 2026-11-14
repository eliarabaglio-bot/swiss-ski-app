// Webcam vicine alla stazione tramite Windy Webcams API (piano gratuito).
// Serve una chiave gratuita da https://api.windy.com/keys da inserire in app.json -> expo.extra.windyApiKey
import Constants from 'expo-constants';

export type Webcam = {
  id: string;
  title: string;
  imageUrl: string;
  playerUrl?: string;
};

export function windyKey(): string {
  return (Constants.expoConfig?.extra as any)?.windyApiKey ?? '';
}

export async function fetchWebcams(lat: number, lon: number, radiusKm = 12): Promise<Webcam[]> {
  const key = windyKey();
  if (!key) return [];
  const url =
    `https://api.windy.com/webcams/api/v3/webcams?nearby=${lat},${lon},${radiusKm}` +
    `&limit=10&include=images,player&lang=it`;
  const res = await fetch(url, { headers: { 'x-windy-api-key': key } });
  if (!res.ok) throw new Error(`Webcam non disponibili (${res.status})`);
  const json = await res.json();
  return (json.webcams ?? [])
    .map((w: any) => ({
      id: String(w.webcamId ?? w.id),
      title: w.title ?? 'Webcam',
      imageUrl: w.images?.current?.preview ?? w.images?.current?.thumbnail ?? '',
      playerUrl: w.player?.day ?? w.player?.live ?? undefined,
    }))
    .filter((w: Webcam) => w.imageUrl);
}
