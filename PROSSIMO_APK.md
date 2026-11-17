# Modifiche in attesa del prossimo APK

L'APK installato è la **build 4 (versione 1.2.0)**.
Le modifiche qui sotto sono già nel codice (ramo `main`) ma **non ancora in un APK**.
Regola concordata: prima di costruire un APK si manda l'elenco completo all'utente e si aspetta il suo okay.

## Da includere nella versione 1.3.0
1. **Pericolo valanghe funzionante** (17.11.2026): grado SLF colorato con +/−, nome della zona,
   problemi principali (es. "neve ventata sopra 2600 m") e validità del bollettino.
   Prima l'app leggeva il file SLF sbagliato e mostrava sempre "nessun bollettino".
2. **Scheda più veloce**: non scarica più il bollettino SLF (2 MB) dal telefono; il grado arriva con i dati orari.

## Già attivo senza nuovo APK (arriva con i dati)
- Gestione delle interruzioni del sito di Svizzera Turismo (16.11.2026)
- Gradi di pericolo valanghe calcolati ogni ora nel file dei dati (visibili solo con l'APK 1.3.0)
