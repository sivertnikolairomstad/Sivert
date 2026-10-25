// Enkel, regelbasert «AI» for prototypen. Den kjenner hele linjenettet i routes.js og
// svarer på spørsmål om linjer, holdeplasser og avganger, i tillegg til service-spørsmål.
import { ROUTES, PATTERNS, CATEGORIES, ALL_STOPS, ALIASES, routeById, routesServing, nextDepartures } from './routes.js'
import { board } from './board.js'
import { clock } from './lib/time.js'

const HOME = 'UiS øst'

// Bare navn på minst fire tegn, så vanlige ord ikke tolkes som holdeplasser
const stopsByLength = ALL_STOPS.filter((s) => s.length >= 4).sort((a, b) => b.length - a.length)

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
    const m = new RegExp(`(^|[^a-zæøå])${alias.replace('_', ' ')}([^a-zæøå]|$)`, 'i').exec(t)
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
const often = (every) => (!every ? 'noen få ganger om dagen' : every < 60 ? `hvert ${every}. minutt` : every < 90 ? 'omtrent hver time' : `omtrent hver ${Math.round(every / 60)}. time`)
const times = (x, now) => nextDepartures(x, now).map(clock).join(', ') || 'ingen flere i dag'

// Noen jevnt fordelte mellomstopp, så svaret ikke blir en liste på 60 holdeplasser
const pick = (stops, n) => Array.from({ length: n }, (_, i) => stops[Math.round(((i + 1) * (stops.length - 1)) / (n + 1))])

function describe(x, now) {
  const via = x.stops.length > 6 ? `${x.stops[0]} – ${pick(x.stops, 4).join(' – ')} – ${x.stops[x.stops.length - 1]} (${x.stops.length} stopp)` : x.stops.join(' – ')
  const parts = [`${label(x)} går ${via}.`, `Den går ${often(x.every)}. Neste avganger fra ${x.stops[0]}: ${times(x, now)}.`]
  if (x.note && !(x.mode === 'boat' && isNaN(x.id))) parts.push(x.note)
  return parts.join(' ')
}

function between(from, to, now) {
  const deps = board(from, now, { to, count: 1, horizon: 240 })
  if (!deps.length) {
    // Ett bytte via et knutepunkt: velg det som gir tidligst ankomst
    let best = null
    for (const hub of ['Stavanger bussterminal', 'Jernbaneveien', 'Sandnes bussterminal Ruten', 'Kvadrat', 'Haugesund bussterminal', 'Bryne stasjon', 'Egersund bussterminal']) {
      if (hub === from || hub === to) continue
      const a = board(from, now, { to: hub, count: 1, horizon: 240 })[0]
      const b = a && board(hub, new Date(+a.arrive + 2 * 60000), { to, count: 1, horizon: 240 })[0]
      if (a && b && (!best || b.arrive < best.b.arrive)) best = { a, b, hub }
    }
    if (best) {
      const { a, b, hub } = best
      return {
        text: `Det går ingen direkte avgang fra ${from} til ${to} de neste timene. Ta linje ${a.line} kl. ${clock(a.at)} til ${hub}, og bytt til linje ${b.line} kl. ${clock(b.at)}. Du er fremme ca. ${clock(b.arrive)}.`,
        routes: [a.line, b.line],
      }
    }
    return { text: `Jeg fant ingen god forbindelse mellom ${from} og ${to} de neste timene. Vil du at jeg setter deg over til trafikksentralen?`, actions: ['Ja, sett meg over'] }
  }
  const lines = deps.slice(0, 3).map((d) => `Linje ${d.line} mot ${d.toward}: går ${clock(d.at)}, fremme ${clock(d.arrive)} (${d.travel} min)`)
  return { text: `Fra ${from} til ${to}:\n${lines.join('\n')}`, routes: [...new Set(deps.slice(0, 3).map((d) => d.line))] }
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
    return { text: `Det finnes ${n.length} nattbusser: ${n.map((x) => x.id).join(', ')}. De går natt til lørdag og søndag. Trykk på en linje for å se hvor den går.`, routes: n.map((x) => x.id) }
  }
  if (/\b(båt|ferje|ferja|hurtigbåt)/.test(t) && !routes.length && !stops.length) {
    const b = ROUTES.filter((x) => x.cat === 'bat')
    return { text: `Båt- og ferjerutene er:\n${b.map((x) => `${x.name}`).join('\n')}`, routes: b.map((x) => x.id) }
  }

  if (routes.length) {
    const x = routes[0]
    if (disrupted && x.id === '6') {
      const seven = board(HOME, now, { count: 1 }).find((d) => d.line === '7' && d.dir === 'nord')
      return { text: `Neste linje 6 fra UiS øst mot Stavanger er innstilt på grunn av teknisk feil. Ekstrabuss 6E går fra samme plattform${seven ? `, og linje 7 går mot Stavanger kl. ${clock(seven.at)}` : ''}.`, routes: ['7'] }
    }
    if (stops.length && !routesServing(stops[stops.length - 1]).includes(x)) {
      const alt = routesServing(stops[stops.length - 1]).slice(0, 3)
      return { text: `${label(x)} stopper ikke ved ${stops[stops.length - 1]}. ${alt.length ? `Dit går linje ${alt.map((a) => a.id).join(', ')}.` : ''}`, routes: alt.map((a) => a.id) }
    }
    if (/når|neste|avgang|går den|tid/.test(t)) {
      // «fra X» er avgangsstedet; «til X» alene er reisemålet
      const fromMatch = /\bfra\b/.test(t) ? stops[0] : stops.length === 1 && !/\btil\b/.test(t) ? stops[0] : null
      const at = fromMatch
      const here = at ? board(at, now, { count: 2, horizon: 600 }).filter((d) => d.line === x.id) : []
      if (here.length) return { text: `Neste avganger med linje ${x.id} fra ${at}:\n${here.map((d) => `${clock(d.at)} mot ${d.toward}`).join('\n')}`, routes: [x.id] }
      // «Når går neste 100 til Jørpeland?»: vis avganger fra startholdeplassen i retning mot målet
      const dest = /\btil\b/.test(t) ? stops[stops.length - 1] : null
      const p = dest && PATTERNS.find((p) => p.route === x && p.quays.slice(1).some((q) => q.station.name === dest))
      const toDest = p ? board(p.quays[0].station.name, now, { to: dest, count: 3, horizon: 600 }).filter((d) => d.line === x.id) : []
      if (toDest.length) return { text: `Neste linje ${x.id} fra ${p.quays[0].station.name} til ${dest}:\n${toDest.slice(0, 3).map((d) => `${clock(d.at)}, fremme ${clock(d.arrive)}`).join('\n')}`, routes: [x.id] }
      return { text: `Neste avganger med ${label(x).toLowerCase()} fra ${x.stops[0]}: ${times(x, now)}.`, routes: [x.id] }
    }
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
    reply: () => 'Ja. Ekstrabussen 6E er i Stavanger sentrum om ca. 20 minutter. Vil du ha en forsinkelsesattest du kan vise foreleseren?',
    actions: ['Send attest', 'Varsle meg når bussen er nær'],
  },
  {
    test: /taxi|drosje/i,
    reply: () => 'Det kan vi. Har du dårlig tid, sender vi taxi på vår regning. Skal jeg bestille til UiS øst?',
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
        ? 'Taxi er bestilt. Den står ved UiS øst om ca. 6 minutter, og du får sjåførens navn på SMS.'
        : /attest/i.test(t)
          ? 'Attesten er sendt til e-posten din og ligger under Mine reiser.'
          : /varsle/i.test(t)
            ? 'Greit. Du får et varsel når bussen er 2 minutter unna.'
            : 'Refusjonen er startet med saksnummer MR-20481. Du får svar innen 24 timer.',
  },
  { test: /^(nei|jeg venter)/i, reply: () => 'Helt i orden. Skriv her hvis du trenger noe mer.' },
  { test: /takk|flott|supert/i, reply: () => 'Bare hyggelig. Takk for at du sa fra.' },
  { test: /^(hei|hallo)\b/i, reply: (d) => (d ? 'Hei! Neste linje 6 fra UiS øst mot Stavanger er innstilt. Hva lurer du på?' : 'Hei! Spør om en linje, en holdeplass eller reisen din.') },
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
