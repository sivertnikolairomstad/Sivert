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
| Toppbar | «Simuler avvik»-bryter. Krisekortet ber brukeren svare («Gi beskjed at jeg blir forsinket» / «Start direkte dialog med operatør») |
| 1 · Reise & avvik | Sanntidsavganger UiS Tjodhallen → Stavanger sentrum. «Rapporter situasjon» oppdaterer linjen for alle, og trafikksentralen svarer |
| 2 · Support & dialog | Chat med AI som svarer med en gang, overlevering til menneske, hurtigvalg, egne meldinger og tilbakemelding på svar |
| 3 · SoMe-dialog | Gammel enveis-praksis og ny toveis-modell side om side, avspilt steg for steg (kontekstkollaps) |
| 4 · Teoridashbord | Grunig & Hunt, Cornelissen, SCCT, Stakeholder Salience, UGT, POEM og crowdcasting |

**Snarveier under presentasjonen:** `A` slår avvik av/på, `1`–`4` bytter fane.

React 18 · Tailwind CSS v4 · Framer Motion · lucide-react. Scenario og tekster ligger i `src/data.js`.
