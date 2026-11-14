// Traduzioni e formattazioni per i dati del bollettino (che arrivano in inglese).
import type { LiftKind, Resort } from '../data/types';

const WORDS: [RegExp, string][] = [
  [/end of season/gi, 'fine stagione'],
  [/no info/gi, 'n.d.'],
  [/very good/gi, 'ottima'],
  [/good/gi, 'buona'],
  [/fair|moderate/gi, 'discreta'],
  [/poor|bad/gi, 'scarsa'],
  [/packed powder/gi, 'polvere compatta'],
  [/powder/gi, 'polverosa'],
  [/hard/gi, 'dura'],
  [/icy|ice/gi, 'ghiacciata'],
  [/wet/gi, 'bagnata'],
  [/spring snow|spring/gi, 'primaverile'],
  [/artificial snow|artificial/gi, 'programmata'],
  [/crusty|crust/gi, 'crosta'],
  [/slushy|slush/gi, 'pesante'],
  [/closed/gi, 'chiusa'],
  [/open/gi, 'aperta'],
  [/yesterday/gi, 'ieri'],
  [/today/gi, 'oggi'],
];

export function it(text: string | null | undefined): string {
  if (!text) return '—';
  let s = text;
  for (const [re, v] of WORDS) s = s.replace(re, v);
  // date 24.10.2026 -> 24.10.2026 (già leggibile)
  return s;
}

export function formatDate(iso: string | null | undefined, withYear = false): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return withYear ? `${d}.${m}.${y}` : `${d}.${m}.`;
}

export function formatUpdated(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('it-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export type StatusKey = 'open' | 'lifts' | 'soon' | 'stale' | 'closed';
export type Status = { key: StatusKey; label: string; color: string; bg: string };

/** Data di oggi in Svizzera, YYYY-MM-DD */
export function swissToday(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  // Europa/Zurigo: UTC+1 (inverno) / UTC+2 (estate). Approssimazione sufficiente per confrontare le date.
  const z = new Date(d.getTime() + (isSummerTime(d) ? 2 : 1) * 3600000);
  return `${z.getUTCFullYear()}-${p(z.getUTCMonth() + 1)}-${p(z.getUTCDate())}`;
}
function isSummerTime(d: Date) {
  const y = d.getUTCFullYear();
  const lastSunday = (m: number) => {
    const x = new Date(Date.UTC(y, m + 1, 0));
    return Date.UTC(y, m, x.getUTCDate() - x.getUTCDay(), 1);
  };
  return d.getTime() >= lastSunday(2) && d.getTime() < lastSunday(9);
}

/** Giorni passati dall'ultimo aggiornamento del bollettino della stazione (null = sconosciuto). */
export function reportAgeDays(r: Resort, now = new Date()): number | null {
  if (!r.reportUpdatedAt) return null;
  const t = new Date(r.reportUpdatedAt + '+01:00').getTime();
  if (isNaN(t)) return null;
  return (now.getTime() - t) / 86400000;
}

/** Bollettino considerato affidabile se aggiornato negli ultimi 3 giorni. */
export const MAX_REPORT_AGE_DAYS = 3;

export function isStale(r: Resort, now = new Date()): boolean {
  const age = reportAgeDays(r, now);
  return !r.hasCurrentData || age == null || age > MAX_REPORT_AGE_DAYS;
}

/**
 * Stato per lo sci:
 * - open:   piste aperte oggi (bollettino recente)
 * - lifts:  impianti in funzione ma nessuna pista aperta (es. impianti per escursionisti)
 * - stale:  la stazione segnala impianti aperti ma il bollettino è vecchio o senza data
 * - soon:   stagione non ancora iniziata
 * - closed: chiusa
 */
export function resortStatus(r: Resort, now = new Date()): Status {
  const today = swissToday(now);
  const peak = r.dayPeak?.date === today ? r.dayPeak : null;
  const liftsOpen = Math.max(r.lifts?.open ?? 0, peak?.lifts ?? 0);
  const pistesOpen = Math.max(r.pistesKm?.open ?? 0, peak?.pistesKm ?? 0);
  const stale = isStale(r, now);

  // Servono sia piste sia impianti aperti: alcune stazioni lasciano km di piste "aperti" della stagione precedente
  if (!stale && pistesOpen > 0 && liftsOpen > 0) return { key: 'open', label: 'Aperta', color: '#1F7A45', bg: '#E3F6EA' };
  if (stale && liftsOpen > 0) {
    const when = r.reportUpdatedAt ? ` (${formatDate(r.reportUpdatedAt)})` : '';
    return { key: 'stale', label: `Dati vecchi${when}`, color: '#9A5B00', bg: '#FFF1DB' };
  }
  if (!stale && liftsOpen > 0) return { key: 'lifts', label: 'Solo impianti', color: '#5B6B8C', bg: '#ECEFF7' };
  if (r.seasonStart && r.seasonStart > today) {
    return { key: 'soon', label: `Apre il ${formatDate(r.seasonStart)}`, color: '#1E5FB8', bg: '#E3EFFC' };
  }
  return { key: 'closed', label: 'Chiusa', color: '#5B7083', bg: '#EEF2F5' };
}

/** Il bollettino dice che oggi sono stati aperti impianti/piste più di quelli aperti adesso (es. la sera). */
export function peakToday(r: Resort, now = new Date()) {
  const p = r.dayPeak?.date === swissToday(now) ? r.dayPeak : null;
  if (!p) return null;
  const more = p.lifts > (r.lifts?.open ?? 0) || p.pistesKm > (r.pistesKm?.open ?? 0);
  return more ? p : null;
}

export const KIND_LABEL: Record<LiftKind, { one: string; many: string; icon: string }> = {
  seggiovia: { one: 'Seggiovia', many: 'Seggiovie', icon: '🪑' },
  cabinovia: { one: 'Cabinovia', many: 'Cabinovie', icon: '🚡' },
  funivia: { one: 'Funivia', many: 'Funivie', icon: '🚠' },
  funicolare: { one: 'Treno / funicolare', many: 'Treni e funicolari', icon: '🚞' },
  skilift: { one: 'Skilift', many: 'Skilift', icon: '⛷️' },
  'tapis roulant': { one: 'Tapis roulant', many: 'Tapis roulant', icon: '➖' },
  altro: { one: 'Altro', many: 'Altri impianti', icon: '•' },
};

export const KIND_ORDER: LiftKind[] = ['funivia', 'cabinovia', 'seggiovia', 'skilift', 'funicolare', 'tapis roulant', 'altro'];
