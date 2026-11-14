// Carica una volta il meteo di tutte le stazioni e lo condivide tra le schermate.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { RESORTS } from '../data/resorts';
import { fetchSummaries, type WeatherSummary } from './weather';

type Ctx = {
  data: Record<string, WeatherSummary>;
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => Promise<void>;
};

const SummariesContext = createContext<Ctx>({
  data: {},
  loading: false,
  error: null,
  updatedAt: null,
  refresh: async () => {},
});

export function SummariesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, WeatherSummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchSummaries(RESORTS));
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SummariesContext.Provider value={{ data, loading, error, updatedAt, refresh }}>{children}</SummariesContext.Provider>
  );
}

export const useSummaries = () => useContext(SummariesContext);
