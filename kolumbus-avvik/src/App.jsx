import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import CrisisCard from './components/CrisisCard.jsx'
import Toast from './components/Toast.jsx'
import { Switch } from './components/ui.jsx'
import Planner, { initialFeed } from './screens/Planner.jsx'
import LiveMap from './screens/LiveMap.jsx'
import TrackSheet from './components/TrackSheet.jsx'
import DirectionsSheet from './components/DirectionsSheet.jsx'
import { DEMO_LOCATION, nearestStops } from './directions.js'
import { cancelledDeparture } from './board.js'
import Support from './screens/Support.jsx'
import News from './screens/News.jsx'
import LinesSheet from './components/LinesSheet.jsx'
import Theory from './screens/Theory.jsx'
import { answer } from './assistant.js'
import { clock, useNow } from './lib/time.js'
import { TABS } from './lib/tabs.js'

let uid = 0
const msg = (m) => ({ id: ++uid, ...m })

export default function App() {
  const now = useNow()
  const [tab, setTab] = useState('plan')
  const [disrupted, setDisrupted] = useState(false)
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [extraBus, setExtraBus] = useState(null) // avgangstid for ekstrabussen når den er satt inn
  const [toastItem, setToastItem] = useState(null)
  const [reports, setReports] = useState({})
  const [feed, setFeed] = useState(initialFeed)
  const [messages, setMessages] = useState(() => [
    msg({ from: 'ai', text: 'Hei! Jeg er Move-assistenten og kjenner alle Kolumbus-linjene. Spør om en linje, et sted eller reisen din. Vil du heller snakke med et menneske, setter jeg deg over til trafikksentralen.' }),
  ])
  const [typing, setTyping] = useState(false)
  const [lines, setLines] = useState(null) // null = lukket, '' = liste, id = valgt linje
  const [track, setTrack] = useState(null) // { dep, from } når du følger en buss
  const [directions, setDirections] = useState(null) // { stop, line?, toward? } for veibeskrivelse
  const [location, setLocation] = useState(DEMO_LOCATION)
  const asked = useRef(false)

  // Posisjonen spørres om først når noen ber om veibeskrivelse
  const locate = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lon: p.coords.longitude, demo: false }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  }, [])
  const showDirections = useCallback(
    (req) => {
      if (!asked.current) {
        asked.current = true
        locate()
      }
      setDirections(req.nearest ? { stop: nearestStops(location, 1)[0].name } : req)
    },
    [locate, location],
  )
  const timers = useRef([])
  const extraTimer = useRef(null)
  const toastTimer = useRef(null)
  useEffect(() => () => [...timers.current, extraTimer.current, toastTimer.current].forEach(clearTimeout), [])

  // Sanntid: den innstilte turen forsvinner fra kartet, ekstrabussen dukker opp
  const minuteKey = Math.floor(+now / 60000)
  const live = useMemo(() => {
    if (!disrupted) return {}
    const c = cancelledDeparture(new Date(minuteKey * 60000))
    if (!c) return {}
    const extra = extraBus ? [{ ...c.trip, start: c.trip.start + c.delay + (extraBus - c.at) / 60000, line: '6E' }] : []
    return { cancelled: [c.trip], extra }
  }, [disrupted, extraBus, minuteKey])

  const toast = useCallback((t) => {
    clearTimeout(toastTimer.current)
    setToastItem({ id: ++uid, ...t })
    toastTimer.current = setTimeout(() => setToastItem(null), 3500)
  }, [])

  const toggleDisruption = useCallback(() => {
    const next = !disrupted
    setDisrupted(next)
    setCrisisOpen(next)
    setExtraBus(null)
    clearTimeout(extraTimer.current)
    if (next) {
      // Trafikksentralen reagerer synlig etter noen sekunder
      extraTimer.current = setTimeout(() => {
        setExtraBus(new Date(Math.ceil(Date.now() / 60000) * 60000 + 6 * 60000))
        toast({ title: 'Ekstrabuss 6E er satt inn', body: 'Går fra UiS øst, plattform B, om 6 minutter.' })
      }, 4500)
      setMessages((m) => [
        ...m,
        msg({ from: 'system', text: 'Linje 6 fra UiS øst mot Stavanger er innstilt' }),
        msg({ from: 'ai', text: 'Bussen du pleier å ta fra UiS er innstilt, beklager. Ekstrabuss er på vei. Si gjerne fra hvordan dette påvirker deg, så finner vi en løsning.' }),
      ])
    } else {
      setMessages((m) => [...m, msg({ from: 'system', text: 'Avviket er løst' })])
    }
  }, [disrupted, toast])

  const sendChat = useCallback(
    (text) => {
      if (!text.trim()) return
      setMessages((m) => [...m, msg({ from: 'me', text: text.trim() })])
      setTyping(true)
      timers.current.push(
        setTimeout(() => {
          setTyping(false)
          setMessages((m) => [...m, msg(answer(text, { disrupted, now: new Date() }))])
        }, 650),
      )
    },
    [disrupted],
  )

  const rateChat = (id, rating) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating } : x)))

  const goChat = (question) => {
    setCrisisOpen(false)
    setLines(null)
    setTab('chat')
    if (typeof question === 'string') sendChat(question)
  }

  // Snarveier for presentasjonen: A = avvik, 1–4 = faner
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'a') toggleDisruption()
      const t = TABS[Number(e.key) - 1]
      if (t) setTab(t.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleDisruption])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh items-center justify-center sm:p-6">
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[54px] sm:shadow-[0_0_0_11px_#16191b,0_0_0_12px_#33383b,0_40px_80px_-20px_rgba(0,0,0,0.45)]">
          <div className="shrink-0 bg-brand text-white">
            <StatusBar now={now} />
            <AppBar disrupted={disrupted} onToggle={toggleDisruption} />
          </div>

          <main className="relative isolate min-h-0 flex-1">
            {tab === 'plan' && (
              <Planner
                now={now}
                disrupted={disrupted}
                extraBus={extraBus}
                toast={toast}
                onShowCrisis={() => setCrisisOpen(true)}
                onChat={goChat}
                onLines={() => setLines('')}
                onTrack={(dep, from) => setTrack({ dep, from })}
                onDirections={showDirections}
                store={{ reports, setReports, feed, setFeed }}
              />
            )}
            {tab === 'kart' && <LiveMap now={now} live={live} onLine={setLines} />}
            {tab === 'news' && <News disrupted={disrupted} onAsk={goChat} onShowCrisis={() => setCrisisOpen(true)} />}
            {tab === 'chat' && <Support messages={messages} typing={typing} onSend={sendChat} onRate={rateChat} onRoute={setLines} onDirections={showDirections} location={location} disrupted={disrupted} />}
            {tab === 'teori' && <Theory onTab={setTab} />}
          </main>

          <TabBar tab={tab} onTab={setTab} badge={disrupted && tab !== 'news'} />

          <LinesSheet value={lines} onChange={setLines} now={now} onAsk={goChat} />
          <TrackSheet
            dep={track?.dep}
            from={track?.from}
            now={now}
            live={live}
            onClose={() => setTrack(null)}
            toast={toast}
            onDirections={(req) => {
              setTrack(null)
              showDirections(req)
            }}
          />
          <DirectionsSheet request={directions} location={location} onLocate={locate} onClose={() => setDirections(null)} />
          <Toast toast={crisisOpen ? null : toastItem} />
          <CrisisCard
            open={crisisOpen}
            now={now}
            onClose={() => setCrisisOpen(false)}
            onChat={goChat}
            onPlan={() => {
              setCrisisOpen(false)
              setTab('plan')
            }}
          />
        </div>
      </div>
    </MotionConfig>
  )
}

function StatusBar({ now }) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-[15px] font-semibold tabular-nums sm:h-12 sm:pt-2" aria-hidden>
      <span>{clock(now)}</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" />
        <Wifi className="size-4" />
        <BatteryFull className="size-5" />
      </span>
    </div>
  )
}

function AppBar({ disrupted, onToggle }) {
  return (
    <header className="flex h-12 items-center gap-2 px-4 pb-1">
      <Logo />
      <span className="text-[17px] font-semibold tracking-tight">Move Rogaland</span>
      <label className="ml-auto flex items-center gap-2 text-[13px] text-white/75">
        <span>Simuler avvik</span>
        <Switch on={disrupted} onToggle={onToggle} label="Simuler avvik" />
      </label>
    </header>
  )
}

function Logo() {
  // To piler i hver sin retning: kommunikasjon begge veier
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <rect width="28" height="28" rx="7" fill="#fff" />
      <path d="M7 11h12l-3-3M21 17H9l3 3" fill="none" stroke="#0b3d4a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TabBar({ tab, onTab, badge }) {
  return (
    <nav aria-label="Faner" className="shrink-0 border-t border-line bg-surface pb-6 sm:pb-7">
      <ul className="grid grid-cols-5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-full flex-col items-center gap-0.5 pt-2 text-[11px] font-medium ${active ? 'text-brand' : 'text-faint'}`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.7} />
                {label}
                {id === 'news' && badge && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 left-[calc(50%+6px)] size-2.5 rounded-full bg-danger" />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
