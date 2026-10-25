// Scenario og innhold for prototypen. Avganger regnes relativt til «nå», så tidene
// alltid ser ekte ut uansett når presentasjonen holdes.

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
  inMin: 6,
  travel: 16,
  platform: 'A',
  crowd: 0.05,
  extra: true,
}

export const REPORT_TYPES = [
  { id: 'full', label: 'Full buss', icon: 'Users' },
  { id: 'late', label: 'Utsatt avgang', icon: 'Clock' },
  { id: 'noshow', label: 'Bussen kom ikke', icon: 'CircleOff' },
  { id: 'safety', label: 'Glatt / utrygt', icon: 'TriangleAlert' },
]

// Svar fra trafikksentralen på en rapport – lukker sløyfen tilbake til brukeren
export const OPERATOR_ANSWERS = {
  full: 'Takk! Vi ser det samme på passasjertellerne. Neste X60 får en ekstra vogn, og 6E settes inn fra plattform A.',
  late: 'Takk for beskjeden – sjåføren står i kø ved Ullandhaug. Vi har oppdatert tiden for alle på holdeplassen.',
  noshow: 'Beklager! Vi har kontaktet sjåføren og varslet alle som venter. Du får en forsinkelsesattest automatisk.',
  safety: 'Takk for at du sier ifra. Brøytemannskapet er varslet og kommer innen 20 min.',
}

export const crowdSeed = [
  { who: 'Reisende ved Tjodhallen', text: 'Ganske fullt på 6-eren nå, men greit å komme seg på.', ago: 4, type: 'full' },
  { who: 'Trafikksentralen', text: 'X60 går som normalt. Takk til dere som melder fra 💚', ago: 7, operator: true },
]

// ---------- Chat ----------

export const QUICK_REPLIES = [
  'Hva gjør æ med billetten min?',
  'Rekker æ forelesningen kl. 16?',
  'Kan dere ordne taxi?',
  'Æ vil snakke med et menneske',
]

const RULES = [
  {
    test: /billett|kort|betal|refus|penger|reisegaranti/i,
    reply: (d) =>
      d
        ? 'Billetten din gjelder automatisk på ekstrabussen og X60 – du trenger ikke gjøre noe 🙌 Blir du mer enn 20 min forsinket, refunderer vi taxi. Skal æ starte en refusjon for deg nå?'
        : 'Billetten din gjelder på alle våre busser i samme sone. Blir du forsinket mer enn 20 min, dekker reisegarantien taxi – æ kan ordne det for deg her i chatten.',
    actions: ['Ja, start refusjon', 'Nei takk, det går fint'],
  },
  {
    test: /forelesning|rekk|møte|jobb|skole|kl\.? ?\d/i,
    reply: () =>
      'Ja! Tar du ekstrabussen 6E fra plattform A er du i sentrum om ca. 20 min. Vil du at æ sender deg en forsinkelsesattest du kan vise foreleseren, sånn i tilfelle?',
    actions: ['Send attest', 'Varsle meg når bussen er 2 min unna'],
  },
  {
    test: /taxi|drosje/i,
    reply: () =>
      'Det kan vi! Ventetiden for neste buss er under 20 min nå, men står du med barn, bagasje eller har dårlig tid, sender vi en taxi på vår regning. Skal æ bestille til UiS Tjodhallen?',
    actions: ['Bestill taxi', 'Æ venter på bussen'],
  },
  {
    test: /menneske|person|ekte|ringe|klage|sint|elendig|dårlig/i,
    handoff: true,
    reply: () =>
      'Hei, Ingrid her fra trafikksentralen 👋 Æ har lest samtalen, så du slipper å gjenta deg. Det er helt forståelig at du er lei – fortell meg hva som ville hjulpet deg mest akkurat nå.',
  },
  {
    test: /^(ja|start|send|bestill|varsle)/i,
    reply: (_, t) =>
      /taxi/i.test(t)
        ? 'Taxi er bestilt 🚕 Den står ved hovedinngangen på Tjodhallen om ca. 6 min. Du får sjåførens navn på SMS.'
        : /attest/i.test(t)
          ? 'Ferdig! Attesten ligger under «Mine reiser» og er sendt til e-posten din. Lykke til på forelesningen 📚'
          : /varsle/i.test(t)
            ? 'Avtale! Du får et varsel når 6E er 2 min unna holdeplassen.'
            : 'Refusjonen er startet – saksnummer MR-20481. Du får svar innen 24 timer, som regel mye fortere.',
  },
  {
    test: /nei|går fint|venter/i,
    reply: () => 'Helt i orden! Æ er her hvis du trenger noe mer. God tur 💚',
  },
  {
    test: /takk|flott|supert|bra/i,
    reply: () => 'Så godt å høre! Takk for at du sa ifra – det hjelper oss å bli bedre for alle som reiser 💚',
  },
  {
    test: /hei|hallo|heisann/i,
    reply: (d) =>
      d
        ? 'Hei! Æ ser at linje 6 er innstilt fra UiS akkurat nå. Hvordan kan æ hjelpe deg videre?'
        : 'Hei! Hyggelig å høre fra deg. Hva kan æ hjelpe deg med i dag?',
  },
]

export function answer(text, disrupted) {
  const rule = RULES.find((r) => r.test.test(text.trim()))
  if (!rule)
    return {
      from: 'ai',
      text: 'Takk, det noterer æ meg. Æ har sendt det videre til trafikksentralen, og du får svar her i chatten – vanligvis innen et par minutter. Er det noe æ kan hjelpe deg med i mellomtiden?',
    }
  return {
    from: rule.handoff ? 'human' : 'ai',
    text: rule.reply(disrupted, text),
    actions: rule.actions,
  }
}

// ---------- Sosiale medier ----------

export const someOriginal = {
  author: 'Marius H.',
  text: 'Tredje gang denne uka at 6-eren fra UiS bare forsvinner. Står her i regnet med 40 andre. Hva skal vi gjøre??',
}

export const someOld = {
  reply: 'Hei. Vi viser til informasjon om reisegarantien på våre nettsider. Mvh. Kundesenteret',
  followUps: [
    { author: 'Sara L.', text: 'Typisk. Copy-paste og ferdig 🙄' },
    { author: 'Marius H.', text: 'Svarte dere egentlig på spørsmålet mitt?' },
    { author: 'Jonas K.', text: 'Samme her. Har sluttet å spørre dem om noe.' },
    { author: 'Eline B.', text: 'Del gjerne dette videre, folk må se hvordan de svarer.' },
  ],
  sentiment: 12,
  reactions: { angry: 214, like: 3 },
}

export const someNew = {
  reply:
    'Hei Marius – det skjønner vi godt, og det er ikke greit at dere står i regnet 😔 Linje 6 er innstilt pga. teknisk feil. Ekstrabuss 6E går fra plattform A om 6 min, og billetten gjelder. Vi sender deg en DM nå så vi får ordnet resten personlig 💚',
  followUps: [
    { author: 'Marius H.', text: 'Ok, takk for raskt svar. Ser bussen kommer nå 👍' },
    { author: 'Sara L.', text: 'Bra at dere faktisk svarer ordentlig!' },
    { author: 'Move Rogaland', text: 'Takk for tålmodigheten, alle sammen. Vi følger med på linjen resten av kvelden.', brand: true },
  ],
  dm: [
    { from: 'brand', text: 'Hei igjen, Marius! Vi beklager virkelig. Vil du at vi refunderer dagens billett?' },
    { from: 'user', text: 'Ja, det hadde vært fint.' },
    { from: 'brand', text: 'Ordnet ✅ Og takk for at du sa fra offentlig – det gjorde at vi kunne varsle alle.' },
  ],
  sentiment: 78,
  reactions: { angry: 9, like: 186 },
}

// ---------- Teori ----------

export const grunigModels = [
  { name: 'Pressetjeneste', flow: 'Enveis', goal: 'Oppmerksomhet' },
  { name: 'Offentlig informasjon', flow: 'Enveis', goal: 'Spre sann informasjon', today: true },
  { name: 'Toveis asymmetrisk', flow: 'Toveis, ubalansert', goal: 'Overtale' },
  { name: 'Toveis symmetrisk', flow: 'Toveis, balansert', goal: 'Gjensidig forståelse', target: true },
]

export const theories = [
  {
    id: 'grunig',
    title: 'Toveis symmetrisk kommunikasjon',
    authors: 'Grunig & Hunt (1984) · Cornelissen',
    icon: 'ArrowLeftRight',
    core: 'Kommunikasjon som dialog der organisasjonen lytter og lar seg påvirke, ikke bare sender. Målet er gjensidig forståelse og varige relasjoner med interessentene.',
    inApp: [
      'Rapporter situasjon gir trafikksentralen data fra de reisende, og de svarer tilbake',
      'Chatten svarer med en gang og overlater til et menneske ved behov',
      'Avviksvarselet ber om respons, det informerer ikke bare',
    ],
    tab: 'plan',
  },
  {
    id: 'scct',
    title: 'Situational Crisis Communication Theory',
    authors: 'Coombs (2007)',
    icon: 'ShieldAlert',
    core: 'Kriseresponsen tilpasses hvor mye ansvar publikum tillegger organisasjonen. Teknisk feil ligger i «ulykke»-klyngen (lav til moderat ansvarstilskrivelse).',
    inApp: [
      'Instruerende info: hva gjør jeg nå? (ekstrabuss, plattform, tid)',
      'Tilpassende info: empati og bekymring («det er ikke greit at dere står i regnet»)',
      'Gjenoppbygging ved gjentatte avvik: unnskyldning og kompensasjon (refusjon, taxi)',
    ],
    tab: 'plan',
  },
  {
    id: 'salience',
    title: 'Stakeholder Salience',
    authors: 'Mitchell, Agle & Wood (1997)',
    icon: 'Target',
    core: 'Interessenter prioriteres etter makt, legitimitet og hast. De som har alle tre er definitive interessenter og krever umiddelbar respons.',
    inApp: [
      'Reisende som står på holdeplassen under et avvik er definitive interessenter',
      'Makt: offentlig stemme i SoMe og valget om å ta bilen. Legitimitet: betalende kunde',
      'Hast: de trenger svar nå, ikke på e-post i morgen',
    ],
    tab: 'some',
  },
  {
    id: 'ugt',
    title: 'Uses and Gratifications Theory',
    authors: 'Katz, Blumler & Gurevitch (1974)',
    icon: 'Smartphone',
    core: 'Brukerne er aktive og velger medier som dekker egne behov. Appen må dekke flere behov for å bli brukt, ikke bare informasjonsbehovet.',
    inApp: [
      'Informasjon: sanntid, alternativ rute og årsak',
      'Sosial interaksjon: fellesskapsmeldinger fra andre reisende',
      'Identitet og innflytelse: «din rapport hjalp 214 reisende»',
    ],
    tab: 'chat',
  },
  {
    id: 'poem',
    title: 'POEM og crowdcasting',
    authors: 'Paid · Owned · Earned media',
    icon: 'Megaphone',
    core: 'Kanalene ses som en helhet: egne kanaler (appen), betalte flater og fortjent omtale. Crowdcasting gjør de reisende til medskapere av sanntidsinformasjonen.',
    inApp: [
      'Owned: appen og chatten som primærkanal ved avvik',
      'Earned: empatiske SoMe-svar som får positiv omtale og deling',
      'Crowdcasting: brukerrapporter oppdaterer linjen for alle',
    ],
    tab: 'plan',
  },
]

