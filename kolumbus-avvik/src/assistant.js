// Enkel, regelbasert «AI» for prototypen. Den kjenner hele linjenettet i routes.js og
// svarer på spørsmål om linjer, holdeplasser og avganger, i tillegg til service-spørsmål.
import { ROUTES, PATTERNS, CATEGORIES, ALL_STOPS, ALIASES, routeById, routesServing, nextDepartures } from './routes.js'
import { board, DISRUPTED, isDisrupted, stopWeight } from './board.js'
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
  // Ingen eksakte treff: prøv ord som starter et holdeplassnavn («Hommersåk» → «Hommersåk kai»)
  if (!hits.length)
    for (const m of t.matchAll(/[a-zæøå]{4,}/g)) {
      if (STOPWORDS.has(m[0])) continue
      const cands = ALL_STOPS.filter((s) => s.toLowerCase().split(/[\s\-/]+/)[0] === m[0]).sort((a, b) => stopWeight(b) - stopWeight(a))
      if (cands.length) hits.push({ stop: cands[0], i: m.index, len: m[0].length })
    }
  return hits.sort((a, b) => a.i - b.i).map((h) => h.stop)
}

// Vanlige ord i spørsmål som også er starten på et holdeplassnavn
const STOPWORDS = new Set(['neste', 'siste', 'første', 'bussen', 'buss', 'båten', 'ferja', 'ferjen', 'linje', 'linja', 'hvilke', 'hvilken', 'når', 'går', 'morgen', 'klokka', 'klokken', 'avganger', 'avgang', 'kommer', 'skal', 'reise', 'nattbussen', 'nattbuss', 'ofte'])

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

const label = (x) => `${x.mode === 'boat' ? 'Båtrute' : 'Linje'} ${x.id}`
const often = (every) => (!every ? 'noen få ganger om dagen' : every < 60 ? `hvert ${every}. minutt` : every < 90 ? 'omtrent hver time' : `omtrent hver ${Math.round(every / 60)}. time`)
const times = (x, now) => nextDepartures(x, now).map(clock).join(', ') || 'ingen flere i dag'
export { isTimeQuestion }

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

const WEEKDAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag']

const isDirectionsQuestion = (t) =>
  /hvor er|hvor ligger|hvor står|veibeskrivelse|vei(en)? til (holdeplassen|stoppet|busstoppet|plattform|bussen)|hvordan (går|finner|kommer) jeg (meg )?(til|fram til|frem til) (holdeplassen|stoppet|busstoppet|bussen)|finne (holdeplassen|stoppet|busstoppet)|nærmeste (holdeplass|busstopp|stopp)/.test(t)

function directionsAnswer(text) {
  const t = text.toLowerCase()
  const stop = findStops(text)[0]
  const line = findRoutes(text)[0]?.id
  if (stop) return { text: `Her er veien til ${stop}${line ? `, der linje ${line} går fra` : ''}.`, directions: { stop, line } }
  if (/nærmeste/.test(t)) return { text: 'Her er nærmeste holdeplass.', directions: { nearest: true } }
  return { text: 'Hvilken holdeplass vil du finne? Skriv for eksempel «Hvor er UiS øst?».' }
}

const isTimeQuestion = (t) => /\bnår\b|neste|avgang|første|siste|\bkl\.?\s*\d|klokk[ae]|i ?morgen|rutetid|tidene|går (bussen|båten|ferja|ferjen|den)\b/.test(t)

// Tolker «i morgen», ukedager, «kl. 18:30», «første» og «siste»
function parseWhen(t, now) {
  let day = new Date(now)
  let dayLabel = ''
  if (/i ?morgen/.test(t)) {
    day = new Date(+now + 864e5)
    dayLabel = 'i morgen'
  } else {
    const wd = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}`).test(t))
    if (wd >= 0 && wd !== now.getDay()) {
      day = new Date(+now + ((wd - now.getDay() + 7) % 7) * 864e5)
      dayLabel = `på ${WEEKDAYS[wd]}`
    }
  }
  const m = /\b(?:kl\.?|klokka|klokken)\s*(\d{1,2})(?:[:.](\d{2}))?/.exec(t) || /\b(\d{1,2})[:.](\d{2})\b/.exec(t)
  const mode = /siste/.test(t) ? 'last' : /første/.test(t) ? 'first' : 'next'
  const at = new Date(day)
  if (m) at.setHours(+m[1], +(m[2] || 0), 0, 0)
  else if (dayLabel || mode === 'first') at.setHours(4, 0, 0, 0)
  else at.setTime(+now)
  return { at, mode, dayLabel, hasTime: !!m, live: !m && !dayLabel && mode === 'next' }
}

function departures(text, now, disrupted) {
  const t = text.toLowerCase()
  const routes = findRoutes(text)
  const lines = routes.map((r) => r.id)
  let stops = findStops(text)
  // «til X fra Y»: snu rekkefølgen
  if (stops.length >= 2 && t.search(/\btil\b/) >= 0 && t.search(/\btil\b/) < t.search(/\bfra\b/)) stops = [...stops].reverse()
  let from = null
  let to = null
  if (stops.length >= 2) [from, to] = [stops[0], stops[stops.length - 1]]
  else if (stops.length === 1) /\btil\b/.test(t) && !/\bfra\b/.test(t) ? (to = stops[0]) : (from = stops[0])
  const boat = /båt|ferje|ferja|hurtigbåt/.test(t)
  const W = parseWhen(t, now)
  // Båtspørsmål: bruk kaien, ikke bussholdeplassen med samme navn («Hommersåk» → «Hommersåk kai»)
  const boatStop = (name) => {
    const word = name.toLowerCase().split(/[\s\-/]+/)[0]
    const served = PATTERNS.filter((p) => p.route.cat === 'bat').flatMap((p) => p.quays.map((q) => q.station.name))
    return served.includes(name) ? name : served.find((n) => n.toLowerCase().startsWith(word)) ?? name
  }
  if (boat) {
    if (to) to = boatStop(to)
    if (from) from = boatStop(from)
  }

  // Uten avgangssted: UiS øst hvis linjen stopper der, ellers der linjen (mot målet) starter
  if (!from) {
    const servesHome = !routes.length || routes.some((r) => routesServing(HOME).includes(r))
    if (servesHome && !boat) from = HOME
    else {
      const p = PATTERNS.find((p) => (routes.length ? routes.includes(p.route) : p.route.cat === 'bat') && (!to || p.quays.slice(1).some((q) => q.station.name === to)))
      from = p ? p.quays[0].station.name : HOME
    }
  }
  if (from === to) to = null

  const query = (at, horizon, count) =>
    board(from, at, { to, count, horizon })
      .filter((d) => !lines.length || lines.includes(d.line))
      .filter((d) => !boat || d.route.cat === 'bat')
      .filter((d) => d.route.cat !== 'skole' || lines.includes(d.line))
      .sort((a, b) => a.at - b.at)

  const nowMin = W.at.getHours() * 60 + W.at.getMinutes()
  let deps =
    W.mode === 'last'
      ? query(W.at, 28 * 60 - nowMin, 60).slice(-3)
      : W.mode === 'first'
        ? query(W.at, 20 * 60, 1).slice(0, 3)
        : query(W.at, W.live ? 240 : 600, 3).slice(0, 5)

  // Ingen avganger: let i dagene framover (f.eks. nattbusser som bare går i helgen)
  if (!deps.length && lines.length) {
    for (let d = 1; d <= 7 && !deps.length; d++) {
      const day = new Date(+now + d * 864e5)
      day.setHours(0, 0, 0, 0)
      deps = query(day, 1440, 1).slice(0, 1)
      if (deps.length) {
        const dep = deps[0]
        // Avganger før kl. 05 hører til natten før («natt til søndag»)
        const night = dep.at.getHours() < 5
        const when = night ? `natt til ${WEEKDAYS[day.getDay()]}` : d === 1 ? 'i morgen' : `på ${WEEKDAYS[day.getDay()]}`
        return { text: `Linje ${dep.line} går ikke fra ${from}${to ? ` til ${to}` : ''} resten av dagen. Neste avgang er ${when} kl. ${clock(dep.at)} mot ${dep.toward}.`, routes: [dep.line] }
      }
    }
  }
  if (!deps.length) {
    if (to) return between(from, to, W.at)
    return { text: `Jeg finner ingen avganger fra ${from}${W.dayLabel ? ` ${W.dayLabel}` : ' de neste timene'}.` }
  }

  const mins = (d) => Math.round((d.at - now) / 60000)
  const row = (d) => {
    const cancelled = disrupted && from === DISRUPTED.stop && isDisrupted(d) && d === deps.find(isDisrupted)
    const extra = [to && d.arrive ? `fremme ${clock(d.arrive)}` : '', W.live && mins(d) <= 30 ? (mins(d) <= 0 ? 'nå' : `om ${mins(d)} min`) : '', d.delay ? `+${d.delay} min` : ''].filter(Boolean).join(', ')
    return `${clock(d.at)}  ${d.line} mot ${d.toward}${extra ? ` (${extra})` : ''}${cancelled ? ' – innstilt' : ''}`
  }
  const where = `fra ${from}${to ? ` til ${to}` : ''}`
  const head =
    W.mode === 'last'
      ? `Siste avganger ${where}${W.dayLabel ? ` ${W.dayLabel}` : ' i dag'}:`
      : W.mode === 'first'
        ? `Første avganger ${where}${W.dayLabel ? ` ${W.dayLabel}` : ''}:`
        : `${W.live ? 'Neste avganger' : 'Avganger'} ${where}${W.dayLabel ? ` ${W.dayLabel}` : ''}${W.hasTime ? ` fra kl. ${clock(W.at)}` : ''}:`
  // Strukturert liste i tillegg til tekst, så chatten kan vise den som en avgangstavle
  const list = deps.map((d) => {
    const cancelled = disrupted && from === DISRUPTED.stop && isDisrupted(d) && d === deps.find(isDisrupted)
    const notes = [to && d.arrive ? `fremme ${clock(d.arrive)}` : '', d.delay ? `+${d.delay} min` : ''].filter(Boolean).join(' · ')
    return { time: clock(d.at), line: d.line, toward: d.toward, notes, soon: W.live && mins(d) <= 30 ? (mins(d) <= 0 ? 'nå' : `${mins(d)} min`) : '', cancelled }
  })
  return { text: `${head}\n${deps.map(row).join('\n')}`, title: head.replace(/:$/, ''), deps: list }
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
    return { text: describe(x, now), routes: [x.id] }
  }

  if (stops.length >= 2) return between(stops[0], stops[stops.length - 1], now)
  if (stops.length === 1 && /\btil\b|komme meg|reise/.test(t) && stops[0] !== HOME) return between(HOME, stops[0], now)
  if (stops.length === 1) {
    const all = routesServing(stops[0])
    const s = all.filter((x) => x.cat !== 'skole').sort((a, b) => a.id.localeCompare(b.id, 'nb', { numeric: true }))
    const school = all.length - s.length
    return { text: `Ved ${stops[0]} stopper linje ${s.map((x) => x.id).join(', ')}${school ? `, og ${school} skolebusser` : ''}. Spør «Når går bussen fra ${stops[0]}?» for neste avganger.`, routes: s.slice(0, 8).map((x) => x.id) }
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
    reply: (d) =>
      d
        ? 'Ja. Ekstrabussen 6E er i Stavanger sentrum om ca. 20 minutter. Vil du ha en forsinkelsesattest du kan vise foreleseren?'
        : 'Linje 6 og 7 går fra UiS øst mot sentrum flere ganger i timen, og turen tar rundt et kvarter. Vil du ha et varsel når neste buss er nær?',
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
  const reply = () => ({ from: service.handoff ? 'human' : 'ai', text: service.reply(disrupted, text), actions: service.actions })
  // Service-svar først når meldingen ikke handler om en bestemt linje eller et sted
  if (service && (service.handoff || /^(ja|nei|start|send|bestill|varsle|jeg venter)/i.test(text.trim()) || (!findRoutes(text).length && !findStops(text).length))) return reply()

  // «Hvor er holdeplassen?» svares med veibeskrivelse
  if (isDirectionsQuestion(text.toLowerCase())) return { from: 'ai', ...directionsAnswer(text) }

  // «Når går …»-spørsmål svares med avgangstider
  if (isTimeQuestion(text.toLowerCase())) {
    const deps = departures(text, now, disrupted)
    if (deps) return { from: 'ai', ...deps }
  }

  const route = routeAnswer(text, now, disrupted)
  if (route) return { from: 'ai', ...route }
  if (service) return reply()

  return {
    from: 'ai',
    text: 'Det er jeg ikke sikker på. Prøv å spørre om en linje («Hvor går X74?») eller et sted («Hvordan kommer jeg til Sola?»). Du kan også få snakke med trafikksentralen.',
    actions: ['Snakk med et menneske'],
  }
}
