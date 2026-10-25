# Move Rogaland – toveis kommunikasjon ved driftsavvik

Konseptprototype for BDS110 Showcase (UiS, Tjodhallen), basert på oppgaven om Kolumbus.
Hovedprinsippet er toveis kommunikasjon: appen er en dialogplattform der reisende og
trafikksentralen løser avvik sammen, ikke en kanal som bare sender ut informasjon.

## Åpne prototypen

- **Uten oppsett:** åpne `../Move-Rogaland.html` i nettleseren. Én frittstående fil som virker uten nett.
- **Utvikling:** `npm install && npm run dev`
- **Bygg:** `npm run build` gir `dist/index.html` (også én fil, som deployes på Vercel)

## Innhold

| Fane | Toveis-funksjon |
| --- | --- |
| Toppbar | «Simuler avvik»-bryter. Avviksvarselet ber brukeren svare: gi beskjed om forsinkelse eller snakk med trafikksentralen |
| Reise | Søk på en holdeplass: nærmeste avgang øverst, resten sortert etter retning (nord/øst/sør/vest). Med reisemål vises bare avganger dit, med ankomsttid. «Rapporter» oppdaterer linjen for alle, og trafikksentralen svarer. «Alle linjer» viser hele linjenettet |
| Nyheter | Siste oppdateringer fra Kolumbus, med «Nyttig» og «Still spørsmål om dette» |
| Hjelp | Chat som kjenner alle linjene (`src/assistant.js`): linjer, holdeplasser, reiser mellom steder og avganger. Setter deg over til et menneske ved behov |
| Teori | Grunig & Hunt, Cornelissen, SCCT, Stakeholder Salience, UGT, POEM og crowdcasting |

Linjenettet ligger i `src/routes.js`, avgangstavlen i `src/board.js` og omtrentlige koordinater for retning i `src/coords.js`. Linjenumre og traséer bygger på Kolumbus' rutehefter
og ruteendringene fra 1. juli 2026. Holdeplasser er forenklet, og alle tider er oppdiktet.

**Snarveier under presentasjonen:** `A` slår avvik av/på, `1`–`4` bytter fane.

React 18 · Tailwind CSS v4 · Framer Motion · lucide-react. Scenario og tekster ligger i `src/data.js`.
