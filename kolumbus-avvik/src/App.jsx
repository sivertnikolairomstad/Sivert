import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import TopBar from './components/TopBar.jsx'
import CrisisCard from './components/CrisisCard.jsx'
import Toasts from './components/Toasts.jsx'
import Planner, { initialFeed } from './tabs/Planner.jsx'
import Support from './tabs/Support.jsx'
import Social from './tabs/Social.jsx'
import Theory from './tabs/Theory.jsx'
import { answer } from './data.js'
import { useNow } from './lib/time.js'
import { TABS } from './lib/tabs.js'


let msgId = 0
const msg = (m) => ({ id: ++msgId, at: Date.now(), ...m })

export default function App() {
  const now = useNow()
  const [tab, setTab] = useState('plan')
  const [disrupted, setDisrupted] = useState(false)
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [extraBus, setExtraBus] = useState(null) // avgangstid for ekstrabussen når den er satt inn
  const [toasts, setToasts] = useState([])
  const [reports, setReports] = useState({}) // depId → { type, label, count, mine }
  const [feed, setFeed] = useState(initialFeed)
  const [messages, setMessages] = useState(() => [
    msg({ from: 'ai', text: 'Hei! Æ er Move-assistenten. Spør meg om hva som helst om reisen din – æ svarer med en gang, og setter deg over til en av oss på trafikksentralen hvis du vil det 💚' }),
  ])
  const [typing, setTyping] = useState(false)
  const timers = useRef([])
  const extraTimer = useRef(null)
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => [...timers.current, extraTimer.current].forEach(clearTimeout), [])

  const toast = useCallback((t) => {
    const id = ++msgId
    setToasts((ts) => [...ts, { id, ...t }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.ms ?? 4200)
  }, [])

  const toggleDisruption = useCallback(() => {
    const next = !disrupted
    setDisrupted(next)
    setCrisisOpen(next)
    setExtraBus(null)
    clearTimeout(extraTimer.current)
    if (next) {
      // Operatøren handler synlig etter noen sekunder – ekstrabussen dukker opp for alle
      extraTimer.current = setTimeout(() => {
        setExtraBus(new Date(Math.ceil(Date.now() / 60000) * 60000 + 6 * 60000))
        toast({ tone: 'ok', title: 'Ekstrabuss 6E satt inn', body: 'Trafikksentralen svarte på avviket. Går fra plattform A.' })
      }, 4500)
      setMessages((m) => [
        ...m,
        msg({ from: 'system', text: 'Avvik: Linje 6 fra UiS Tjodhallen er innstilt (teknisk feil)' }),
        msg({ from: 'ai', text: 'Hei igjen! Æ ser at 6-eren du pleier å ta fra UiS er innstilt. Beklager så mye 😔 Ekstrabuss er på vei. Fortell meg gjerne hvordan det påvirker deg, så finner vi en løsning sammen.' }),
      ])
    } else {
      setMessages((m) => [...m, msg({ from: 'system', text: 'Avviket er løst – trafikken går normalt igjen' })])
    }
  }, [disrupted, toast])

  const sendChat = useCallback(
    (text) => {
      if (!text.trim()) return
      setMessages((m) => [...m, msg({ from: 'me', text: text.trim() })])
      setTyping(true)
      // «Med en gang»: kort skriveindikator så svaret oppleves som et svar, ikke en blink
      later(() => {
        setTyping(false)
        setMessages((m) => [...m, msg(answer(text, disrupted))])
      }, 650)
    },
    [disrupted],
  )

  const rateChat = (id, rating) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating } : x)))
    toast({
      tone: rating === 'up' ? 'ok' : 'info',
      title: rating === 'up' ? 'Takk for tilbakemeldingen!' : 'Takk – vi lærer av dette',
      body: rating === 'up' ? 'Den hjelper oss å svare enda bedre.' : 'En fra trafikksentralen ser på samtalen.',
    })
  }

  const openChat = (seed) => {
    setCrisisOpen(false)
    setTab('chat')
    if (seed) sendChat(seed)
  }

  // Snarveier for presentasjon: A = avvik, 1–4 = faner
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'a') toggleDisruption()
      const i = Number(e.key) - 1
      if (TABS[i]) setTab(TABS[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleDisruption])

  // Klammer: scrollTo returnerer en Promise i nyere Chromium, og React ville tolket den som cleanup
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  return (
    <MotionConfig reducedMotion="user">
      <Backdrop alert={disrupted} />
      <div className="relative min-h-dvh pb-28 sm:pb-12">
        <TopBar now={now} tab={tab} onTab={setTab} disrupted={disrupted} onToggle={toggleDisruption} />

        <AnimatePresence>
          {crisisOpen && (
            <CrisisCard
              now={now}
              onClose={() => setCrisisOpen(false)}
              onChat={() => openChat()}
              onPlan={() => {
                setCrisisOpen(false)
                setTab('plan')
              }}
            />
          )}
        </AnimatePresence>

        <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === 'plan' && (
                <Planner
                  now={now}
                  disrupted={disrupted}
                  extraBus={extraBus}
                  toast={toast}
                  onChat={openChat}
                  onShowCrisis={() => setCrisisOpen(true)}
                  store={{ reports, setReports, feed, setFeed }}
                />
              )}
              {tab === 'chat' && (
                <Support messages={messages} typing={typing} onSend={sendChat} onRate={rateChat} disrupted={disrupted} />
              )}
              {tab === 'some' && <Social />}
              {tab === 'teori' && <Theory onTab={setTab} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNav tab={tab} onTab={setTab} unread={disrupted && tab !== 'chat'} />
        {/* Under kriseoverlegget mens det er åpent, så varsler ikke dekker handlingsknappene */}
        <Toasts toasts={toasts} behind={crisisOpen} />
      </div>
    </MotionConfig>
  )
}

function Backdrop({ alert }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-teal-400/10 blur-[120px]" />
      <motion.div
        className="absolute -top-24 right-1/4 size-[26rem] rounded-full bg-rose-500/25 blur-[120px]"
        animate={{ opacity: alert ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
    </div>
  )
}

function MobileNav({ tab, onTab, unread }) {
  return (
    <nav
      aria-label="Faner"
      className="fixed inset-x-3 bottom-3 z-30 rounded-3xl border border-white/10 bg-slate-900/80 p-1.5 shadow-2xl backdrop-blur-xl sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-colors ${
                  active ? 'text-slate-950' : 'text-slate-400'
                }`}
              >
                {active && (
                  <motion.span layoutId="mnav" className="absolute inset-0 rounded-2xl bg-emerald-400" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />
                )}
                <Icon className="relative size-5" />
                <span className="relative">{label}</span>
                {id === 'chat' && unread && (
                  <span className="absolute top-1.5 right-[calc(50%-16px)] size-2.5 rounded-full bg-rose-400 ring-2 ring-slate-900" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
