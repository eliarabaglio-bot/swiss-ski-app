// Dati delle stazioni + meteo, condivisi da tutte le schermate.
//
// 1. All'avvio usa subito l'ultima copia salvata sul telefono (o quella inclusa nell'app).
// 2. Poi scarica la versione aggiornata da GitHub (aggiornata ogni ora da GitHub Actions).
// 3. In parallelo scarica il meteo (Open-Meteo) per tutte le stazioni.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Resort, SnowData } from '../data/types';
import { fetchSummaries, type WeatherSummary } from './weather';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BUNDLED: SnowData = require('../../data/snow.json');

export const DATA_URL = 'https://raw.githubusercontent.com/eliarabaglio-bot/swiss-ski-app/main/data/snow.json';
const CACHE_KEY = 'swiski:snow-data';

type Ctx = {
  resorts: Resort[];
  dataUpdatedAt: string | null;
  weather: Record<string, WeatherSummary>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getResort: (id: string) => Resort | undefined;
};

const StoreContext = createContext<Ctx>({
  resorts: [],
  dataUpdatedAt: null,
  weather: {},
  loading: false,
  error: null,
  refresh: async () => {},
  getResort: () => undefined,
});

function newer(a: SnowData | null, b: SnowData | null) {
  if (!a) return b;
  if (!b) return a;
  return a.updatedAt >= b.updatedAt ? a : b;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<SnowData>(BUNDLED);
  const dataRef = useRef<SnowData>(BUNDLED);
  const setData = useCallback((d: SnowData) => {
    dataRef.current = d;
    setDataState(d);
  }, []);
  const [weather, setWeather] = useState<Record<string, WeatherSummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async (resorts: Resort[]) => {
    try {
      setWeather(await fetchSummaries(resorts));
    } catch (e: any) {
      setError(e?.message ?? 'Meteo non disponibile');
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    let current: SnowData | null = null;
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote: SnowData = await res.json();
      if (Array.isArray(remote.resorts) && remote.resorts.length) {
        current = remote;
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote)).catch(() => {});
      }
    } catch {
      setError('Impossibile scaricare gli ultimi dati sugli impianti: mostro l’ultima copia disponibile.');
    }
    const best = newer(dataRef.current, current) ?? dataRef.current;
    if (best !== dataRef.current) setData(best);
    await loadWeather(best.resorts);
    setLoading(false);
  }, [loadWeather, setData]);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const best = newer(dataRef.current, JSON.parse(cached));
          if (best && best !== dataRef.current) setData(best);
        }
      } catch {}
      refresh();
    })();
  }, [refresh, setData]);

  const value = useMemo<Ctx>(() => {
    const byId = new Map<string, Resort>();
    for (const r of data.resorts) {
      byId.set(r.id, r);
      for (const a of r.aliases ?? []) byId.set(a, r); // vecchi id (preferiti salvati prima dell'unione)
    }
    return {
      resorts: data.resorts,
      dataUpdatedAt: data.updatedAt,
      weather,
      loading,
      error,
      refresh,
      getResort: (id) => byId.get(id),
    };
  }, [data, weather, loading, error, refresh]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
