# Modifiche in attesa del prossimo APK

L'APK installato è la **build 4 (versione 1.2.0)**.
Le modifiche qui sotto sono già nel codice (ramo `main`) ma **non ancora in un APK**.
Regola concordata: prima di costruire un APK si manda l'elenco completo all'utente e si aspetta il suo okay.

## Da includere nella versione 1.3.0
1. **Pericolo valanghe funzionante** (17.11.2026): grado SLF colorato con +/−, nome della zona,
   problemi principali (es. "neve ventata sopra 2600 m") e validità del bollettino.
   Prima l'app leggeva il file SLF sbagliato e mostrava sempre "nessun bollettino".
2. **Scheda più veloce**: non scarica più il bollettino SLF (2 MB) dal telefono; il grado arriva con i dati orari.
3. **Nuovo aspetto della lista stazioni** (17.11.2026, richiesto dall'utente), sempre tema chiaro:
   - schede bianche ben separate, con ombra leggera e più spazio tra una e l'altra
   - barra colorata a sinistra secondo lo stato (verde aperta, grigio-blu impianti aperti, arancione dati vecchi, blu in apertura, grigio chiusa)
   - riquadri con icone per impianti, neve in quota, neve nuova, neve in arrivo; etichette per meteo, piste e prezzo
   - riepilogo "Oggi in Svizzera" in cima (aperte, con neve fresca, neve in arrivo: toccabili)
   - barra di ricerca con icona, filtri più puliti
   - ordinamento "Impianti aperti": prima le stazioni aperte, poi solo impianti, dati vecchi, in apertura, chiuse
   - anteprima: `assets/brand/preview_lista_v1.3.png`

## Già attivo senza nuovo APK (arriva con i dati)
- Gestione delle interruzioni del sito di Svizzera Turismo (16.11.2026)
- Gradi di pericolo valanghe calcolati ogni ora nel file dei dati (visibili solo con l'APK 1.3.0)
