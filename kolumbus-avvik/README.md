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
| Reise | Søk på en holdeplass (f.eks. UiS øst): nærmeste avgang øverst, resten sortert etter retning (nord/øst/sør/vest). Med reisemål vises bare avganger dit, med ankomsttid. «Rapporter» oppdaterer linjen for alle, og trafikksentralen svarer. «Alle linjer» viser hele linjenettet |
| Nyheter | Siste oppdateringer fra Kolumbus, med «Nyttig» og «Still spørsmål om dette» |
| Hjelp | Chat som kjenner alle linjene (`src/assistant.js`): linjer, holdeplasser, reiser mellom steder og avganger. Setter deg over til et menneske ved behov |
| Teori | Grunig & Hunt, Cornelissen, SCCT, Stakeholder Salience, UGT, POEM og crowdcasting |

### Data

Linjer, holdeplasser, plattformer og avgangstider er **ekte**. De kommer fra Kolumbus' åpne
GTFS-data hos Entur (311 linjer og 2843 holdeplasser, med rutetider for en vanlig hverdag,
lørdag og søndag). Dataene ligger i `src/gtfs.json`, som bygges slik:

```bash
curl -o kol.zip https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_kol-aggregated-gtfs.zip
python3 scripts/build-gtfs.py kol.zip
```

Det som er oppdiktet: avviket på linje 6, ekstrabussen 6E, belegg, rapporter og chat-svarene
fra trafikksentralen. Retning (nord/øst/sør/vest) regnes ut fra holdeplassenes koordinater.

- `src/routes.js` – linjer og holdeplasser
- `src/board.js` – avgangstavle per holdeplass
- `src/assistant.js` – chatten

**Snarveier under presentasjonen:** `A` slår avvik av/på, `1`–`4` bytter fane.

React 18 · Tailwind CSS v4 · Framer Motion · lucide-react. Scenario og tekster ligger i `src/data.js`.
