// Meteo e neve da Open-Meteo (gratuito, nessuna chiave).
// Usa il modello migliore disponibile per la Svizzera (incluso MeteoSvizzera ICON-CH).
import type { Resort } from '../data/resorts';

const BASE = 'https://api.open-meteo.com/v1/forecast';

export type WeatherSummary = {
  tempTop: number | null; // °C ora, in vetta
  weatherCode: number | null;
  windKmh: number | null;
  snowDepthCm: number | null; // altezza neve (stima del modello)
  freshSnow24h: number; // cm caduti nelle ultime 24h
  forecastSnow48h: number; // cm previsti nelle prossime 48h
};

export type DayForecast = {
  date: string; // YYYY-MM-DD
  code: number;
  tMax: number;
  tMin: number;
  snowCm: number;
  windMax: number;
  sunHours: number;
};

export type WeatherDetail = WeatherSummary & {
  tempBase: number | null;
  freezingLevel: number | null; // m, zero termico
  days: DayForecast[];
};

function sumWindow(times: number[], values: (number | null)[], from: number, to: number) {
  let s = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= from && times[i] < to) s += values[i] ?? 0;
  }
  return Math.round(s);
}

function parseSummary(j: any): WeatherSummary {
  const now = Date.now() / 1000;
  const h = j.hourly ?? {};
  const t: number[] = h.time ?? [];
  const depthM = j.current?.snow_depth;
  return {
    tempTop: j.current?.temperature_2m ?? null,
    weatherCode: j.current?.weather_code ?? null,
    windKmh: j.current?.wind_speed_10m ?? null,
    snowDepthCm: typeof depthM === 'number' ? Math.round(depthM * 100) : null,
    freshSnow24h: sumWindow(t, h.snowfall ?? [], now - 24 * 3600, now),
    forecastSnow48h: sumWindow(t, h.snowfall ?? [], now, now + 48 * 3600),
  };
}

const CURRENT = 'temperature_2m,weather_code,wind_speed_10m,snow_depth';
const HOURLY = 'hourly=snowfall&past_hours=24&forecast_hours=48&timeformat=unixtime&timezone=Europe%2FZurich';
const SUMMARY_PARAMS = `current=${CURRENT}&${HOURLY}`;

/** Riassunto per molte stazioni con una sola richiesta. */
export async function fetchSummaries(resorts: Resort[]): Promise<Record<string, WeatherSummary>> {
  const out: Record<string, WeatherSummary> = {};
  // a blocchi di 50 per non avere URL troppo lunghi
  for (let i = 0; i < resorts.length; i += 50) {
    const chunk = resorts.slice(i, i + 50);
    const url =
      `${BASE}?latitude=${chunk.map((r) => r.lat).join(',')}` +
      `&longitude=${chunk.map((r) => r.lon).join(',')}` +
      `&elevation=${chunk.map((r) => r.topAlt).join(',')}&${SUMMARY_PARAMS}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Meteo non disponibile (${res.status})`);
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [json];
    chunk.forEach((r, idx) => {
      if (arr[idx]) out[r.id] = parseSummary(arr[idx]);
    });
  }
  return out;
}

/** Dettaglio completo per una stazione: vetta + valle + 7 giorni. */
export async function fetchDetail(r: Resort): Promise<WeatherDetail> {
  const daily =
    'daily=weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,wind_speed_10m_max,sunshine_duration&forecast_days=7';
  const topUrl =
    `${BASE}?latitude=${r.lat}&longitude=${r.lon}&elevation=${r.topAlt}` +
    `&current=${CURRENT},freezing_level_height&${HOURLY}&${daily}`;
  const baseUrl =
    `${BASE}?latitude=${r.lat}&longitude=${r.lon}&elevation=${r.baseAlt}` +
    `&current=temperature_2m&timezone=Europe%2FZurich`;

  const [topRes, baseRes] = await Promise.all([fetch(topUrl), fetch(baseUrl)]);
  if (!topRes.ok) throw new Error(`Meteo non disponibile (${topRes.status})`);
  const top = await topRes.json();
  const base = baseRes.ok ? await baseRes.json() : null;

  const d = top.daily ?? {};
  const days: DayForecast[] = (d.time ?? []).map((time: number, i: number) => ({
    date: new Date((time + 12 * 3600) * 1000).toISOString().slice(0, 10), // +12h: evita lo sfasamento UTC
    code: d.weather_code?.[i] ?? 0,
    tMax: Math.round(d.temperature_2m_max?.[i] ?? 0),
    tMin: Math.round(d.temperature_2m_min?.[i] ?? 0),
    snowCm: Math.round(d.snowfall_sum?.[i] ?? 0),
    windMax: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
    sunHours: Math.round((d.sunshine_duration?.[i] ?? 0) / 3600),
  }));

  return {
    ...parseSummary(top),
    tempBase: base?.current?.temperature_2m ?? null,
    freezingLevel: top.current?.freezing_level_height ?? null,
    days,
  };
}

/** Codici meteo WMO -> descrizione ed emoji. */
export function describeWeather(code: number | null | undefined): { label: string; emoji: string } {
  if (code == null) return { label: '—', emoji: '❔' };
  if (code === 0) return { label: 'Sereno', emoji: '☀️' };
  if (code <= 2) return { label: 'Poco nuvoloso', emoji: '🌤️' };
  if (code === 3) return { label: 'Coperto', emoji: '☁️' };
  if (code <= 48) return { label: 'Nebbia', emoji: '🌫️' };
  if (code <= 57) return { label: 'Pioviggine', emoji: '🌦️' };
  if (code <= 67) return { label: 'Pioggia', emoji: '🌧️' };
  if (code <= 77) return { label: 'Neve', emoji: '🌨️' };
  if (code <= 82) return { label: 'Rovesci', emoji: '🌦️' };
  if (code <= 86) return { label: 'Rovesci di neve', emoji: '❄️' };
  return { label: 'Temporale', emoji: '⛈️' };
}
