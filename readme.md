# Utstyrssporer - Enkel klient

Kort beskrivelse:
- Enkel nettklient for å vise og låne utstyr.
- Bruker Supabase for autentisering og lagring (tabell `equipment`).

Filoversikt:
- `index.html` - Innloggingsside (brukernavn/passord).
- `main.html` - Hovedside med utstyrsliste og knapper.
- `script.js` - All klientlogikk: innlogging, lasting, utlån, oppdatering.
- `style.css` - Styling og tema-støtte.

Raskt oppsett:
1. Åpne `index.html` og logg inn.
2. På `main.html` kan du legge til utstyr og klikke en rad for å låne/leverer.

Utviklingstips:
- `script.js` inneholder korte kommentarer ved funksjonene for å forklare hva de gjør.
- Hvis e-post for låner skal vises/lagres, legges feltet `loaned_by_email` til i databasen.

