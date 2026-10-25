// Scenario og tekster for prototypen. Avganger regnes relativt til «nå».

export const ROUTE = { from: 'UiS Tjodhallen', to: 'Stavanger sentrum' }

export const departures = [
  { id: 'd1', line: '6', dest: 'Stavanger sentrum', inMin: 3, travel: 17, platform: 'A', crowd: 0.55 },
  { id: 'd2', line: 'X60', dest: 'Stavanger sentrum via Kannik', inMin: 9, travel: 14, platform: 'B', crowd: 0.35 },
  { id: 'd3', line: '6', dest: 'Stavanger sentrum', inMin: 18, travel: 17, platform: 'A', crowd: 0.2 },
  { id: 'd4', line: 'X60', dest: 'Stavanger sentrum via Kannik', inMin: 24, travel: 14, platform: 'B', crowd: 0.15 },
]

// Avgangen som innstilles når avvikssimulatoren skrus på
export const CANCELLED_ID = 'd1'

export const extraBus = {
  id: 'extra',
  line: '6E',
  dest: 'Stavanger sentrum (ekstrabuss)',
  travel: 16,
  platform: 'A',
  crowd: 0.05,
  extra: true,
}

export const REPORT_TYPES = [
  { id: 'full', label: 'Full buss', icon: 'Users' },
  { id: 'late', label: 'Forsinket', icon: 'Clock' },
  { id: 'noshow', label: 'Kom ikke', icon: 'CircleOff' },
  { id: 'safety', label: 'Glatt/utrygt', icon: 'TriangleAlert' },
]

// Svar fra trafikksentralen på en rapport
export const OPERATOR_ANSWERS = {
  full: 'Takk. Vi ser det samme på passasjertellingen og setter inn ekstrabuss 6E fra plattform A.',
  late: 'Takk. Bussen står i kø ved Ullandhaug. Vi har oppdatert tiden for alle på holdeplassen.',
  noshow: 'Beklager. Vi har kontaktet sjåføren og varslet alle som venter. Du får forsinkelsesattest automatisk.',
  safety: 'Takk for at du sier fra. Brøytemannskapet er varslet og kommer innen 20 minutter.',
}

export const crowdSeed = [
  { who: 'Reisende', text: 'Ganske fullt på 6-eren, men det går fint å komme seg på.', ago: 4 },
  { who: 'Trafikksentralen', text: 'X60 går som normalt.', ago: 7, operator: true },
]

// ---------- Chat ----------

export const QUICK_REPLIES = [
  'Hva gjør jeg med billetten min?',
  'Rekker jeg forelesningen kl. 16?',
  'Kan dere ordne taxi?',
  'Jeg vil snakke med et menneske',
]

const RULES = [
  {
    test: /billett|kort|betal|refus|penger|reisegaranti/i,
    reply: (d) =>
      d
        ? 'Billetten din gjelder på ekstrabussen og på X60, så du trenger ikke gjøre noe. Blir du forsinket mer enn 20 minutter, dekker reisegarantien taxi. Vil du at jeg starter en refusjon nå?'
        : 'Billetten din gjelder på alle busser i samme sone. Blir du forsinket mer enn 20 minutter, dekker reisegarantien taxi. Jeg kan ordne det her i chatten.',
    actions: ['Ja, start refusjon', 'Nei takk'],
  },
  {
    test: /forelesning|rekk|møte|jobb|skole|kl\.? ?\d/i,
    reply: () =>
      'Ja. Ekstrabussen 6E fra plattform A er i sentrum om ca. 20 minutter. Vil du ha en forsinkelsesattest du kan vise foreleseren?',
    actions: ['Send attest', 'Varsle meg når bussen er nær'],
  },
  {
    test: /taxi|drosje/i,
    reply: () =>
      'Det kan vi. Neste buss går om under 20 minutter, men har du dårlig tid, sender vi taxi på vår regning. Skal jeg bestille til UiS Tjodhallen?',
    actions: ['Bestill taxi', 'Jeg venter på bussen'],
  },
  {
    test: /menneske|person|ringe|klage|sint|elendig|dårlig/i,
    handoff: true,
    reply: () =>
      'Hei, dette er Ingrid fra trafikksentralen. Jeg har lest samtalen, så du slipper å gjenta deg. Jeg forstår godt at du er lei. Hva ville hjulpet deg mest akkurat nå?',
  },
  {
    test: /^(ja|start|send|bestill|varsle)/i,
    reply: (_, t) =>
      /taxi/i.test(t)
        ? 'Taxi er bestilt. Den står ved hovedinngangen til Tjodhallen om ca. 6 minutter, og du får sjåførens navn på SMS.'
        : /attest/i.test(t)
          ? 'Attesten er sendt til e-posten din og ligger under Mine reiser.'
          : /varsle/i.test(t)
            ? 'Greit. Du får et varsel når 6E er 2 minutter unna.'
            : 'Refusjonen er startet med saksnummer MR-20481. Du får svar innen 24 timer.',
  },
  {
    test: /nei|venter/i,
    reply: () => 'Helt i orden. Skriv her hvis du trenger noe mer. God tur!',
  },
  {
    test: /takk|flott|supert|bra/i,
    reply: () => 'Så bra. Takk for at du sa fra, det hjelper oss med å gjøre det bedre for alle som reiser.',
  },
  {
    test: /hei|hallo/i,
    reply: (d) => (d ? 'Hei! Linje 6 fra UiS er innstilt akkurat nå. Hva kan jeg hjelpe deg med?' : 'Hei! Hva kan jeg hjelpe deg med?'),
  },
]

export function answer(text, disrupted) {
  const rule = RULES.find((r) => r.test.test(text.trim()))
  if (!rule)
    return {
      from: 'ai',
      text: 'Takk, det har jeg notert. Jeg har sendt det videre til trafikksentralen, og du får svar her, vanligvis innen et par minutter.',
    }
  return { from: rule.handoff ? 'human' : 'ai', text: rule.reply(disrupted, text), actions: rule.actions }
}

// ---------- Sosiale medier ----------

export const somePost = 'Linje 6 fra UiS er innstilt på grunn av teknisk feil.'

export const someOriginal = {
  author: 'Marius H.',
  text: 'Tredje gang denne uka at 6-eren fra UiS bare forsvinner. Står her i regnet med 40 andre. Hva skal vi gjøre?',
}

export const someOld = {
  brand: 'Kollektivselskapet',
  reply: 'Hei. Vi viser til informasjon om reisegarantien på våre nettsider. Mvh. Kundesenteret',
  followUps: [
    { author: 'Sara L.', text: 'Typisk. Kopier og lim inn.' },
    { author: 'Marius H.', text: 'Svarte dere egentlig på spørsmålet?' },
    { author: 'Jonas K.', text: 'Har sluttet å spørre dem om noe.' },
  ],
  footnote: 'Ingen videre svar. Innlegget er delt 48 ganger.',
  sentiment: 12,
  reactions: { angry: 214, like: 3 },
}

export const someNew = {
  brand: 'Move Rogaland',
  reply:
    'Hei Marius, det forstår vi godt. Det er ikke greit å bli stående i regnet. Ekstrabuss 6E går fra plattform A om 6 minutter, og billetten din gjelder. Vi sender deg en melding nå, så ordner vi resten.',
  followUps: [
    { author: 'Marius H.', text: 'Ok, takk for raskt svar. Ser bussen komme nå.' },
    { author: 'Sara L.', text: 'Bra at dere svarer ordentlig.' },
    { author: 'Move Rogaland', text: 'Takk for tålmodigheten. Vi følger med på linjen resten av kvelden.', brand: true },
  ],
  dm: [
    { from: 'brand', text: 'Hei igjen, Marius. Vil du at vi refunderer dagens billett?' },
    { from: 'user', text: 'Ja, gjerne.' },
    { from: 'brand', text: 'Det er ordnet. Takk for at du sa fra, det gjorde at vi kunne varsle alle.' },
  ],
  sentiment: 78,
  reactions: { angry: 9, like: 186 },
}

// ---------- Teori ----------

export const grunigModels = [
  { name: 'Pressetjeneste', flow: 'Enveis' },
  { name: 'Offentlig informasjon', flow: 'Enveis', today: true },
  { name: 'Toveis asymmetrisk', flow: 'Toveis, ubalansert' },
  { name: 'Toveis symmetrisk', flow: 'Toveis, balansert', target: true },
]

export const theories = [
  {
    id: 'grunig',
    title: 'Toveis symmetrisk kommunikasjon',
    authors: 'Grunig & Hunt (1984), Cornelissen',
    icon: 'ArrowLeftRight',
    core: 'Organisasjonen lytter og lar seg påvirke, i stedet for bare å sende ut informasjon. Målet er gjensidig forståelse og gode relasjoner med interessentene.',
    inApp: [
      'Reisende rapporterer fra holdeplassen, og trafikksentralen svarer',
      'Chatten svarer med en gang og setter deg over til et menneske ved behov',
      'Avviksvarselet ber om svar i stedet for bare å informere',
    ],
    tab: 'plan',
  },
  {
    id: 'scct',
    title: 'Situational Crisis Communication Theory',
    authors: 'Coombs (2007)',
    icon: 'ShieldAlert',
    core: 'Kriseresponsen tilpasses hvor mye ansvar publikum gir organisasjonen. Teknisk feil hører til ulykkesklyngen, med lav til moderat ansvarstilskrivelse.',
    inApp: [
      'Instruerende informasjon: hva gjør jeg nå (ekstrabuss, plattform, tid)',
      'Tilpassende informasjon: forståelse for situasjonen',
      'Ved gjentatte avvik: unnskyldning og kompensasjon (refusjon, taxi)',
    ],
    tab: 'plan',
  },
  {
    id: 'salience',
    title: 'Stakeholder Salience',
    authors: 'Mitchell, Agle & Wood (1997)',
    icon: 'Target',
    core: 'Interessenter prioriteres etter makt, legitimitet og hast. De som har alle tre, er definitive interessenter og må få svar umiddelbart.',
    inApp: [
      'Reisende som venter på holdeplassen under et avvik, er definitive interessenter',
      'Makt: en offentlig stemme i sosiale medier og valget om å ta bilen',
      'Legitimitet: betalende kunder. Hast: de trenger svar nå',
    ],
    tab: 'some',
  },
  {
    id: 'ugt',
    title: 'Uses and Gratifications Theory',
    authors: 'Katz, Blumler & Gurevitch (1974)',
    icon: 'Smartphone',
    core: 'Brukerne velger selv medier som dekker behovene deres. Appen må dekke flere behov enn informasjon for å bli brukt.',
    inApp: [
      'Informasjon: sanntid, alternativer og årsak',
      'Sosial interaksjon: meldinger fra andre reisende',
      'Identitet og innflytelse: rapporten din hjelper andre',
    ],
    tab: 'chat',
  },
  {
    id: 'poem',
    title: 'POEM og crowdcasting',
    authors: 'Paid, owned og earned media',
    icon: 'Megaphone',
    core: 'Kanalene ses i sammenheng: egne kanaler, betalte flater og omtale man gjør seg fortjent til. Med crowdcasting bidrar de reisende selv til sanntidsinformasjonen.',
    inApp: [
      'Owned: appen og chatten er hovedkanalen ved avvik',
      'Earned: gode svar i sosiale medier gir positiv omtale',
      'Crowdcasting: rapporter fra reisende oppdaterer linjen for alle',
    ],
    tab: 'plan',
  },
]
