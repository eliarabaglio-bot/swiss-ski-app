// Pericolo valanghe dal bollettino ufficiale SLF (Istituto per lo studio della neve e delle valanghe).
// Il bollettino viene pubblicato solo in inverno: fuori stagione non c'è nessun dato.

export const SLF_URL = 'https://www.slf.ch/it/bollettino-valanghe-e-situazione-nivologica/';
const GEOJSON_URL = 'https://aws.slf.ch/api/bulletin/caaml/it/geojson';

export type DangerLevel = 1 | 2 | 3 | 4 | 5;

export const DANGER: Record<DangerLevel, { label: string; color: string; text: string }> = {
  1: { label: '1 – Debole', color: '#CCFF66', text: '#1d2b00' },
  2: { label: '2 – Moderato', color: '#FFFF00', text: '#2b2b00' },
  3: { label: '3 – Marcato', color: '#FF9900', text: '#2b1600' },
  4: { label: '4 – Forte', color: '#FF0000', text: '#ffffff' },
  5: { label: '5 – Molto forte', color: '#7a0000', text: '#ffffff' },
};

const VALUE_TO_LEVEL: Record<string, DangerLevel> = {
  low: 1,
  moderate: 2,
  considerable: 3,
  high: 4,
  very_high: 5,
};

let cache: { at: number; data: any } | null = null;

async function loadGeoJson() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return cache.data;
  const res = await fetch(GEOJSON_URL);
  if (!res.ok) throw new Error(`Bollettino non disponibile (${res.status})`);
  const data = await res.json();
  cache = { at: Date.now(), data };
  return data;
}

// Cerca tutti i "mainValue" (es. "moderate") dentro le proprietà della zona.
function collectLevels(obj: any, out: DangerLevel[] = []): DangerLevel[] {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'mainValue' && typeof v === 'string' && VALUE_TO_LEVEL[v]) out.push(VALUE_TO_LEVEL[v]);
    else if (typeof v === 'object') collectLevels(v, out);
  }
  return out;
}

function pointInRing(lon: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lon: number, lat: number, g: any): boolean {
  if (!g) return false;
  if (g.type === 'Polygon') return pointInRing(lon, lat, g.coordinates[0]);
  if (g.type === 'MultiPolygon') return g.coordinates.some((p: number[][][]) => pointInRing(lon, lat, p[0]));
  return false;
}

/** Livello di pericolo massimo per la zona in cui si trova il punto. null = nessun bollettino. */
export async function fetchDangerLevel(lat: number, lon: number): Promise<DangerLevel | null> {
  const data = await loadGeoJson();
  const features: any[] = data?.features ?? [];
  const f = features.find((ft) => pointInGeometry(lon, lat, ft.geometry));
  if (!f) return null;
  const levels = collectLevels(f.properties);
  if (!levels.length) return null;
  return Math.max(...levels) as DangerLevel;
}
