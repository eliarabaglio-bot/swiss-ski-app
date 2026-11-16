// Raccoglie lo stato di tutte le stazioni sciistiche svizzere e lo salva in data/snow.json.
// Gira ogni ora su GitHub Actions (.github/workflows/update-data.yml). Si può lanciare anche a mano:
//   node scripts/scrape.mjs
//
// Fonti:
// - Bollettino neve di Svizzera Turismo (snow.myswitzerland.com): impianti/piste aperti, neve misurata,
//   prezzi, stagione. I dati sono inseriti dalle stazioni stesse (sistema WISPO / infosnow).
// - Webcam: elenco pubblico di Guidle usato da MySwitzerland (immagini aggiornate automaticamente).

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://snow.myswitzerland.com';
const LIST_URL = `${BASE}/snow_reports/piste/`;
const WEBCAMS_URL =
  'https://www.guidle.com/m_ekUNmn/Schweiz-Tourismus/Webcams/?templateVariant=json&language=it';
const UA = 'SwiSki/1.0 (personal app; hourly snow report)';
const CONCURRENCY = 4;
const WEBCAM_RADIUS_KM = 10;
const WEBCAMS_PER_RESORT = 6;

const REGION_IT = {
  'Graubünden': 'Grigioni',
  Valais: 'Vallese',
  'Bern Region': 'Berna',
  'Lucerne - Lake Lucerne Region': 'Svizzera centrale',
  'Canton of Vaud': 'Vaud',
  'Region of Fribourg': 'Friburgo',
  'Eastern Switzerland / Liechtenstein': 'Svizzera orientale',
  Ticino: 'Ticino',
  'Jura & Three-Lakes': 'Giura e Tre Laghi',
  'Zurich Region': 'Zurigo',
  'Aargau – Solothurn Region': 'Argovia e Soletta',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3, baseDelay = 1500) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`);
      await sleep(baseDelay * i);
    }
  }
}

/** Errore "fonte non raggiungibile": gestito a parte (vedi main). */
class SourceDownError extends Error {}

function decode(s) {
  return s
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

/** HTML -> righe di testo pulite (una per elemento). */
function toLines(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<\/?span[^>]*>/gi, ' ') // gli <span> sono in linea: "in resort <span>at 1620 metres</span>"
    .replace(/<[^>]+>/g, '\n');
  return decode(text)
    .split('\n')
    .map((l) => l.replace(/[\s﻿]+/g, ' ').trim())
    .filter(Boolean);
}

const num = (s) => {
  if (s == null) return null;
  const m = String(s).replace(/'/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};

/** "5/18" o "7.5/102.0 km" -> {open,total} */
function fraction(s) {
  const m = s?.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  return m ? { open: Number(m[1]), total: Number(m[2]) } : null;
}

/** Valore nella riga successiva a un'etichetta. */
function after(lines, test, from = 0) {
  for (let i = from; i < lines.length - 1; i++) {
    const l = lines[i];
    if (typeof test === 'string' ? l === test : test.test(l)) return { value: lines[i + 1], index: i, label: l };
  }
  return null;
}

function parseDate(s) {
  const m = s?.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// ---------- elenco ----------

async function fetchList() {
  let first;
  try {
    // il sito a volte è in manutenzione: riprova per circa 2 minuti (5 tentativi, attese crescenti)
    first = await get(LIST_URL, 5, 8000);
  } catch (e) {
    throw new SourceDownError(e.message);
  }
  const pages = Math.max(1, ...[...first.matchAll(/\?p=(\d+)/g)].map((m) => +m[1]));
  const htmls = [first];
  for (let p = 2; p <= pages; p++) htmls.push(await get(`${LIST_URL}?p=${p}`));

  const out = new Map();
  for (const html of htmls) {
    for (const row of html.split('<tr class="FilterGridTable--row"').slice(1)) {
      const name = row.match(/FilterGridTable--title"[^>]*>([^<]*)</)?.[1];
      const info = row.match(/FilterGridTable--info">([^<]*)</)?.[1];
      const path = row.match(/href="(\/snow_reports\/[^"?#]+)/)?.[1];
      const image = row.match(/data-sizes="([^" ]+)/)?.[1];
      // Le stazioni chiuse mostrano "Day ticket / Adult: CHF 87.– / Children: CHF 35.–"
      const dayAdult = row.match(/Adult: CHF ([\d'.]+)/)?.[1];
      const dayChild = row.match(/Children: CHF ([\d'.]+)/)?.[1];
      if (!name || !path) continue;
      const id = path.split('/').filter(Boolean).pop();
      const [place, ...rest] = decode(info ?? '').split(' – ');
      const regionEn = rest.join(' – ').trim();
      out.set(id, {
        id,
        name: decode(name).trim(),
        place: place.trim(),
        region: REGION_IT[regionEn] ?? (regionEn || 'Svizzera'),
        image: image ? decode(image).replace('w_{w},h_{h}', 'w_800,h_450') : null,
        url: BASE + path,
        listPrices: dayAdult ? { adult: num(dayAdult), youth: null, child: num(dayChild), dynamic: false } : null,
      });
    }
  }
  return [...out.values()];
}

// ---------- dettaglio ----------

// Tipo di impianto -> categoria
function liftKind(type) {
  const t = type.toLowerCase();
  if (t.includes('chair')) return 'seggiovia';
  if (t.includes('gondola') || t.includes('condola') || t.includes('cable car') || t.includes('cabin')) return 'cabinovia';
  if (t.includes('aerial') || t.includes('tramway')) return 'funivia';
  if (t.includes('funicular') || t.includes('railway') || t.includes('train')) return 'funicolare';
  if (t.includes('carpet') || t.includes('conveyor')) return 'tapis roulant';
  if (t.includes('ski') || t.includes('lift') || t.includes('t-bar') || t.includes('platter')) return 'skilift';
  return 'altro';
}

function liftStatus(cond) {
  const c = cond.toLowerCase();
  if (c === 'open' || c.startsWith('open')) return 'open';
  if (c.startsWith('closed')) return 'closed';
  if (c.includes('partial')) return 'partial';
  return 'unknown';
}

/** Elenco dei singoli impianti: "Info zu NOME" / "Type: ..." / "Conditions: ..." nella sezione Lifts. */
function parseLifts(L) {
  const start = L.indexOf('Lifts open');
  if (start < 0) return [];
  let end = L.findIndex((l, i) => i > start && (l === 'Piste' || l === 'Download winter sports report (PDF)'));
  if (end < 0) end = L.length;
  const out = [];
  for (let i = start; i < end - 2; i++) {
    if (!L[i].startsWith('Info zu ')) continue;
    const type = L[i + 1].startsWith('Type: ') ? L[i + 1].slice(6) : '';
    const condLine = L.slice(i + 1, i + 4).find((l) => l.startsWith('Conditions: '));
    out.push({
      name: L[i].slice(8),
      type,
      kind: liftKind(type),
      status: condLine ? liftStatus(condLine.slice(12)) : 'unknown',
    });
  }
  return out;
}

/** Riquadro riassuntivo in cima alla pagina: "Overview | 5° | sunny | 221 cm | 0 cm in resort | 8/30 | open". */
function parseOverview(L) {
  const i = L.findIndex((l, k) => l === 'Overview' && /°$/.test(L[k + 1] ?? ''));
  if (i < 0) return {};
  const win = L.slice(i + 1, i + 9);
  const resort = win.find((l) => /cm in resort$/.test(l));
  const top = win.find((l) => /^\d+ cm$/.test(l));
  const lifts = win.map(fraction).find(Boolean);
  return { snowBaseCm: num(resort), snowTopCm: num(top), lifts };
}

function parseComments(L) {
  const i = L.indexOf('Comments from the station crew:');
  if (i < 0) return null;
  const stop = new Set([
    'Source',
    'Cross-country skiing',
    'Snow Park',
    'Tobogganing',
    'Winter hiking/Snowshoeing',
    'Download winter sports report (PDF)',
    'Opening hours',
  ]);
  const out = [];
  for (let k = i + 1; k < L.length && out.length < 6 && !stop.has(L[k]); k++) out.push(L[k]);
  return out.length ? out.join('\n') : null;
}

function parseDetail(html) {
  const L = toLines(html);
  const coord = html.match(/lat:(-?[\d.]+);lng:(-?[\d.]+)/);
  const overview = parseOverview(L);

  const resortDepth = after(L, /^Depth of snow in resort( at \d+ metres)?$/);
  const topDepth = after(L, /^Depth of snow on upper runs( at \d+ metres)?$/);

  // Giornaliera: blocco "Tickets" (o "Tickets (Dynamic prices!)") seguito subito da "Key Value List" e "Adult:"
  let prices = null;
  const tStart = L.indexOf('Inhalte zu Tickets anzeigen');
  const tEnd = L.indexOf('Give feedback to this report', tStart);
  const ticketText = tStart >= 0 ? L.slice(tStart, tEnd > 0 ? tEnd : tStart + 60).join(' ') : '';
  const dynamic = /dynamic|dynamisch|dynamique/i.test(ticketText);
  const hdr = L.findIndex((l, i) => /^Tickets( \(.*\))?$/.test(l) && L[i + 1] === 'Key Value List' && L[i + 2] === 'Adult:');
  if (hdr >= 0) {
    const block = L.slice(hdr + 2, hdr + 9);
    const priceOf = (label) => {
      const i = block.findIndex((l) => l.startsWith(label));
      return i >= 0 ? num(block[i + 1]) : null;
    };
    prices = {
      adult: priceOf('Adult:'),
      youth: priceOf('Young person:'),
      child: priceOf('Children:'),
      dynamic: dynamic || /^from /.test(block[1] ?? ''),
    };
  } else if (dynamic) {
    prices = { adult: null, youth: null, child: null, dynamic: true };
  }

  // Sito ufficiale: primo link esterno nella sezione "Resort details"
  const det = L.indexOf('Resort details:');
  const website =
    det >= 0
      ? L.slice(det, det + 25).find((l) => /^https?:\/\//.test(l) && !/myswitzerland|stnet/.test(l)) ?? null
      : null;

  const lifts = fraction(after(L, 'Lifts open')?.value) ?? overview.lifts ?? null;
  const liftList = parseLifts(L);
  const hasCurrentData = !L.includes('Station does not provide current data!');
  const pistes = fraction(after(L, 'Pistes open (open today/total)')?.value);
  const runs = fraction(after(L, /^Runs down to resort \(open today \/ total\)$/)?.value);
  const lastUpdate = L.find((l) => l.startsWith('Last update:'));
  const lu = lastUpdate?.match(/(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2})/);

  return {
    lat: coord ? Number(coord[1]) : null,
    lon: coord ? Number(coord[2]) : null,
    baseAlt: resortDepth ? num(resortDepth.label) : null,
    topAlt: topDepth ? num(topDepth.label) : null,
    snowBaseCm: resortDepth ? num(resortDepth.value) : overview.snowBaseCm ?? null,
    snowTopCm: topDepth ? num(topDepth.value) : overview.snowTopCm ?? null,
    hasCurrentData,
    liftList,
    comments: parseComments(L),
    newSnowBaseCm: num(after(L, 'New snow in resort (past 24h)')?.value),
    newSnowTopCm: num(after(L, 'New snow in ski area (past 24h)')?.value),
    lastSnowfall: after(L, 'Last snowfall in ski area')?.value ?? null,
    snowCondition: after(L, 'Snow condition')?.value ?? null,
    slopeCondition: after(L, 'Slope condition')?.value ?? null,
    lifts,
    pistesKm: pistes,
    runsToValley: runs,
    liftsTotalArea: num(after(L, 'Number of lifts in ski area')?.value),
    openFrom: after(L, 'Installations open from')?.value?.replace(' hr', '') ?? null,
    openUntil: after(L, 'Installations open until')?.value?.replace(' hr', '') ?? null,
    seasonStart: parseDate(after(L, 'Start of season:')?.value),
    seasonEnd: parseDate(after(L, 'End of season:')?.value),
    prices,
    website,
    reportUpdatedAt: lu ? `${lu[3]}-${lu[2]}-${lu[1]}T${lu[4]}:${lu[5]}:00` : null,
  };
}

// ---------- webcam ----------

function distKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

async function fetchWebcams() {
  const json = JSON.parse(await get(WEBCAMS_URL));
  const offers = json.groupSet?.flatMap((g) => g.offers ?? []) ?? [];
  const cams = [];
  for (const o of offers) {
    const lat = o.address?.latitude;
    const lon = o.address?.longitude;
    const d = o.offerDetail?.find((x) => x.languageCode === 'it') ?? o.offerDetail?.[0];
    const img = d?.images?.[0];
    if (!lat || !lon || !img) continue;
    const size = (label) => img.size?.find((s) => s.label === label)?.url;
    cams.push({
      id: String(o.id),
      title: d.title ?? 'Webcam',
      image: size('medium') ?? img.url,
      thumb: size('small') ?? img.thumbnailUrl ?? img.url,
      full: img.url,
      player: d.movieUrl ?? d.detailUrl ?? null,
      lat,
      lon,
    });
  }
  return cams;
}

function mergeDuplicates(list) {
  const same = (a, b) =>
    a.lifts && b.lifts && a.pistesKm && b.pistesKm &&
    a.lifts.total >= 8 && a.pistesKm.total >= 30 &&
    a.lifts.total === b.lifts.total && a.lifts.open === b.lifts.open &&
    a.pistesKm.total === b.pistesKm.total && a.pistesKm.open === b.pistesKm.open &&
    a.lat != null && b.lat != null && distKm(a, b) < 30;
  const used = new Set();
  const out = [];
  for (let i = 0; i < list.length; i++) {
    if (used.has(i)) continue;
    const group = [list[i]];
    for (let j = i + 1; j < list.length; j++) {
      if (!used.has(j) && same(list[i], list[j])) {
        group.push(list[j]);
        used.add(j);
      }
    }
    if (group.length === 1) {
      out.push(list[i]);
      continue;
    }
    // la scheda principale: nome più corto; il bollettino aggiornato più di recente
    const main = [...group].sort((a, b) => a.name.length - b.name.length)[0];
    const newest = [...group].sort((a, b) => (b.reportUpdatedAt ?? '').localeCompare(a.reportUpdatedAt ?? ''))[0];
    const cams = new Map();
    for (const g of group) for (const c of g.webcams ?? []) cams.set(c.id, c);
    const places = [...new Set(group.map((g) => g.place))];
    out.push({
      ...newest,
      id: main.id,
      name: main.name,
      url: main.url,
      image: main.image ?? newest.image,
      place: places.join(' / '),
      website: main.website ?? newest.website,
      prices: main.prices ?? newest.prices,
      liftList: group.map((g) => g.liftList).sort((a, b) => b.length - a.length)[0],
      webcams: [...cams.values()].slice(0, 8),
      aliases: group.filter((g) => g.id !== main.id).map((g) => g.id),
      otherNames: [...new Set(group.map((g) => g.name).filter((n) => n !== main.name))],
    });
    console.log(`Uniti: ${group.map((g) => g.name).join(' + ')}`);
  }
  return out;
}

// ---------- main ----------

async function main() {
  const t0 = Date.now();
  const list = await fetchList();
  console.log(`Stazioni nell'elenco: ${list.length}`);

  let webcams = [];
  try {
    webcams = await fetchWebcams();
    console.log(`Webcam: ${webcams.length}`);
  } catch (e) {
    console.warn(`Webcam non disponibili: ${e.message}`);
  }

  const resorts = [];
  let failed = 0;
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const r = list[next++];
      try {
        const d = parseDetail(await get(r.url));
        const { listPrices, ...base } = r;
        if (listPrices && (!d.prices || d.prices.adult == null)) {
          d.prices = { ...listPrices, dynamic: d.prices?.dynamic ?? false };
        }
        resorts.push({ ...base, ...d });
      } catch (e) {
        failed++;
        console.warn(`✗ ${r.name}: ${e.message}`);
      }
      await sleep(250);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  for (const r of resorts) {
    if (r.lat == null) continue;
    r.webcams = webcams
      .map((c) => ({ c, d: distKm(r, c) }))
      .filter((x) => x.d <= WEBCAM_RADIUS_KM)
      .sort((a, b) => a.d - b.d)
      .slice(0, WEBCAMS_PER_RESORT)
      .map(({ c }) => ({ id: c.id, title: c.title, image: c.image, thumb: c.thumb, full: c.full, player: c.player }));
  }

  // Doppioni: lo stesso comprensorio pubblicato da due località (es. Verbier e Thyon - 4 Vallées).
  // Si riconoscono perché hanno esattamente gli stessi impianti e km di piste e sono vicini.
  const merged = mergeDuplicates(resorts);
  resorts.length = 0;
  resorts.push(...merged);

  // "Massimo di oggi": la sera molte stazioni segnano tutto chiuso. Ricordiamo quanti impianti/piste
  // erano aperti durante la giornata (ora svizzera) leggendo il file precedente.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date()); // YYYY-MM-DD
  let prev = new Map();
  try {
    const old = JSON.parse(await readFile('data/snow.json', 'utf8'));
    prev = new Map(old.resorts.map((r) => [r.id, r]));
  } catch {}
  for (const r of resorts) {
    // Prezzi e sito cambiano di rado: se oggi non sono pubblicati (es. stazione aperta, l'elenco non mostra
    // più la giornaliera), teniamo l'ultimo valore valido.
    const old = prev.get(r.id);
    if (old) {
      if ((!r.prices || r.prices.adult == null) && old.prices?.adult != null) {
        r.prices = { ...old.prices, dynamic: r.prices?.dynamic ?? old.prices.dynamic };
      }
      if (!r.website && old.website) r.website = old.website;
    }
    const p = prev.get(r.id)?.dayPeak;
    const same = p?.date === today;
    r.dayPeak = {
      date: today,
      lifts: Math.max(r.lifts?.open ?? 0, same ? p.lifts : 0),
      pistesKm: Math.max(r.pistesKm?.open ?? 0, same ? p.pistesKm : 0),
    };
  }

  resorts.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  if (resorts.length < list.length * 0.8) {
    throw new Error(`Troppi errori (${failed}/${list.length}): non sovrascrivo i dati.`);
  }

  await mkdir('data', { recursive: true });
  await writeFile(
    'data/snow.json',
    JSON.stringify({ updatedAt: new Date().toISOString(), source: 'MySwitzerland / infosnow / Guidle', resorts }),
  );
  const open = resorts.filter((r) => (r.lifts?.open ?? 0) > 0).length;
  console.log(
    `OK: ${resorts.length} stazioni (${open} con impianti aperti), ${failed} errori, ${((Date.now() - t0) / 1000).toFixed(0)}s`,
  );
}

// Se la fonte è giù per poco tempo non è un errore: teniamo i dati precedenti senza far fallire il job
// (niente email). Se i dati hanno più di 6 ore, il job fallisce e GitHub avvisa via email.
const MAX_STALE_HOURS = 6;

main().catch(async (e) => {
  if (e instanceof SourceDownError) {
    let ageH = Infinity;
    try {
      const old = JSON.parse(await readFile('data/snow.json', 'utf8'));
      ageH = (Date.now() - new Date(old.updatedAt).getTime()) / 3600000;
    } catch {}
    if (ageH < MAX_STALE_HOURS) {
      console.warn(`⚠️ Fonte non disponibile (${e.message}). Tengo i dati di ${ageH.toFixed(1)} ore fa.`);
      process.exit(0);
    }
    console.error(`❌ Fonte non disponibile da più di ${MAX_STALE_HOURS} ore: ${e.message}`);
    process.exit(1);
  }
  console.error(e);
  process.exit(1);
});
