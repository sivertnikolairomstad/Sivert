import { useCallback, useEffect, useRef, useState } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import CrisisCard from './components/CrisisCard.jsx'
import Toast from './components/Toast.jsx'
import { Switch } from './components/ui.jsx'
import Planner, { initialFeed } from './screens/Planner.jsx'
import Support from './screens/Support.jsx'
import Social from './screens/Social.jsx'
import Theory from './screens/Theory.jsx'
import { answer } from './data.js'
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
    msg({ from: 'ai', text: 'Hei! Jeg er Move-assistenten. Spør om hva som helst om reisen din. Vil du heller snakke med et menneske, setter jeg deg over til trafikksentralen.' }),
  ])
  const [typing, setTyping] = useState(false)
  const timers = useRef([])
  const extraTimer = useRef(null)
  const toastTimer = useRef(null)
  useEffect(() => () => [...timers.current, extraTimer.current, toastTimer.current].forEach(clearTimeout), [])

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
        toast({ title: 'Ekstrabuss 6E er satt inn', body: 'Går fra plattform A om 6 minutter.' })
      }, 4500)
      setMessages((m) => [
        ...m,
        msg({ from: 'system', text: 'Linje 6 fra UiS Tjodhallen er innstilt' }),
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
          setMessages((m) => [...m, msg(answer(text, disrupted))])
        }, 650),
      )
    },
    [disrupted],
  )

  const rateChat = (id, rating) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating } : x)))

  const goChat = () => {
    setCrisisOpen(false)
    setTab('chat')
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
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg sm:h-[844px] sm:max-h-full sm:w-[390px] sm:rounded-[54px] sm:shadow-[0_0_0_11px_#1a1d1c,0_0_0_12px_#2c302e,0_40px_80px_-20px_rgba(0,0,0,0.9)]">
          <StatusBar now={now} />
          <AppBar disrupted={disrupted} onToggle={toggleDisruption} />

          <main className="relative min-h-0 flex-1">
            {tab === 'plan' && (
              <Planner
                now={now}
                disrupted={disrupted}
                extraBus={extraBus}
                toast={toast}
                onShowCrisis={() => setCrisisOpen(true)}
                onChat={goChat}
                store={{ reports, setReports, feed, setFeed }}
              />
            )}
            {tab === 'chat' && <Support messages={messages} typing={typing} onSend={sendChat} onRate={rateChat} disrupted={disrupted} />}
            {tab === 'some' && <Social />}
            {tab === 'teori' && <Theory onTab={setTab} />}
          </main>

          <TabBar tab={tab} onTab={setTab} badge={disrupted && tab !== 'chat'} />

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
    <header className="flex h-12 shrink-0 items-center gap-2.5 px-4">
      <span className="grid size-8 place-items-center rounded-lg bg-accent" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#062b1b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18V7l8 7 8-7v11" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold">Move Rogaland</span>
      <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
        <span>Simuler avvik</span>
        <Switch on={disrupted} onToggle={onToggle} label="Simuler avvik" />
      </label>
    </header>
  )
}

function TabBar({ tab, onTab, badge }) {
  return (
    <nav aria-label="Faner" className="shrink-0 border-t border-line bg-bg/90 pb-6 backdrop-blur sm:pb-7">
      <ul className="grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-full flex-col items-center gap-0.5 pt-2 text-[10px] font-medium ${active ? 'text-accent' : 'text-faint'}`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.3 : 1.8} />
                {label}
                {id === 'chat' && badge && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 left-[calc(50%+6px)] size-2.5 rounded-full bg-danger" />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
