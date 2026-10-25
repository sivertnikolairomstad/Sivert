import { useCallback, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Map,
  MessageCircle,
  Route,
  Search,
  Ticket,
  User,
  Wifi,
  BatteryFull,
  Signal,
} from 'lucide-react'
import { disruption, originalTrip, alternativeTrip } from './data.js'
import { LineBadge, StatusPill } from './components/ui.jsx'
import RouteSheet from './components/RouteSheet.jsx'
import ChatSheet from './components/ChatSheet.jsx'

export default function App() {
  const [sheet, setSheet] = useState(null) // null | 'route' | 'chat'
  const [rebooked, setRebooked] = useState(false)
  const closeSheet = useCallback(() => setSheet(null), [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-full items-center justify-center sm:p-8">
        {/* Telefonramme på desktop, fullskjerm på mobil */}
        <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-k-bg sm:h-[844px] sm:w-[390px] sm:rounded-[3rem] sm:shadow-[0_0_0_12px_#111,0_30px_80px_-10px_rgba(0,0,0,.45)]">
          <TopBar />

          <main className="flex-1 overflow-y-auto pb-6">
            <DisruptionAlert
              rebooked={rebooked}
              onRoute={() => setSheet('route')}
              onChat={() => setSheet('chat')}
            />
            <TripSection rebooked={rebooked} onOpenAlt={() => setSheet('route')} />
          </main>

          <BottomNav />

          <RouteSheet
            open={sheet === 'route'}
            onClose={closeSheet}
            trip={alternativeTrip}
            selected={rebooked}
            onSelect={() => {
              setRebooked(true)
              setTimeout(closeSheet, 700)
            }}
          />
          <ChatSheet open={sheet === 'chat'} onClose={closeSheet} disruption={disruption} />
        </div>
      </div>
    </MotionConfig>
  )
}

function TopBar() {
  return (
    <header className="bg-k-ink text-white">
      <div className="flex h-11 items-center justify-between px-7 pt-1 text-[13px] font-semibold tabular-nums">
        <span>07:44</span>
        <span className="flex items-center gap-1.5" aria-hidden>
          <Signal className="size-4" />
          <Wifi className="size-4" />
          <BatteryFull className="size-5" />
        </span>
      </div>
      <div className="px-5 pt-2 pb-5">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/15"
            aria-label="Varsler, 1 ny"
          >
            <Bell className="size-5" />
            <span className="absolute top-2 right-2.5 size-2.5 rounded-full bg-alert ring-2 ring-k-ink" />
          </button>
        </div>
        <label htmlFor="search" className="sr-only">
          Hvor vil du reise?
        </label>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-k-muted" />
          <input
            id="search"
            type="search"
            placeholder="Hvor vil du reise?"
            className="h-12 w-full rounded-2xl bg-white pr-4 pl-12 text-[15px] text-k-ink placeholder:text-k-muted focus:ring-3 focus:ring-k-green focus:outline-none"
          />
        </div>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-k-green" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M7 4v16M17 4l-8 8 8 8" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        kolumbus<span className="text-k-green">.</span>
      </span>
    </div>
  )
}

function DisruptionAlert({ rebooked, onRoute, onChat }) {
  return (
    <section aria-labelledby="alert-title" className="px-4 pt-4">
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260, delay: 0.15 }}
        className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_-12px_rgba(198,40,40,.35)] ring-1 ring-alert/25"
      >
        <div className="flex gap-3 bg-alert px-4 py-4 text-white">
          <motion.span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: 2, delay: 0.6 }}
            aria-hidden
          >
            <AlertTriangle className="size-5" strokeWidth={2.5} />
          </motion.span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-white/85 uppercase">
              Driftsavvik · din reise
            </p>
            <h1 id="alert-title" className="mt-0.5 text-[19px] leading-tight font-bold">
              Buss {disruption.line} til {disruption.destination} er innstilt
            </h1>
            <p className="mt-1 text-sm text-white/90">
              Årsak: {disruption.reason}. Gjelder avgang {disruption.affectedDeparture} fra {disruption.from}.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          <AnimatePresence mode="wait" initial={false}>
            {rebooked ? (
              <motion.button
                key="done"
                type="button"
                onClick={onRoute}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-14 w-full items-center gap-2.5 rounded-2xl bg-k-green-50 px-4 py-3 text-left ring-1 ring-k-green/40 ring-inset"
              >
                <CheckCircle2 className="size-6 shrink-0 text-k-green-700" />
                <span className="flex-1">
                  <span className="block font-semibold text-k-green-700">Du reiser nå med Buss 3</span>
                  <span className="block text-sm text-k-ink-2">
                    Går {alternativeTrip.depart} fra {alternativeTrip.platform}
                  </span>
                </span>
                <ChevronRight className="size-5 text-k-green-700" />
              </motion.button>
            ) : (
              <motion.button
                key="cta"
                type="button"
                onClick={onRoute}
                exit={{ opacity: 0, scale: 0.97 }}
                whileTap={{ scale: 0.98 }}
                className="flex min-h-14 w-full items-center gap-2.5 rounded-2xl bg-k-green-600 px-4 py-3 text-left text-white shadow-sm transition-colors hover:bg-k-green-700"
              >
                <Route className="size-6 shrink-0" />
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold">Se alternativ rute (Buss 3)</span>
                  <span className="block text-sm text-white/90">
                    {alternativeTrip.depart} → {alternativeTrip.arrive} · {alternativeTrip.delayVsOriginal}
                  </span>
                </span>
                <ArrowRight className="size-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={onChat}
            whileTap={{ scale: 0.98 }}
            className="flex min-h-14 w-full items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-left ring-2 ring-k-ink/85 ring-inset transition-colors hover:bg-k-bg"
          >
            <MessageCircle className="size-6 shrink-0 text-k-ink" />
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">Åpne chat med kundeservice</span>
              <span className="block text-sm text-k-muted">Svar innen ca. 2 min</span>
            </span>
            <ChevronRight className="size-5 text-k-muted" />
          </motion.button>

          <p className="pt-1 text-center text-xs text-k-muted">
            Oppdatert {disruption.updatedAt} · Du får varsel fordi reisen er lagret
          </p>
        </div>
      </motion.div>
    </section>
  )
}

function TripSection({ rebooked, onOpenAlt }) {
  const t = originalTrip
  return (
    <section aria-labelledby="trip-title" className="px-4 pt-7">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 id="trip-title" className="text-lg font-bold tracking-tight">
          Din reise i dag
        </h2>
        <span className="text-sm text-k-muted">Søn. 25. okt.</span>
      </div>

      <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-k-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LineBadge line={t.line} tone="muted" />
            <span className="text-sm font-medium text-k-muted">Planlagt reise</span>
          </div>
          <StatusPill>
            <span className="size-1.5 rounded-full bg-white" aria-hidden />
            Innstilt
          </StatusPill>
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1">
          <time className="text-xl font-bold tabular-nums text-k-muted line-through decoration-alert decoration-2">
            {t.depart}
          </time>
          <span className="relative mx-1 h-0.5 rounded-full bg-[repeating-linear-gradient(90deg,var(--color-alert)_0_6px,transparent_6px_10px)]" aria-hidden />
          <time className="text-xl font-bold tabular-nums text-k-muted line-through decoration-alert decoration-2">
            {t.arrive}
          </time>
          <p className="text-sm text-k-ink-2">{t.from}</p>
          <span className="text-center text-xs text-k-muted">{t.duration}</span>
          <p className="text-right text-sm text-k-ink-2">{t.to}</p>
        </div>

        <p className="mt-4 flex items-center gap-2 rounded-xl bg-alert-50 px-3 py-2.5 text-sm text-alert-700">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Avgangen kjøres ikke. Billetten din gjelder på alternativ rute.
        </p>
      </article>

      <AnimatePresence>
        {rebooked && (
          <motion.article
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={onOpenAlt}
              className="w-full rounded-3xl bg-white p-4 text-left shadow-sm ring-2 ring-k-green"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LineBadge line={alternativeTrip.line} />
                  <span className="text-sm font-medium text-k-ink-2">Ny reise</span>
                </div>
                <StatusPill tone="ok">I rute</StatusPill>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold tabular-nums">{alternativeTrip.depart}</span>
                <span className="mx-3 h-0.5 flex-1 rounded-full bg-k-green" aria-hidden />
                <span className="text-xl font-bold tabular-nums">{alternativeTrip.arrive}</span>
              </div>
              <p className="mt-1 text-sm text-k-muted">
                {alternativeTrip.platform} · {alternativeTrip.walk.split(' til')[0]}
              </p>
            </button>
          </motion.article>
        )}
      </AnimatePresence>
    </section>
  )
}

function BottomNav() {
  const items = [
    { icon: Route, label: 'Reise', active: true },
    { icon: Ticket, label: 'Billetter' },
    { icon: Map, label: 'Kart' },
    { icon: User, label: 'Profil' },
  ]
  return (
    <nav aria-label="Hovedmeny" className="border-t border-k-line bg-white px-2 pt-2 pb-6 sm:pb-7">
      <ul className="grid grid-cols-4">
        {items.map(({ icon: Icon, label, active }) => (
          <li key={label}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold ${
                active ? 'text-k-green-700' : 'text-k-muted'
              }`}
            >
              <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
