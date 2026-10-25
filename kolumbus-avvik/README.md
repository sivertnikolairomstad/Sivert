# Kolumbus – avviksvarsel (prototype)

Interaktiv mobilprototype som viser proaktiv kommunikasjon ved driftsavvik:
buss 2 til Tananger er innstilt, og brukeren får umiddelbart to handlinger.

- **Se alternativ rute (Buss 3)** – bunnark med holdeplasser, gangtid og sanntid; «Bytt til denne reisen» oppdaterer varselet og reiseplanen.
- **Åpne chat med kundeservice** – avviket legges ved automatisk, hurtigsvar for vanlige spørsmål.

React 18 · Tailwind CSS v4 · Framer Motion · lucide-react. Mock-data i `src/data.js`.

```bash
npm install
npm run dev
```

Telefonramme på desktop, fullskjerm på mobil. Respekterer `prefers-reduced-motion`.
