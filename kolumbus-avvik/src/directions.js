// Veibeskrivelse til en holdeplass: avstand, retning, riktig plattform og (når nettet tillater
// det) gangrute sving for sving fra OpenStreetMap-baserte routing.openstreetmap.de.
import { PATTERNS, QUAYS, STATIONS } from './routes.js'

// Brukes når posisjonen din ikke er tilgjengelig: inngangen til Kjølv Egelands hus på UiS
export const DEMO_LOCATION = { lat: 58.93835, lon: 5.6922, demo: true }

const R = 6371000
const toRad = (d) => (d * Math.PI) / 180
export function distance(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function bearing(a, b) {
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const COMPASS8 = ['nord', 'nordøst', 'øst', 'sørøst', 'sør', 'sørvest', 'vest', 'nordvest']
export const heading = (a, b) => COMPASS8[Math.round(bearing(a, b) / 45) % 8]

// Gangavstand er lengre enn luftlinje; 1,3 er et vanlig anslag i by
export const walkMeters = (a, b) => Math.round((distance(a, b) * 1.3) / 10) * 10
export const walkMinutes = (m) => Math.max(1, Math.round(m / 80))
export const fmtDistance = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(m / 10) * 10} m`)

// Plattformene på en holdeplass, med linjene og retningene som går derfra
export function platformsOf(stopName) {
  const map = new Map()
  PATTERNS.forEach((p) =>
    p.quays.forEach((q, i) => {
      if (q.station.name !== stopName || i === p.quays.length - 1) return
      const e = map.get(q) ?? { quay: q, lines: new Set(), toward: new Set() }
      if (p.route.cat !== 'skole') {
        e.lines.add(p.route.id)
        e.toward.add(p.headsign.split(' via ')[0])
      }
      map.set(q, e)
    }),
  )
  return [...map.values()]
    .filter((e) => e.lines.size)
    .map((e) => ({ platform: e.quay.platform || '–', lat: e.quay.lat, lon: e.quay.lon, lines: [...e.lines].sort((a, b) => a.localeCompare(b, 'nb', { numeric: true })), toward: [...e.toward] }))
    .sort((a, b) => a.platform.localeCompare(b.platform))
}

export function nearestStops(loc, n = 3) {
  return STATIONS.map((s) => ({ name: s.name, d: distance(loc, s) }))
    .filter((s, i, a) => a.findIndex((x) => x.name === s.name) === i)
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
}

// Målpunkt: plattformen for linjen/retningen hvis vi vet den, ellers nærmeste plattform
export function targetFor(stopName, loc, { line, toward } = {}) {
  const platforms = platformsOf(stopName)
  const fallback = STATIONS.find((s) => s.name === stopName)
  if (!platforms.length) return fallback ? { lat: fallback.lat, lon: fallback.lon, platform: null, platforms } : null
  const match = line && platforms.find((p) => p.lines.includes(line) && (!toward || p.toward.some((t) => toward.startsWith(t))))
  const pick = match ?? [...platforms].sort((a, b) => distance(loc, a) - distance(loc, b))[0]
  return { ...pick, platforms }
}

const TURN = {
  left: 'til venstre',
  right: 'til høyre',
  'slight left': 'svakt til venstre',
  'slight right': 'svakt til høyre',
  'sharp left': 'skarpt til venstre',
  'sharp right': 'skarpt til høyre',
  straight: 'rett fram',
  uturn: 'helt rundt',
}

function stepText(s, i, steps) {
  const name = s.name || 'gangveien'
  const turn = TURN[s.maneuver.modifier] ?? ''
  switch (s.maneuver.type) {
    case 'depart':
      return `Gå ${s.maneuver.bearing_after !== undefined ? COMPASS8[Math.round(s.maneuver.bearing_after / 45) % 8] : ''} langs ${name}`.replace('  ', ' ')
    case 'arrive':
      return i === steps.length - 1 ? 'Du er fremme ved holdeplassen' : `Fortsett ${turn}`
    case 'turn':
    case 'end of road':
      return `Ta ${turn} inn på ${name}`
    case 'fork':
      return `Hold ${turn} mot ${name}`
    case 'roundabout':
    case 'rotary':
      return `Gå gjennom rundkjøringen mot ${name}`
    default:
      return turn && turn !== 'rett fram' ? `Hold ${turn} langs ${name}` : `Fortsett langs ${name}`
  }
}

const cache = new Map()

// Gangrute sving for sving. Gir null uten nett eller hvis tjenesten ikke svarer, og appen
// faller da tilbake til luftlinje med retning.
export async function fetchWalkRoute(from, to) {
  const key = [from.lat, from.lon, to.lat, to.lon].map((x) => x.toFixed(5)).join(',')
  if (cache.has(key)) return cache.get(key)
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(res.status)
    const json = await res.json()
    const route = json.routes?.[0]
    if (!route) throw new Error('ingen rute')
    const steps = route.legs[0].steps
    const out = {
      meters: Math.round(route.distance),
      path: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      steps: steps.map((s, i) => ({ text: stepText(s, i, steps), meters: Math.round(s.distance) })).filter((s, i, a) => s.meters > 0 || i === a.length - 1),
    }
    cache.set(key, out)
    return out
  } catch {
    // Ikke mellomlagre feil, så den prøver igjen når nettet er tilbake
    return null
  }
}
