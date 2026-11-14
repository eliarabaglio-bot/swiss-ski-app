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

export type Status = { key: 'open' | 'soon' | 'closed'; label: string; color: string; bg: string };

export function resortStatus(r: Resort, today = new Date()): Status {
  if ((r.lifts?.open ?? 0) > 0) {
    return { key: 'open', label: 'Aperta', color: '#1F7A45', bg: '#E3F6EA' };
  }
  const todayIso = today.toISOString().slice(0, 10);
  if (r.seasonStart && r.seasonStart > todayIso) {
    return { key: 'soon', label: `Apre il ${formatDate(r.seasonStart)}`, color: '#1E5FB8', bg: '#E3EFFC' };
  }
  return { key: 'closed', label: 'Chiusa', color: '#5B7083', bg: '#EEF2F5' };
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
