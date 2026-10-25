// Kolumbus' linjenett fra Entur (GTFS), bygget med scripts/build-gtfs.py.
// Holdeplasser, plattformer og avgangstider er ekte for en vanlig hverdag, lørdag og søndag.
import DATA from './gtfs.json' with { type: 'json' }

export const CATEGORIES = {
  bussveien: { label: 'Bussveien', color: '#c8102e', text: '#fff' },
  by: { label: 'Bybuss Nord-Jæren', color: '#00629b', text: '#fff' },
  ekspress: { label: 'Ekspressbuss', color: '#e35205', text: '#fff' },
  jaeren: { label: 'Jæren og Dalane', color: '#2e7d32', text: '#fff' },
  ryfylke: { label: 'Ryfylke', color: '#00796b', text: '#fff' },
  haugaland: { label: 'Haugalandet', color: '#6a3d9a', text: '#fff' },
  natt: { label: 'Nattbuss', color: '#1f2937', text: '#fff' },
  bat: { label: 'Båt og ferje', color: '#0b3b5c', text: '#fff' },
  skole: { label: 'Skolebuss', color: '#8a6d00', text: '#fff' },
}

export const STATIONS = DATA.stations.map(([name, lat, lon]) => ({ name, lat, lon }))
const QUAYS = DATA.quays.map(([s, platform]) => ({ station: STATIONS[s], platform }))
export const PATTERNS = DATA.patterns.map(([r, dir, headsign, q, o, t]) => ({ r, dir, headsign, quays: q.map((i) => QUAYS[i]), offs: o, times: t }))

// 0 = hverdag, 1 = lørdag, 2 = søndag
export const dayIndex = (d) => (d.getDay() === 6 ? 1 : d.getDay() === 0 ? 2 : 0)

const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null)

export const ROUTES = DATA.routes.map(([id, cat, longName], idx) => {
  const own = PATTERNS.filter((p) => p.r === idx)
  const trips = (p) => p.times[0].length + p.times[1].length + p.times[2].length
  const main = own.reduce((a, b) => (trips(b) > trips(a) ? b : a))
  const starts = main.times[0].length ? main.times[0] : main.times[1].length ? main.times[1] : main.times[2]
  const day = starts.filter((m) => m >= 420 && m <= 1080)
  const gaps = day.slice(1).map((m, i) => m - day[i])
  const stops = main.quays.map((q) => q.station.name).filter((n, i, a) => n !== a[i - 1])
  const route = {
    id,
    idx,
    cat,
    mode: cat === 'bat' ? 'boat' : 'bus',
    stops,
    main,
    every: median(gaps.filter((g) => g > 0)) ?? null,
    name: longName || `${stops[0]} – ${stops[stops.length - 1]}`,
  }
  own.forEach((p) => (p.route = route))
  return route
})

export const routeById = (id) => ROUTES.find((x) => x.id.toLowerCase() === String(id).toLowerCase())

export const ALL_STOPS = [...new Set(STATIONS.map((s) => s.name))].sort((a, b) => a.localeCompare(b, 'nb'))

export const routesServing = (stop) => ROUTES.filter((r) => PATTERNS.some((p) => p.route === r && p.quays.some((q) => q.station.name === stop)))

export const dateAt = (now, minutes) => {
  const d = new Date(now)
  d.setHours(0, minutes, 0, 0)
  return d
}

// Neste avganger fra linjens første holdeplass, etter dagens rutetabell
export function nextDepartures(route, now, count = 3) {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const day = dayIndex(now)
  const starts = PATTERNS.filter((p) => p.route === route && p.dir === route.main.dir && p.quays[0].station.name === route.stops[0]).flatMap((p) => p.times[day])
  return [...new Set(starts)]
    .filter((m) => m >= nowMin)
    .sort((a, b) => a - b)
    .slice(0, count)
    .map((m) => dateAt(now, m))
}

export function travelMinutes(route, a, b) {
  for (const p of PATTERNS.filter((p) => p.route === route)) {
    const i = p.quays.findIndex((q) => q.station.name === a)
    const j = p.quays.findIndex((q, k) => k > i && q.station.name === b)
    if (i >= 0 && j > i) return Math.max(1, p.offs[j] - p.offs[i])
  }
  return null
}

// Kallenavn folk bruker om de største holdeplassene
export const ALIASES = {
  uis: 'UiS øst',
  universitetet: 'UiS øst',
  tjodhallen: 'UiS øst',
  sentrum: 'Stavanger bussterminal',
  stavanger: 'Stavanger bussterminal',
  byen: 'Stavanger bussterminal',
  sandnes: 'Sandnes bussterminal Ruten',
  ruten: 'Sandnes bussterminal Ruten',
  sola: 'Sola ungdomsskole',
  flyplassen: 'Stavanger lufthavn',
  flyplass: 'Stavanger lufthavn',
  sola_flyplass: 'Stavanger lufthavn',
  sus: 'SUS Våland',
  sykehuset: 'SUS Våland',
  forus: 'Forus nord',
  randaberg: 'Randaberg sentrum',
  tananger: 'Tananger kirke',
  hinna: 'Hinna sentrum',
  haugesund: 'Haugesund bussterminal',
  bryne: 'Bryne stasjon',
  egersund: 'Egersund bussterminal',
  jørpeland: 'Jørpelandsvågen',
  sauda: 'Sauda bussterminal',
  tau: 'Tau kai',
}
