# ❄️ SwiSki

App per iPhone e Android con meteo, neve, pericolo valanghe, webcam e informazioni sulle stazioni sciistiche svizzere.

## Cosa fa

- **174 stazioni svizzere**, con ricerca, filtro "aperte oggi", filtro per regione e ordinamento (impianti aperti, neve, neve fresca, neve in arrivo, prezzo, A–Z)
- Per ogni stazione:
  - **impianti aperti** (es. 8/30), divisi per tipo: funivie, cabinovie, seggiovie, skilift, con l'**elenco dei singoli impianti** quando la stazione lo pubblica
  - km di piste aperte e discese a valle
  - **neve misurata** in quota e in paese, neve fresca, qualità della neve, ultima nevicata
  - **prezzi della giornaliera** (adulti, ragazzi, bambini), con indicazione dei prezzi dinamici
  - **webcam** con le immagini aggiornate, a schermo intero e con il link live / 360°
  - meteo attuale e previsioni a 7 giorni, neve prevista, vento, zero termico
  - pericolo valanghe dal bollettino ufficiale SLF
  - comunicazioni della stazione, orari e date della stagione
- **Mappa** con le stazioni colorate per stato (aperta / apre a breve / chiusa) o per neve fresca
- **Preferiti** salvati sul telefono

## Da dove arrivano i dati

Ogni ora (dalle 6 alle 21) GitHub esegue `scripts/scrape.mjs`, che legge il bollettino neve ufficiale di Svizzera Turismo e l'elenco delle webcam, e salva tutto in `data/snow.json`. L'app scarica quel file. Se non c'è connessione, usa l'ultima copia salvata.

Puoi lanciarlo anche a mano: vai su GitHub, poi **Actions** → **Aggiorna dati neve** → **Run workflow**.

## Come provarla sul telefono (da PC Windows)

Va fatto solo la prima volta.

1. **Installa Node.js:** scarica la versione **LTS** da https://nodejs.org e installala lasciando le opzioni predefinite (Avanti, Avanti, Fine).
2. **Installa Git:** scaricalo da https://git-scm.com/download/win e installalo con le opzioni predefinite.
3. Sul telefono installa **Expo Go** dall'App Store o dal Play Store.
4. Sul PC apri il menu Start, cerca **PowerShell** e aprilo. Incolla questi comandi, uno alla volta, premendo Invio dopo ciascuno:

```bash
git clone https://github.com/eliarabaglio-bot/swiss-ski-app.git
```

```bash
cd swiss-ski-app
```

```bash
npm install
```

## Avviare l'app (ogni volta)

In PowerShell, dalla cartella `swiss-ski-app`:

```bash
npx expo start
```

Sullo schermo compare un **codice QR**:
- **iPhone:** inquadralo con la fotocamera e tocca il link per aprirlo in Expo Go
- **Android:** apri Expo Go e tocca "Scan QR code"

⚠️ PC e telefono devono essere sulla **stessa rete Wi-Fi**. Se non si collegano, prova con:

```bash
npx expo start --tunnel
```

Per scaricare gli aggiornamenti che faccio io:

```bash
git pull
```

## Fonti dei dati

| Dato | Fonte |
|---|---|
| Impianti, piste, neve misurata, prezzi, stagione | [Bollettino neve MySwitzerland](https://snow.myswitzerland.com) (dati inseriti dalle stazioni tramite infosnow / SISAG) |
| Webcam | Guidle / Svizzera Turismo |
| Meteo e neve prevista | [Open-Meteo](https://open-meteo.com) (modelli, incluso MeteoSvizzera) |
| Pericolo valanghe | [SLF](https://www.slf.ch) |

## Prossimi passi

- [x] Impianti aperti/chiusi in tempo reale
- [x] Prezzi aggiornati automaticamente
- [x] Webcam con le immagini dentro l'app
- [x] Tutte le stazioni svizzere
- [ ] Notifiche di neve fresca per le stazioni preferite (richiede una "development build")

## Struttura del codice

```
src/
  app/               schermate (Expo Router)
    (tabs)/          Stazioni, Mappa, Preferiti, Info
    resort/[id].tsx  scheda della stazione
  components/        componenti riutilizzabili
  data/types.ts      struttura dei dati
  lib/               dati (store), meteo, valanghe, preferiti
scripts/scrape.mjs   raccoglie i dati (gira ogni ora su GitHub Actions)
data/snow.json       dati raccolti
  theme.ts           colori
```
