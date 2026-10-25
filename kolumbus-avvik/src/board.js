// Avgangstavle for en holdeplass: alle linjer som stopper der, i begge retninger,
// med kompassretning regnet ut fra holdeplassens og endeholdeplassens koordinater.
import { ROUTES, travelMinutes } from './routes.js'
import { COORDS } from './coords.js'

export const DIRECTIONS = ['nord', 'øst', 'sør', 'vest']
const PLATFORM = { nord: 'A', øst: 'B', sør: 'C', vest: 'D' }

function bearing([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const compass = (deg) => DIRECTIONS[Math.round(deg / 90) % 4]

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

// Oppfunnede, men stabile tider: fast frekvens og en forskyvning per linje, retning og holdeplass
function times(route, key, now, count) {
  const seed = hash(key) % route.every
  const minsNow = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() > 30 ? 1 : 0)
  let m = Math.ceil((minsNow - seed) / route.every) * route.every + seed
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now)
    d.setHours(0, m + i * route.every, 0, 0)
    return d
  })
}

export function board(from, now, { to, count = 3 } = {}) {
  const out = []
  const night = now.getHours() < 5
  for (const route of ROUTES) {
    if (route.cat === 'natt' && !night) continue
    const i = route.stops.indexOf(from)
    if (i < 0) continue
    for (const step of [1, -1]) {
      const end = step > 0 ? route.stops[route.stops.length - 1] : route.stops[0]
      if (end === from) continue
      if (to) {
        const j = route.stops.indexOf(to)
        if (j < 0 || (j - i) * step <= 0) continue
      }
      const dir = COORDS[from] && COORDS[end] ? compass(bearing(COORDS[from], COORDS[end])) : 'nord'
      const key = `${route.id}|${end}`
      const travel = to ? travelMinutes(route, from, to) : null
      times(route, `${key}|${from}`, now, count).forEach((at, n) =>
        out.push({
          id: `${key}|${n}`,
          key,
          line: route.id,
          route,
          toward: end,
          dir,
          at,
          travel,
          arrive: travel ? new Date(+at + travel * 60000) : null,
          platform: route.mode === 'boat' ? 'Kai' : PLATFORM[dir],
          crowd: ((hash(key + n) % 70) + 10) / 100,
        }),
      )
    }
  }
  return out.sort((a, b) => a.at - b.at)
}

// Demoavviket: neste linje 6 fra UiS mot sentrum er innstilt
export const DISRUPTED = { stop: 'UiS Tjodhallen', key: '6|Stavanger sentrum' }

export function cancelledDeparture(now) {
  return board(DISRUPTED.stop, now, { count: 1 }).find((d) => d.key === DISRUPTED.key)
}
