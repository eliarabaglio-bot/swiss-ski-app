# ❄️ SwiSki

App per iPhone e Android con meteo, neve, pericolo valanghe, webcam e informazioni sulle stazioni sciistiche svizzere.

## Cosa fa (versione 1)

- **Elenco di 41 stazioni**, con ricerca, filtro per regione e ordinamento (neve fresca, neve in arrivo, quota, prezzo, A–Z)
- Per ogni stazione:
  - temperatura in vetta e a valle
  - neve caduta nelle ultime 24h, neve prevista nelle prossime 48h, altezza del manto (stima)
  - previsioni a 7 giorni
  - vento e zero termico
  - pericolo valanghe dal bollettino ufficiale SLF
  - km di piste, numero di impianti, prezzo indicativo della giornaliera
  - webcam
- **Mappa** della Svizzera, con le stazioni colorate in base alla neve fresca
- **Preferiti**, salvati sul telefono

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

## Webcam integrate (facoltativo, gratis)

1. Crea un account su https://api.windy.com/keys e genera una chiave per **Webcams API** (piano gratuito).
2. In `app.json` incolla la chiave in `"windyApiKey": ""`.

Senza la chiave, l'app mostra un link alle webcam sul sito della stazione.

## Fonti dei dati

| Dato | Fonte |
|---|---|
| Meteo, temperature, nevicate, manto nevoso (stima) | [Open-Meteo](https://open-meteo.com) (modelli, incluso MeteoSvizzera) |
| Pericolo valanghe | [SLF](https://www.slf.ch) |
| Webcam | [Windy Webcams](https://api.windy.com) |
| Piste, impianti, prezzi | Valori indicativi in `src/data/resorts.ts` |

## Prossimi passi

- [ ] Stato in tempo reale degli impianti (aperti/chiusi, seggiovie aperte), raccolto ogni ora da GitHub Actions
- [ ] Prezzi aggiornati automaticamente
- [ ] Notifiche di neve fresca per le stazioni preferite (richiede una "development build")
- [ ] Estendere l'elenco a tutte le stazioni svizzere

## Struttura del codice

```
src/
  app/               schermate (Expo Router)
    (tabs)/          Stazioni, Mappa, Preferiti, Info
    resort/[id].tsx  scheda della stazione
  components/        componenti riutilizzabili
  data/resorts.ts    elenco delle stazioni
  lib/               meteo, valanghe, webcam, preferiti
  theme.ts           colori
```
