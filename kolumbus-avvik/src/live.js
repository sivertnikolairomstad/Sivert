// Simulert sanntid: hvor hver buss er akkurat nå, regnet ut fra rutetabellen.
// Bussen beveger seg jevnt mellom holdeplassene etter planlagte tider, pluss en liten,
// fast forsinkelse på noen turer så det ser ut som ekte trafikk.
import { PATTERNS, dayIndex } from './routes.js'

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

// 0–4 minutter forsinkelse på omtrent hver tredje tur, alltid den samme for samme tur
export function tripDelay(pi, start) {
  const h = hash(`${pi}|${start}`)
  return h % 3 === 0 ? (h >>> 3) % 5 : 0
}

const minutesNow = (now) => now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60

// Posisjon langs et kjøremønster etter `elapsed` minutter siden avgang fra første holdeplass
function positionAt(p, elapsed) {
  const last = p.offs.length - 1
  if (elapsed < 0 || elapsed > p.offs[last]) return null
  let k = 0
  while (k < last && p.offs[k + 1] <= elapsed) k++
  const a = p.quays[k].station
  const b = p.quays[Math.min(k + 1, last)].station
  const span = p.offs[Math.min(k + 1, last)] - p.offs[k]
  const f = span > 0 ? (elapsed - p.offs[k]) / span : 0
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, segment: k, atStop: f < 0.05 }
}

// Alle busser i trafikk nå. `extra` legger til ekstraturer, `cancelled` fjerner innstilte turer.
export function vehicles(now, { extra = [], cancelled = [] } = {}) {
  const t = minutesNow(now)
  const day = dayIndex(now)
  const prevDay = dayIndex(new Date(+now - 86400000))
  const skip = new Set(cancelled.map((c) => `${c.pi}|${c.start}`))
  const out = []
  const add = (pi, start, shift, line) => {
    const p = PATTERNS[pi]
    if (skip.has(`${pi}|${start}`)) return
    const delay = line ? 0 : tripDelay(pi, start)
    const pos = positionAt(p, t + shift - start - delay)
    if (!pos) return
    out.push({ id: `${pi}|${start}${line ? `|${line}` : ''}`, pi, start, delay, line: line ?? p.route.id, route: p.route, headsign: p.headsign, nextStop: p.quays[Math.min(pos.segment + 1, p.quays.length - 1)].station.name, ...pos })
  }
  PATTERNS.forEach((p, pi) => {
    for (const s of p.times[day]) if (s <= t + 1 && s + p.offs[p.offs.length - 1] + 5 >= t) add(pi, s, 0)
    for (const s of p.times[prevDay]) if (s + p.offs[p.offs.length - 1] + 5 >= t + 1440) add(pi, s, 1440)
  })
  extra.forEach((x) => add(x.pi, x.start, 0, x.line))
  return out
}

// Følg én tur fram til holdeplassen du venter på
export function trackTrip({ pi, start, line, pos: stopPos }, stopName, now) {
  const p = PATTERNS[pi]
  const delay = line ? 0 : tripDelay(pi, start)
  const elapsed = minutesNow(now) - start - delay
  const target = stopPos ?? p.quays.findIndex((q) => q.station.name === stopName)
  const pos = positionAt(p, Math.max(0, elapsed))
  const segment = elapsed < 0 ? -1 : pos ? pos.segment : p.quays.length - 1
  const stops = p.quays.map((q, i) => ({
    name: q.station.name,
    at: start + delay + p.offs[i],
    passed: i <= segment,
    lat: q.station.lat,
    lon: q.station.lon,
  }))
  const minutesAway = target >= 0 ? start + delay + p.offs[target] - minutesNow(now) : null
  return {
    pattern: p,
    delay,
    notStarted: elapsed < 0,
    position: pos ?? { lat: p.quays[0].station.lat, lon: p.quays[0].station.lon, segment: 0 },
    stops,
    target,
    // Bussen har passert holdeplass nr. `segment`; antall stopp igjen til din holdeplass
    stopsAway: target >= 0 ? (elapsed < 0 ? target : Math.max(0, target - segment)) : null,
    minutesAway,
    arrived: minutesAway !== null && minutesAway <= 0,
  }
}
