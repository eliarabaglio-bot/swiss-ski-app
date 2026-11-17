// Pericolo valanghe dal bollettino ufficiale SLF (Istituto per lo studio della neve e delle valanghe).
// I dati (grado per zona) li prepara il raccoglitore orario (scripts/scrape.mjs) e arrivano con data/snow.json.
// Il bollettino viene pubblicato solo in inverno: fuori stagione non c'è nessun dato.

export const SLF_URL = 'https://www.slf.ch/it/bollettino-valanghe-e-situazione-nivologica/';

export type DangerLevel = 1 | 2 | 3 | 4 | 5;

export const DANGER: Record<DangerLevel, { label: string; color: string; text: string }> = {
  1: { label: '1 – Debole', color: '#CCFF66', text: '#1d2b00' },
  2: { label: '2 – Moderato', color: '#FFFF00', text: '#2b2b00' },
  3: { label: '3 – Marcato', color: '#FF9900', text: '#2b1600' },
  4: { label: '4 – Forte', color: '#FF0000', text: '#ffffff' },
  5: { label: '5 – Molto forte', color: '#7a0000', text: '#ffffff' },
};
