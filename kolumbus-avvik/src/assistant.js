// Enkel, regelbasert «AI» for prototypen. Den kjenner hele linjenettet i routes.js og
// svarer på spørsmål om linjer, holdeplasser og avganger, i tillegg til service-spørsmål.
import { ROUTES, CATEGORIES, ALL_STOPS, routeById, routesServing, nextDepartures, travelMinutes } from './routes.js'
import { clock } from './lib/time.js'

const HOME = 'UiS Tjodhallen'

// Kallenavn folk faktisk bruker
const ALIASES = {
  sentrum: 'Stavanger sentrum',
  stavanger: 'Stavanger sentrum',
  byen: 'Stavanger sentrum',
  sandnes: 'Sandnes sentrum',
  uis: 'UiS Tjodhallen',
  universitetet: 'UiS Tjodhallen',
  tjodhallen: 'UiS Tjodhallen',
  sola: 'Sola sentrum',
  sykehuset: 'SUS',
  haugesund: 'Haugesund',
  jørpeland: 'Jørpeland',
  forus: 'Forus',
}

const stopsByLength = [...ALL_STOPS].sort((a, b) => b.length - a.length)

function findStops(text) {
  const t = text.toLowerCase()
  const hits = []
  for (const s of stopsByLength) {
    // Hele ord, så «Sandnes» ikke treffer holdeplassen «Sand»
    const m = new RegExp(`(^|[^a-zæøå])${s.toLowerCase().replace(/[()]/g, '\\$&')}(?![a-zæøå])`).exec(t)
    const i = m ? m.index + m[1].length : -1
    if (i >= 0 && !hits.some((h) => h.i <= i && i < h.i + h.len)) hits.push({ stop: s, i, len: s.length })
  }
  for (const [alias, stop] of Object.entries(ALIASES)) {
    const m = new RegExp(`(^|[^a-zæøå])${alias}([^a-zæøå]|$)`, 'i').exec(t)
    if (m && !hits.some((h) => h.stop === stop || (h.i <= m.index + 1 && m.index + 1 < h.i + h.len))) hits.push({ stop, i: m.index + 1, len: alias.length })
  }
  return hits.sort((a, b) => a.i - b.i).map((h) => h.stop)
}

function findRoutes(text) {
  const found = []
  // «linje 6», «rute X74», «buss 100»
  for (const m of text.matchAll(/\b(?:linje|linja|rute|ruta|buss|bussen|nr\.?)\s*([xn]?\d{1,3})\b/gi)) found.push(m[1])
  // X- og N-linjer kan stå alene
  for (const m of text.matchAll(/\b([xn]\d{1,3})\b/gi)) found.push(m[1])
  // Navngitte båtruter
  for (const x of ROUTES.filter((x) => x.mode === 'boat' && isNaN(x.id))) if (new RegExp(x.id, 'i').test(text)) found.push(x.id)
  // Tall alene, men ikke klokkeslett, minutter eller kroner
  if (!found.length)
    for (const m of text.matchAll(/(?<!kl\.?\s?)(?<![\d:])\b(\d{1,3})\b(?!\s*(?:min|minutter|kr|:|\.\d))/gi)) found.push(m[1])
  return [...new Set(found.map((id) => routeById(id)).filter(Boolean))]
}

const label = (x) => (x.mode === 'boat' && isNaN(x.id) ? `${x.note.split('.')[0].split(' og ')[0]} ${x.name}` : `${x.mode === 'boat' ? 'Båtrute' : 'Linje'} ${x.id}`)
const often = (every) => (every < 60 ? `hvert ${every}. minutt` : every === 60 ? 'hver time' : `hver ${every / 60}. time`)
const times = (x, now) => nextDepartures(x, now).map(clock).join(', ')

function describe(x, now) {
  const parts = [`${label(x)} går ${x.stops.join(' – ')}.`, `Den går omtrent ${often(x.every)}, neste avganger fra ${x.stops[0]} er ${times(x, now)}.`]
  if (x.note && !(x.mode === 'boat' && isNaN(x.id))) parts.push(x.note)
  return parts.join(' ')
}

function between(from, to, now) {
  const options = ROUTES.filter((x) => x.stops.includes(from) && x.stops.includes(to))
  if (!options.length) {
    // Ett bytte via Stavanger sentrum eller Sandnes sentrum
    for (const hub of ['Stavanger sentrum', 'Sandnes sentrum', 'Haugesund', 'Solbakk']) {
      const a = ROUTES.find((x) => x.stops.includes(from) && x.stops.includes(hub))
      const b = ROUTES.find((x) => x.stops.includes(hub) && x.stops.includes(to))
      if (a && b && a !== b)
        return {
          text: `Det går ingen direkte linje fra ${from} til ${to}. Ta ${label(a).toLowerCase()} til ${hub} og bytt til ${label(b).toLowerCase()}. Neste ${a.id} går ${clock(nextDepartures(a, now, 1)[0])}.`,
          routes: [a.id, b.id],
        }
    }
    return { text: `Jeg fant ingen god forbindelse mellom ${from} og ${to} i linjenettet. Vil du at jeg setter deg over til trafikksentralen?`, actions: ['Ja, sett meg over'] }
  }
  const lines = options
    .slice(0, 3)
    .map((x) => `${label(x)}: neste avgang ${clock(nextDepartures(x, now, 1)[0])}, ca. ${travelMinutes(x, from, to)} min`)
  return { text: `Fra ${from} til ${to} kan du ta:\n${lines.join('\n')}`, routes: options.slice(0, 3).map((x) => x.id) }
}

function routeAnswer(text, now, disrupted) {
  const t = text.toLowerCase()
  const routes = findRoutes(text)
  const stops = findStops(text)

  if (/hvor mange (linjer|ruter)|alle (linjer|ruter)|linjenett/.test(t)) {
    const counts = Object.entries(CATEGORIES).map(([k, c]) => `${c.label}: ${ROUTES.filter((x) => x.cat === k).length}`)
    return { text: `Jeg kjenner ${ROUTES.length} linjer:\n${counts.join('\n')}\nSpør om en linje eller en holdeplass.` }
  }
  if (/natt/.test(t) && !routes.length) {
    const n = ROUTES.filter((x) => x.cat === 'natt')
    return { text: `Nattbussene er ${n.map((x) => `${x.id} (${x.name})`).join(' og ')}. De går natt til lørdag og søndag.`, routes: n.map((x) => x.id) }
  }
  if (/\b(båt|ferje|ferja|hurtigbåt)/.test(t) && !routes.length && !stops.length) {
    const b = ROUTES.filter((x) => x.cat === 'bat')
    return { text: `Båt- og ferjerutene er:\n${b.map((x) => `${x.name}`).join('\n')}`, routes: b.map((x) => x.id) }
  }

  if (routes.length) {
    const x = routes[0]
    if (disrupted && x.id === '6') return { text: `Linje 6 fra UiS er innstilt akkurat nå på grunn av teknisk feil. Ekstrabuss 6E går fra plattform A, og linje 7 går til sentrum kl. ${clock(nextDepartures(routeById('7'), now, 1)[0])}.`, routes: ['7'] }
    if (stops.length && !x.stops.includes(stops[stops.length - 1])) {
      const alt = routesServing(stops[stops.length - 1]).slice(0, 3)
      return { text: `${label(x)} stopper ikke ved ${stops[stops.length - 1]}. ${alt.length ? `Dit går ${alt.map(label).join(', ').toLowerCase()}.` : ''}`, routes: alt.map((a) => a.id) }
    }
    if (/når|neste|avgang|går den|tid/.test(t)) return { text: `Neste avganger med ${label(x).toLowerCase()} fra ${x.stops[0]}: ${times(x, now)}. Fra ${x.stops[x.stops.length - 1]}: ${times({ ...x, id: x.id + 'r' }, now)}.`, routes: [x.id] }
    return { text: describe(x, now), routes: [x.id] }
  }

  if (stops.length >= 2) return between(stops[0], stops[stops.length - 1], now)
  if (stops.length === 1 && /\btil\b|komme meg|reise/.test(t) && stops[0] !== HOME) return between(HOME, stops[0], now)
  if (stops.length === 1) {
    const s = routesServing(stops[0])
    return { text: `${stops[0]} har ${s.length} ${s.length === 1 ? 'linje' : 'linjer'}: ${s.map((x) => x.id).join(', ')}.`, routes: s.slice(0, 6).map((x) => x.id) }
  }
  return null
}

const SERVICE = [
  {
    test: /billett|betal|refus|penger|reisegaranti/i,
    reply: (d) =>
      d
        ? 'Billetten din gjelder på ekstrabussen og på linje 7, så du trenger ikke gjøre noe. Blir du forsinket mer enn 20 minutter, dekker reisegarantien taxi. Vil du at jeg starter en refusjon nå?'
        : 'Billetten din gjelder på alle busser i samme sone. Blir du forsinket mer enn 20 minutter, dekker reisegarantien taxi. Jeg kan ordne det her i chatten.',
    actions: ['Ja, start refusjon', 'Nei takk'],
  },
  {
    test: /forelesning|rekk|møte|jobb|skole/i,
    reply: () => 'Ja. Ekstrabussen 6E fra plattform A er i sentrum om ca. 20 minutter. Vil du ha en forsinkelsesattest du kan vise foreleseren?',
    actions: ['Send attest', 'Varsle meg når bussen er nær'],
  },
  {
    test: /taxi|drosje/i,
    reply: () => 'Det kan vi. Har du dårlig tid, sender vi taxi på vår regning. Skal jeg bestille til UiS Tjodhallen?',
    actions: ['Bestill taxi', 'Jeg venter på bussen'],
  },
  {
    test: /menneske|person|ringe|klage|sint|elendig|sett meg over/i,
    handoff: true,
    reply: () => 'Hei, dette er Ingrid fra trafikksentralen. Jeg har lest samtalen, så du slipper å gjenta deg. Hva kan jeg hjelpe deg med?',
  },
  {
    test: /^(ja|start|send|bestill|varsle)/i,
    reply: (_, t) =>
      /taxi/i.test(t)
        ? 'Taxi er bestilt. Den står ved hovedinngangen til Tjodhallen om ca. 6 minutter, og du får sjåførens navn på SMS.'
        : /attest/i.test(t)
          ? 'Attesten er sendt til e-posten din og ligger under Mine reiser.'
          : /varsle/i.test(t)
            ? 'Greit. Du får et varsel når bussen er 2 minutter unna.'
            : 'Refusjonen er startet med saksnummer MR-20481. Du får svar innen 24 timer.',
  },
  { test: /^(nei|jeg venter)/i, reply: () => 'Helt i orden. Skriv her hvis du trenger noe mer.' },
  { test: /takk|flott|supert/i, reply: () => 'Bare hyggelig. Takk for at du sa fra.' },
  { test: /^(hei|hallo)\b/i, reply: (d) => (d ? 'Hei! Linje 6 fra UiS er innstilt akkurat nå. Hva lurer du på?' : 'Hei! Spør om en linje, en holdeplass eller reisen din.') },
]

export function answer(text, { disrupted, now = new Date() }) {
  const service = SERVICE.find((r) => r.test.test(text.trim()))
  // Service-svar først når meldingen ikke handler om en bestemt linje eller et sted
  if (service && (service.handoff || /^(ja|nei|start|send|bestill|varsle|jeg venter)/i.test(text.trim()) || !findRoutes(text).length))
    return { from: service.handoff ? 'human' : 'ai', text: service.reply(disrupted, text), actions: service.actions }

  const route = routeAnswer(text, now, disrupted)
  if (route) return { from: 'ai', ...route }
  if (service) return { from: 'ai', text: service.reply(disrupted, text), actions: service.actions }

  return {
    from: 'ai',
    text: 'Det er jeg ikke sikker på. Prøv å spørre om en linje («Hvor går X74?») eller et sted («Hvordan kommer jeg til Sola?»). Du kan også få snakke med trafikksentralen.',
    actions: ['Snakk med et menneske'],
  }
}
