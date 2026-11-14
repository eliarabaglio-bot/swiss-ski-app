// Preferiti salvati sul telefono.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'swiski:favorites';

type Ctx = { favorites: string[]; isFavorite: (id: string) => boolean; toggle: (id: string) => void };
const FavoritesContext = createContext<Ctx>({ favorites: [], isFavorite: () => false, toggle: () => {} });

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setFavorites(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
