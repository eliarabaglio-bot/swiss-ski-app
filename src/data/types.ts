// Struttura di data/snow.json (generato da scripts/scrape.mjs).

export type Fraction = { open: number; total: number };

export type LiftKind = 'seggiovia' | 'cabinovia' | 'funivia' | 'funicolare' | 'skilift' | 'tapis roulant' | 'altro';

export type Lift = {
  name: string;
  type: string;
  kind: LiftKind;
  status: 'open' | 'closed' | 'partial' | 'unknown';
};

export type Webcam = {
  id: string;
  title: string;
  image: string;
  thumb: string;
  full: string;
  player: string | null;
};

export type Resort = {
  id: string;
  name: string;
  place: string;
  region: string;
  image: string | null;
  url: string;
  lat: number | null;
  lon: number | null;
  baseAlt: number | null;
  topAlt: number | null;
  snowBaseCm: number | null;
  snowTopCm: number | null;
  hasCurrentData: boolean;
  liftList: Lift[];
  comments: string | null;
  newSnowBaseCm: number | null;
  newSnowTopCm: number | null;
  lastSnowfall: string | null;
  snowCondition: string | null;
  slopeCondition: string | null;
  lifts: Fraction | null;
  pistesKm: Fraction | null;
  runsToValley: Fraction | null;
  liftsTotalArea: number | null;
  openFrom: string | null;
  openUntil: string | null;
  seasonStart: string | null; // YYYY-MM-DD
  seasonEnd: string | null;
  prices: { adult: number | null; youth: number | null; child: number | null; dynamic: boolean } | null;
  website: string | null;
  reportUpdatedAt: string | null;
  webcams?: Webcam[];
};

export type SnowData = {
  updatedAt: string;
  source: string;
  resorts: Resort[];
};
