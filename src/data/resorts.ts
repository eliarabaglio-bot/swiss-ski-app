// Elenco delle stazioni sciistiche svizzere.
// Valori di km piste, impianti e prezzi sono INDICATIVI: verificali sul sito ufficiale.
// Per aggiungere una stazione basta aggiungere un oggetto a questa lista.

export type Region =
  | 'Vallese'
  | 'Grigioni'
  | 'Oberland bernese'
  | 'Svizzera centrale'
  | 'Vaud e Friburgo'
  | 'Svizzera orientale'
  | 'Ticino';

export const REGIONS: Region[] = [
  'Vallese',
  'Grigioni',
  'Oberland bernese',
  'Svizzera centrale',
  'Vaud e Friburgo',
  'Svizzera orientale',
  'Ticino',
];

export type Resort = {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lon: number;
  baseAlt: number; // m s.l.m.
  topAlt: number; // m s.l.m.
  pistesKm: number; // km di piste (comprensorio)
  lifts: number; // numero totale impianti (comprensorio)
  dayPass: number; // giornaliera adulto CHF (indicativa)
  dynamicPricing?: boolean; // prezzo variabile in base al giorno
  glacier?: boolean; // stagione lunga (ghiacciaio)
  website: string;
};

export const RESORTS: Resort[] = [
  // --- Vallese ---
  { id: 'zermatt', name: 'Zermatt', region: 'Vallese', lat: 46.0207, lon: 7.7491, baseAlt: 1620, topAlt: 3883, pistesKm: 360, lifts: 52, dayPass: 92, dynamicPricing: true, glacier: true, website: 'https://www.zermatt.ch' },
  { id: 'verbier', name: 'Verbier (4 Vallées)', region: 'Vallese', lat: 46.0961, lon: 7.2286, baseAlt: 821, topAlt: 3330, pistesKm: 410, lifts: 67, dayPass: 89, dynamicPricing: true, website: 'https://www.verbier4vallees.ch' },
  { id: 'nendaz', name: 'Nendaz', region: 'Vallese', lat: 46.1868, lon: 7.2925, baseAlt: 1365, topAlt: 3330, pistesKm: 410, lifts: 67, dayPass: 75, website: 'https://www.nendaz.ch' },
  { id: 'saas-fee', name: 'Saas-Fee', region: 'Vallese', lat: 46.1083, lon: 7.9286, baseAlt: 1800, topAlt: 3600, pistesKm: 100, lifts: 22, dayPass: 79, dynamicPricing: true, glacier: true, website: 'https://www.saas-fee.ch' },
  { id: 'crans-montana', name: 'Crans-Montana', region: 'Vallese', lat: 46.3114, lon: 7.4812, baseAlt: 1500, topAlt: 3000, pistesKm: 140, lifts: 22, dayPass: 79, dynamicPricing: true, website: 'https://www.crans-montana.ch' },
  { id: 'aletsch', name: 'Aletsch Arena', region: 'Vallese', lat: 46.4058, lon: 8.0408, baseAlt: 1925, topAlt: 2869, pistesKm: 104, lifts: 35, dayPass: 69, website: 'https://www.aletscharena.ch' },
  { id: 'grimentz-zinal', name: 'Grimentz-Zinal', region: 'Vallese', lat: 46.1800, lon: 7.5760, baseAlt: 1570, topAlt: 2900, pistesKm: 115, lifts: 14, dayPass: 66, website: 'https://www.grimentz-zinal.ch' },
  { id: 'leukerbad', name: 'Leukerbad', region: 'Vallese', lat: 46.3790, lon: 7.6270, baseAlt: 1400, topAlt: 2700, pistesKm: 50, lifts: 11, dayPass: 59, website: 'https://www.leukerbad.ch' },
  { id: 'anzere', name: 'Anzère', region: 'Vallese', lat: 46.2970, lon: 7.3980, baseAlt: 1500, topAlt: 2420, pistesKm: 58, lifts: 11, dayPass: 55, website: 'https://www.anzere.ch' },
  { id: 'champery', name: 'Champéry (Portes du Soleil)', region: 'Vallese', lat: 46.1770, lon: 6.8700, baseAlt: 1050, topAlt: 2466, pistesKm: 600, lifts: 190, dayPass: 65, website: 'https://www.champery.ch' },
  { id: 'belalp', name: 'Belalp', region: 'Vallese', lat: 46.3700, lon: 7.9700, baseAlt: 1322, topAlt: 3112, pistesKm: 60, lifts: 8, dayPass: 56, website: 'https://www.belalp.ch' },
  { id: 'graechen', name: 'Grächen', region: 'Vallese', lat: 46.1950, lon: 7.8370, baseAlt: 1620, topAlt: 2868, pistesKm: 50, lifts: 9, dayPass: 59, website: 'https://www.graechen.ch' },

  // --- Grigioni ---
  { id: 'st-moritz', name: 'St. Moritz (Corviglia)', region: 'Grigioni', lat: 46.4983, lon: 9.8390, baseAlt: 1720, topAlt: 3057, pistesKm: 350, lifts: 56, dayPass: 89, dynamicPricing: true, website: 'https://www.engadin.ch' },
  { id: 'diavolezza', name: 'Diavolezza-Lagalb', region: 'Grigioni', lat: 46.4100, lon: 9.9700, baseAlt: 2093, topAlt: 2978, pistesKm: 25, lifts: 4, dayPass: 60, glacier: true, website: 'https://www.engadin.ch' },
  { id: 'davos', name: 'Davos Klosters', region: 'Grigioni', lat: 46.8020, lon: 9.8360, baseAlt: 1124, topAlt: 2844, pistesKm: 300, lifts: 57, dayPass: 79, dynamicPricing: true, website: 'https://www.davos.ch' },
  { id: 'laax', name: 'Laax (Flims Laax Falera)', region: 'Grigioni', lat: 46.8100, lon: 9.2580, baseAlt: 1100, topAlt: 3018, pistesKm: 224, lifts: 28, dayPass: 99, dynamicPricing: true, website: 'https://www.laax.com' },
  { id: 'arosa-lenzerheide', name: 'Arosa Lenzerheide', region: 'Grigioni', lat: 46.7500, lon: 9.5600, baseAlt: 1229, topAlt: 2865, pistesKm: 225, lifts: 43, dayPass: 87, dynamicPricing: true, website: 'https://www.arosalenzerheide.swiss' },
  { id: 'scuol', name: 'Scuol (Motta Naluns)', region: 'Grigioni', lat: 46.7970, lon: 10.3000, baseAlt: 1250, topAlt: 2783, pistesKm: 70, lifts: 12, dayPass: 66, website: 'https://www.engadin.com' },
  { id: 'savognin', name: 'Savognin', region: 'Grigioni', lat: 46.5970, lon: 9.6000, baseAlt: 1200, topAlt: 2713, pistesKm: 80, lifts: 9, dayPass: 63, website: 'https://www.savognin.ch' },
  { id: 'samnaun', name: 'Samnaun (Silvretta Arena)', region: 'Grigioni', lat: 46.9420, lon: 10.3600, baseAlt: 1400, topAlt: 2872, pistesKm: 239, lifts: 45, dayPass: 79, website: 'https://www.samnaun.ch' },
  { id: 'obersaxen', name: 'Obersaxen Mundaun', region: 'Grigioni', lat: 46.7300, lon: 9.0900, baseAlt: 1201, topAlt: 2310, pistesKm: 120, lifts: 15, dayPass: 59, website: 'https://www.obersaxen-mundaun.swiss' },

  // --- Oberland bernese ---
  { id: 'jungfrau', name: 'Grindelwald-Wengen (Jungfrau)', region: 'Oberland bernese', lat: 46.6240, lon: 8.0340, baseAlt: 943, topAlt: 2501, pistesKm: 213, lifts: 44, dayPass: 79, dynamicPricing: true, website: 'https://www.jungfrau.ch' },
  { id: 'muerren', name: 'Mürren-Schilthorn', region: 'Oberland bernese', lat: 46.5590, lon: 7.8920, baseAlt: 1638, topAlt: 2970, pistesKm: 54, lifts: 10, dayPass: 70, website: 'https://www.schilthorn.ch' },
  { id: 'adelboden-lenk', name: 'Adelboden-Lenk', region: 'Oberland bernese', lat: 46.4930, lon: 7.5600, baseAlt: 1068, topAlt: 2362, pistesKm: 210, lifts: 56, dayPass: 71, website: 'https://www.adelboden-lenk.ch' },
  { id: 'gstaad', name: 'Gstaad', region: 'Oberland bernese', lat: 46.4750, lon: 7.2860, baseAlt: 950, topAlt: 3000, pistesKm: 200, lifts: 50, dayPass: 75, website: 'https://www.gstaad.ch' },
  { id: 'hasliberg', name: 'Meiringen-Hasliberg', region: 'Oberland bernese', lat: 46.7300, lon: 8.2000, baseAlt: 1061, topAlt: 2433, pistesKm: 60, lifts: 14, dayPass: 64, website: 'https://www.meiringen-hasliberg.ch' },

  // --- Vaud e Friburgo ---
  { id: 'glacier3000', name: 'Glacier 3000', region: 'Vaud e Friburgo', lat: 46.3260, lon: 7.2090, baseAlt: 1350, topAlt: 3000, pistesKm: 30, lifts: 7, dayPass: 79, glacier: true, website: 'https://www.glacier3000.ch' },
  { id: 'villars', name: 'Villars-Gryon-Les Diablerets', region: 'Vaud e Friburgo', lat: 46.3000, lon: 7.0550, baseAlt: 1300, topAlt: 2120, pistesKm: 100, lifts: 22, dayPass: 64, website: 'https://www.villars-diablerets.ch' },
  { id: 'leysin', name: 'Leysin', region: 'Vaud e Friburgo', lat: 46.3430, lon: 7.0120, baseAlt: 1300, topAlt: 2205, pistesKm: 60, lifts: 14, dayPass: 52, website: 'https://www.leysin.ch' },
  { id: 'moleson', name: 'Moléson', region: 'Vaud e Friburgo', lat: 46.5500, lon: 7.0170, baseAlt: 1100, topAlt: 2002, pistesKm: 30, lifts: 6, dayPass: 42, website: 'https://www.moleson.ch' },

  // --- Svizzera centrale ---
  { id: 'engelberg', name: 'Engelberg-Titlis', region: 'Svizzera centrale', lat: 46.8200, lon: 8.4050, baseAlt: 1050, topAlt: 3028, pistesKm: 82, lifts: 24, dayPass: 75, glacier: true, website: 'https://www.titlis.ch' },
  { id: 'andermatt', name: 'Andermatt-Sedrun-Disentis', region: 'Svizzera centrale', lat: 46.6350, lon: 8.5940, baseAlt: 1447, topAlt: 2961, pistesKm: 180, lifts: 33, dayPass: 85, dynamicPricing: true, website: 'https://www.andermatt.ch' },
  { id: 'melchsee-frutt', name: 'Melchsee-Frutt', region: 'Svizzera centrale', lat: 46.7750, lon: 8.2700, baseAlt: 1080, topAlt: 2255, pistesKm: 32, lifts: 8, dayPass: 59, website: 'https://www.melchsee-frutt.ch' },
  { id: 'stoos', name: 'Stoos', region: 'Svizzera centrale', lat: 46.9770, lon: 8.6600, baseAlt: 1300, topAlt: 1922, pistesKm: 35, lifts: 6, dayPass: 59, website: 'https://www.stoos.ch' },
  { id: 'soerenberg', name: 'Sörenberg', region: 'Svizzera centrale', lat: 46.8200, lon: 8.0300, baseAlt: 1166, topAlt: 2350, pistesKm: 50, lifts: 16, dayPass: 52, website: 'https://www.soerenberg.ch' },

  // --- Svizzera orientale ---
  { id: 'flumserberg', name: 'Flumserberg', region: 'Svizzera orientale', lat: 47.0900, lon: 9.2800, baseAlt: 1220, topAlt: 2222, pistesKm: 65, lifts: 17, dayPass: 62, website: 'https://www.flumserberg.ch' },
  { id: 'pizol', name: 'Pizol', region: 'Svizzera orientale', lat: 47.0000, lon: 9.4300, baseAlt: 510, topAlt: 2222, pistesKm: 40, lifts: 9, dayPass: 55, website: 'https://www.pizol.com' },
  { id: 'toggenburg', name: 'Toggenburg', region: 'Svizzera orientale', lat: 47.2000, lon: 9.3500, baseAlt: 900, topAlt: 2262, pistesKm: 60, lifts: 17, dayPass: 59, website: 'https://www.toggenburg.swiss' },

  // --- Ticino ---
  { id: 'airolo', name: 'Airolo', region: 'Ticino', lat: 46.5300, lon: 8.6000, baseAlt: 1175, topAlt: 2250, pistesKm: 30, lifts: 6, dayPass: 48, website: 'https://www.ticino.ch' },
  { id: 'bosco-gurin', name: 'Bosco Gurin', region: 'Ticino', lat: 46.3160, lon: 8.4900, baseAlt: 1500, topAlt: 2400, pistesKm: 30, lifts: 5, dayPass: 45, website: 'https://www.ticino.ch' },
  { id: 'cari', name: 'Carì', region: 'Ticino', lat: 46.4900, lon: 8.8200, baseAlt: 1650, topAlt: 2300, pistesKm: 24, lifts: 5, dayPass: 40, website: 'https://www.ticino.ch' },
];

export function getResort(id: string): Resort | undefined {
  return RESORTS.find((r) => r.id === id);
}

// Stagione "tipica" (non lo stato reale degli impianti): serve come indicazione
// finché non colleghiamo i dati in tempo reale degli impianti.
export function typicalSeasonStatus(r: Resort, date = new Date()): 'in-stagione' | 'fuori-stagione' {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  const md = m * 100 + d;
  if (r.glacier) {
    // ghiacciai: circa da metà ottobre a inizio maggio
    return md >= 1015 || md <= 505 ? 'in-stagione' : 'fuori-stagione';
  }
  // altre stazioni: circa da inizio dicembre a metà aprile
  return md >= 1206 || md <= 415 ? 'in-stagione' : 'fuori-stagione';
}
