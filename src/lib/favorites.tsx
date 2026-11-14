// Preferiti salvati sul telefono.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'swiski:favorites';

type FavTarget = { id: string; aliases?: string[] };
type Ctx = {
  favorites: string[];
  isFavorite: (r: FavTarget) => boolean;
  toggle: (r: FavTarget) => void;
};
const FavoritesContext = createContext<Ctx>({ favorites: [], isFavorite: () => false, toggle: () => {} });
const ids = (r: FavTarget) => [r.id, ...(r.aliases ?? [])];

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setFavorites(JSON.parse(v)))
      .catch(() => {});
  }, []);

  // una stazione unita ad altre è preferita anche se salvata con un vecchio id
  const toggle = useCallback((r: FavTarget) => {
    setFavorites((prev) => {
      const all = ids(r);
      const isFav = prev.some((x) => all.includes(x));
      const next = isFav ? prev.filter((x) => !all.includes(x)) : [...prev, r.id];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback((r: FavTarget) => ids(r).some((x) => favorites.includes(x)), [favorites]);

  return <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
