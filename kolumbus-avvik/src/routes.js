// Kolumbus-ruter. Linjenumre og traséer er hentet fra Kolumbus' rutehefter og
// ruteendringene som gjelder fra 1. juli 2026. Holdeplasser er forenklet, og
// frekvenser og tider er laget for prototypen.

export const CATEGORIES = {
  bussveien: { label: 'Bussveien', color: '#c8102e', text: '#fff' },
  by: { label: 'Bybuss Nord-Jæren', color: '#00629b', text: '#fff' },
  ekspress: { label: 'Ekspressbuss', color: '#e35205', text: '#fff' },
  region: { label: 'Regionbuss', color: '#2e7d32', text: '#fff' },
  haugaland: { label: 'Haugalandet', color: '#6a3d9a', text: '#fff' },
  natt: { label: 'Nattbuss', color: '#1f2937', text: '#fff' },
  bat: { label: 'Båt og ferje', color: '#0b3b5c', text: '#fff' },
}

const r = (id, cat, stops, every, extra = {}) => ({ id, cat, stops, every, name: `${stops[0]} – ${stops[stops.length - 1]}`, ...extra })

export const ROUTES = [
  // Bussveien (åpnet 1. juli 2026)
  r('1', 'bussveien', ['Stavanger sentrum', 'Paradis', 'Mariero', 'Gausel', 'Forus', 'Lura', 'Sandnes sentrum'], 5, { note: 'Døgnåpen. Går på Bussveien.' }),
  r('2', 'bussveien', ['Stavanger sentrum', 'Paradis', 'Hinna', 'Jåttåvågen', 'Forus Nord'], 5, { note: 'Går på Bussveien.' }),

  // Bybusser Nord-Jæren
  r('3', 'by', ['Stavanger sentrum', 'Madlakrossen', 'Kvernevik', 'Viste hageby'], 15, { note: 'Ny rute fra 1. juli 2026.' }),
  r('4', 'by', ['Stavanger sentrum', 'Hillevåg', 'Sola sentrum', 'Tananger', 'Risavika'], 15),
  r('5', 'by', ['Sandnes sentrum', 'Stavanger sentrum', 'Tasta', 'Vardeneset', 'Dusavik', 'Randaberg'], 15),
  r('6', 'by', ['Stavanger sentrum', 'Madlakrossen', 'UiS Tjodhallen', 'Ullandhaug', 'Gausel', 'Lurahammaren', 'Sandnes sentrum'], 15),
  r('7', 'by', ['Stavanger sentrum', 'Madlakrossen', 'UiS Tjodhallen', 'Sola sentrum', 'Skadberg'], 15),
  r('8', 'by', ['Stavanger sentrum', 'Tasta', 'Vardeneset', 'Randaberg'], 20),
  r('9', 'by', ['Stavanger sentrum', 'Lervig', 'Hundvåg'], 10, { note: 'Het rute 1 før 1. juli 2026.' }),
  r('11', 'by', ['Stavanger sentrum', 'Våland', 'SUS', 'Åsen', 'Hinna', 'Jåttåvågen'], 15, { note: 'Går bare til Jåttåvågen fra 1. juli 2026.' }),
  r('13', 'by', ['Stavanger sentrum', 'Storhaug', 'Godalen'], 20),
  r('15', 'by', ['Stavanger sentrum', 'Tasta', 'Goa', 'Randaberg', 'Mekjarvik'], 30, { note: 'Venter opptil 5 minutter på ferjen fra Kvitsøy.' }),
  r('16', 'by', ['Stavanger sentrum', 'Madlakrossen', 'Madlasandnes'], 20, { note: 'Går ikke lenger via Lassa.' }),
  r('41', 'by', ['Sola sentrum', 'Tjelta'], 30),

  // Ekspressbusser
  r('X30', 'ekspress', ['Stavanger sentrum', 'Forus', 'Kvadrat'], 15),
  r('X31', 'ekspress', ['Stavanger sentrum', 'SUS', 'Gausel', 'Godeset'], 20),
  r('X74', 'ekspress', ['Hundvåg', 'Storhaug', 'Hillevåg', 'SUS', 'UiS Tjodhallen', 'Forus', 'Kvadrat'], 15),
  r('X76', 'ekspress', ['Randaberg', 'Viste hageby', 'Kvernevik', 'UiS Tjodhallen', 'Forus', 'Kvadrat'], 20),

  // Jæren og Dalane
  r('47', 'region', ['Sandnes sentrum', 'Sviland', 'Lauvvik'], 60),
  r('50', 'region', ['Bryne', 'Lye'], 60),
  r('58', 'region', ['Bryne', 'Klepp', 'Sandnes sentrum'], 30),
  r('62', 'region', ['Bryne', 'Ganddal', 'Sandnes sentrum'], 60),
  r('81', 'region', ['Egersund', 'Rundevoll'], 60),
  r('83', 'region', ['Egersund', 'Eigerøy'], 30),
  r('89', 'region', ['Egersund', 'Hauge i Dalane', 'Flekkefjord'], 120),

  // Ryfylke
  r('100', 'region', ['Stavanger sentrum', 'Solbakk', 'Jørpeland'], 30, { note: 'Går gjennom Ryfast.' }),
  r('101', 'region', ['Tau kai', 'Solbakk', 'Forus'], 60),
  r('140', 'region', ['Solbakk', 'Tau', 'Årdal', 'Hjelmeland'], 120),
  r('150', 'region', ['Ølen', 'Sandeid', 'Ropeid', 'Sauda'], 120, { note: 'Korrespondanse med hurtigbåten fra Stavanger.' }),

  // Haugalandet
  r('201', 'haugaland', ['Kvala', 'Haugesund sentrum', 'Amanda'], 15),
  r('202', 'haugaland', ['Vormedal', 'Haugesund sentrum', 'Amanda'], 20),
  r('209', 'haugaland', ['Haugesund', 'Kopervik', 'Åkrehamn'], 30),
  r('210', 'haugaland', ['Haugesund', 'Norheim', 'Avaldsnes', 'Kopervik', 'Veavågen', 'Åkrehamn', 'Skudeneshavn'], 30),
  r('X210', 'haugaland', ['Haugesund', 'Kopervik', 'Skudeneshavn'], 60),
  r('260', 'haugaland', ['Etne', 'Ølen', 'Aksdal', 'Haugesund'], 60),

  // Nattbusser
  r('N286', 'natt', ['Haugesund', 'Førre', 'Aksdal', 'Tysvær', 'Kårstø', 'Bokn'], 60, { note: 'Natt til lørdag og søndag.' }),
  r('N288', 'natt', ['Haugesund', 'Kopervik', 'Veavågen', 'Åkrehamn', 'Skudeneshavn'], 60, { note: 'Natt til lørdag og søndag.' }),

  // Båt og ferje
  r('800', 'bat', ['Stavanger (Fiskepiren)', 'Byøyene', 'Usken', 'Hommersåk'], 90, { mode: 'boat', note: 'Passasjerbåt.' }),
  r('Lysefjord', 'bat', ['Lauvvik', 'Forsand', 'Songesand', 'Flørli', 'Lysebotn'], 180, { mode: 'boat', note: 'Bilferje og passasjerbåt.' }),
  r('Kvitsøy', 'bat', ['Mekjarvik', 'Kvitsøy'], 60, { mode: 'boat', note: 'Bilferje. Rute 15 venter på ferjen.' }),
  r('Vassøy', 'bat', ['Stavanger', 'Vassøy'], 60, { mode: 'boat', note: 'Ferje.' }),
  r('Ryfylke', 'bat', ['Stavanger (Fiskepiren)', 'Hjelmeland', 'Sand', 'Sauda'], 180, { mode: 'boat', note: 'Hurtigbåt.' }),
  r('Utsira', 'bat', ['Haugesund', 'Utsira'], 240, { mode: 'boat', note: 'Ferje.' }),
]

export const routeById = (id) => ROUTES.find((x) => x.id.toLowerCase() === String(id).toLowerCase())

export const ALL_STOPS = [...new Set(ROUTES.flatMap((x) => x.stops))]

export const routesServing = (stop) => ROUTES.filter((x) => x.stops.some((s) => s.toLowerCase() === stop.toLowerCase()))

// Oppfunnede avganger: jevn frekvens med en fast forskyvning per linje
export function nextDepartures(route, now, count = 3) {
  const seed = [...route.id].reduce((a, c) => a + c.charCodeAt(0), 0) % route.every
  const minsNow = now.getHours() * 60 + now.getMinutes()
  let m = Math.ceil((minsNow - seed) / route.every) * route.every + seed
  const out = []
  for (let i = 0; i < count; i++, m += route.every) {
    const d = new Date(now)
    d.setHours(0, m, 0, 0)
    out.push(d)
  }
  return out
}

export const travelMinutes = (route, a, b) => Math.max(3, Math.abs(route.stops.indexOf(b) - route.stops.indexOf(a)) * (route.cat === 'bat' ? 25 : route.cat === 'region' || route.cat === 'haugaland' ? 12 : 6))
