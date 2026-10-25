// Avgangstavle for en holdeplass med ekte avgangstider fra GTFS-dataene.
// Retningen (nord/øst/sør/vest) regnes ut fra holdeplassen til endeholdeplassen.
import { PATTERNS, dayIndex, dateAt } from './routes.js'

export const DIRECTIONS = ['nord', 'øst', 'sør', 'vest']

function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const compass = (deg) => DIRECTIONS[Math.round(deg / 90) % 4]
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

// Hvilke kjøremønstre stopper ved hver holdeplass (etter navn)
const AT = new Map()
PATTERNS.forEach((p, pi) =>
  p.quays.forEach((q, pos) => {
    if (pos === p.quays.length - 1) return
    const list = AT.get(q.station.name) ?? []
    list.push([pi, pos])
    AT.set(q.station.name, list)
  }),
)

export function board(from, now, { to, count = 3, horizon = 180 } = {}) {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const day = dayIndex(now)
  const prevDay = dayIndex(new Date(+now - 86400000))
  const seen = new Map() // key → antall
  const out = []
  const candidates = []

  for (const [pi, pos] of AT.get(from) ?? []) {
    const p = PATTERNS[pi]
    let pos2 = -1
    if (to) {
      pos2 = p.quays.findIndex((q, k) => k > pos && q.station.name === to)
      if (pos2 < 0) continue
    }
    const here = p.quays[pos]
    const end = p.quays[p.quays.length - 1].station
    const dir = compass(bearing(here.station, end))
    const push = (m) => {
      if (m < nowMin || m > nowMin + horizon) return
      candidates.push({ p, pos, pos2, here, end, dir, m })
    }
    p.times[day].forEach((s) => push(s + p.offs[pos]))
    // Turer fra i går som går over midnatt
    p.times[prevDay].forEach((s) => s + p.offs[pos] >= 1440 && push(s + p.offs[pos] - 1440))
  }

  candidates.sort((a, b) => a.m - b.m)
  for (const c of candidates) {
    const line = c.p.route.id
    const key = `${line}|${c.p.headsign}`
    const n = seen.get(key) ?? 0
    // Samme avgang kan komme fra flere kjøremønstre; hopp over duplikater
    if (out.some((d) => d.key === key && +d.at === +dateAt(now, c.m))) continue
    if (n >= count) continue
    seen.set(key, n + 1)
    const travel = c.pos2 >= 0 ? c.p.offs[c.pos2] - c.p.offs[c.pos] : null
    out.push({
      id: `${key}|${c.m}`,
      key,
      line,
      route: c.p.route,
      toward: c.p.headsign || c.end.name,
      dir: c.dir,
      at: dateAt(now, c.m),
      travel,
      arrive: travel !== null ? dateAt(now, c.m + travel) : null,
      platform: c.p.route.mode === 'boat' ? 'Kai' : c.here.platform || '–',
      crowd: ((hash(key + n) % 70) + 10) / 100,
    })
  }
  return out
}

// Demoavviket: neste linje 6 fra UiS øst nordover mot Stavanger er innstilt
export const DISRUPTED = { stop: 'UiS øst', line: '6', dir: 'nord' }

export const isDisrupted = (d) => d.line === DISRUPTED.line && d.dir === DISRUPTED.dir

export function cancelledDeparture(now) {
  return board(DISRUPTED.stop, now, { count: 1, horizon: 600 }).find(isDisrupted)
}

// Hvor viktig holdeplassen er: antall vanlige linjer (ikke skolebuss), deretter antall kjøremønstre
export const stopWeight = (name) => {
  const list = AT.get(name) ?? []
  const lines = new Set(list.filter(([pi]) => PATTERNS[pi].route.cat !== 'skole').map(([pi]) => PATTERNS[pi].route.id))
  return lines.size * 1000 + list.length
}

// Linjene som stopper ved holdeplassen, sortert som linjenumre
export function stopLines(name) {
  const routes = [...new Set((AT.get(name) ?? []).map(([pi]) => PATTERNS[pi].route))]
  // Vanlige linjer før skolebusser
  return routes.sort((a, b) => (a.cat === 'skole') - (b.cat === 'skole') || a.id.localeCompare(b.id, 'nb', { numeric: true })).map((r) => r.id)
}
