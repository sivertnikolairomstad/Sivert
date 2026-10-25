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
| Reise | Søk på en holdeplass (f.eks. UiS øst): nærmeste avgang øverst, resten sortert etter retning (nord/øst/sør/vest). Med reisemål vises bare avganger dit, med ankomsttid. Trykk på en avgang for å følge bussen: hvor den er, hvor mange stopp den har igjen og når den er fremme «Rapporter» oppdaterer linjen for alle, og trafikksentralen svarer. «Alle linjer» viser hele linjenettet |
| Kart | Alle busser i trafikk nå på kartet (simulert fra rutetabellen). Trykk på en buss for neste stopp og forsinkelse, og «Følg bussen» |
| Nyheter | Siste oppdateringer fra Kolumbus, med «Nyttig» og «Still spørsmål om dette» |
| Hjelp | Chat som kjenner alle linjene (`src/assistant.js`). Spør om avganger: «Når går 7 fra Madlakrossen?», «siste buss til Sandnes», «første buss i morgen», «kl. 18 fra UiS til sentrum», «båten til Hommersåk». Svarene vises som en liten avgangstavle. Setter deg over til et menneske ved behov |
| Teori | Grunig & Hunt, Cornelissen, SCCT, Stakeholder Salience, UGT, POEM og crowdcasting |

### Data

Linjer, holdeplasser, plattformer og avgangstider er **ekte**. De kommer fra Kolumbus' åpne
GTFS-data hos Entur (311 linjer og 2843 holdeplasser, med rutetider for en vanlig hverdag,
lørdag og søndag). Dataene ligger i `src/gtfs.json`, som bygges slik:

```bash
curl -o kol.zip https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_kol-aggregated-gtfs.zip
python3 scripts/build-gtfs.py kol.zip
```

Det som er oppdiktet: bussenes posisjon og forsinkelse (regnet ut fra rutetabellen, ikke GPS), avviket på linje 6, ekstrabussen 6E, belegg, rapporter og chat-svarene
fra trafikksentralen. Retning (nord/øst/sør/vest) regnes ut fra holdeplassenes koordinater.

- `src/routes.js` – linjer og holdeplasser
- `src/board.js` – avgangstavle per holdeplass
- `src/live.js` – simulert sanntid: posisjon for alle busser og sporing av én tur
- `src/components/MapView.jsx` – kartet (Leaflet, kartbilder fra OpenStreetMap/CARTO)
- `src/directions.js` – veibeskrivelse: avstand, retning, riktig plattform og gangrute sving for sving (routing.openstreetmap.de), med luftlinje som reserve uten nett
- `src/assistant.js` – chatten

**Snarveier under presentasjonen:** `A` slår avvik av/på, `1`–`5` bytter fane.

React 18 · Tailwind CSS v4 · Framer Motion · lucide-react. Scenario og tekster ligger i `src/data.js`.
