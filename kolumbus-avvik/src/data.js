// Scenario og tekster for prototypen. Avgangstavlen lages i board.js.
// Linjenettet ligger i routes.js, chatlogikken i assistant.js.

export const REPORT_TYPES = [
  { id: 'full', label: 'Full buss', icon: 'Users' },
  { id: 'late', label: 'Forsinket', icon: 'Clock' },
  { id: 'noshow', label: 'Kom ikke', icon: 'CircleOff' },
  { id: 'safety', label: 'Glatt/utrygt', icon: 'TriangleAlert' },
]

// Svar fra trafikksentralen på en rapport
export const OPERATOR_ANSWERS = {
  full: 'Takk. Vi ser det samme på passasjertellingen og setter inn ekstrabuss 6E fra plattform B.',
  late: 'Takk. Bussen står i kø ved Ullandhaug. Vi har oppdatert tiden for alle på holdeplassen.',
  noshow: 'Beklager. Vi har kontaktet sjåføren og varslet alle som venter. Du får forsinkelsesattest automatisk.',
  safety: 'Takk for at du sier fra. Brøytemannskapet er varslet og kommer innen 20 minutter.',
}

export const crowdSeed = [
  { who: 'Reisende', text: 'Ganske fullt på 6-eren, men det går fint å komme seg på.', ago: 4 },
  { who: 'Trafikksentralen', text: 'Linje 7 går som normalt.', ago: 7, operator: true },
]

// ---------- Chat ----------

export const QUICK_REPLIES = [
  'Når går neste buss til sentrum?',
  'Når går 7 fra Madlakrossen?',
  'Når går siste buss til Sandnes?',
  'Hvordan kommer jeg til Sola?',
  'Hvor er UiS øst?',
  'Hvor er nærmeste busstopp?',
  'Når går båten til Hommersåk?',
  'Hva gjør jeg med billetten min?',
  'Jeg vil snakke med et menneske',
]

// ---------- Nyheter ----------
// Basert på Kolumbus' egne kunngjøringer, forkortet og omskrevet for prototypen.

export const NEWS = [
  {
    id: 'bussveien',
    tag: 'Nyhet',
    date: '1. juli 2026',
    title: 'Bussveien er åpnet mellom Stavanger og Sandnes',
    body: 'Linje 1 går mellom Stavanger sentrum og Sandnes sentrum, og linje 2 går mellom Stavanger sentrum og Forus Nord. I rushtiden går det buss hvert femte minutt. Linje 1 går hele døgnet.',
    ask: 'Hvor går linje 1?',
    useful: 412,
  },
  {
    id: 'numre',
    tag: 'Ruteendring',
    date: '1. juli 2026',
    title: 'Nye linjenumre på Nord-Jæren',
    body: 'Rute 1 Stavanger – Hundvåg heter nå 9. Rute 2 Stavanger – Sandnes heter nå 1, og rute 2 Stavanger – Risavika heter nå 4. Rute 3 Stavanger – Forus heter nå 2. Rute 3 er en ny rute mellom Stavanger og Viste hageby.',
    ask: 'Hvor går linje 3?',
    useful: 287,
  },
  {
    id: '11-16',
    tag: 'Ruteendring',
    date: '1. juli 2026',
    title: 'Endringer på rute 11 og 16',
    body: 'Rute 11 går nå bare til og fra Jåttåvågen og kjører ikke lenger annenhver avgang til Hinna gravlund. Rute 16 kjører ikke lenger avganger om Lassa.',
    ask: 'Hvor går linje 16?',
    useful: 64,
  },
  {
    id: '800',
    tag: 'Båt',
    date: '15. april 2026',
    title: 'Nye tider for båtrute 800 til Byøyene og Hommersåk',
    body: 'Ny rutetabell for Stavanger – Byøyene – Usken – Hommersåk. Kveldsavgangene mandag til torsdag går fra Fiskepiren 3.',
    ask: 'Når går båtrute 800?',
    useful: 39,
  },
  {
    id: 'ryfylke',
    tag: 'Båt',
    date: '14. oktober 2025',
    title: 'Nytt bestillingsnummer for hurtigbåt i Ryfylke',
    body: 'Hurtigbåtene til og fra Ryfylke har fått nytt bestillingsnummer. Billetter kjøpes fortsatt på billetter.kolumbus.no.',
    ask: 'Hvor går hurtigbåten i Ryfylke?',
    useful: 22,
  },
]

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
    tab: 'chat',
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
