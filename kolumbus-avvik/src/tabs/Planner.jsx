import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpDown,
  CircleDot,
  CircleOff,
  Clock,
  Flag,
  MapPin,
  MessageCircleHeart,
  Radio,
  Search,
  Send,
  TriangleAlert,
  Users,
  Zap,
} from 'lucide-react'
import { Glass, LineBadge, Pill, CrowdMeter, SectionTitle } from '../components/ui.jsx'
import { ROUTE, departures, CANCELLED_ID, extraBus as extraDef, REPORT_TYPES, OPERATOR_ANSWERS, crowdSeed } from '../data.js'
import { clock, depTime, minutesUntil } from '../lib/time.js'

const REPORT_ICONS = { Users, Clock, CircleOff, TriangleAlert }

let feedId = 0

export const initialFeed = () => crowdSeed.map((f) => ({ ...f, id: ++feedId, at: Date.now() - f.ago * 60000 }))

export default function Planner({ now, disrupted, extraBus, toast, onChat, onShowCrisis, store }) {
  const [from, setFrom] = useState(ROUTE.from)
  const [to, setTo] = useState(ROUTE.to)
  const [loading, setLoading] = useState(false)
  // Rapporter og feed bor i App, så de overlever fanebytte
  const { reports, setReports, feed, setFeed } = store

  const search = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 650)
  }

  const rows = useMemo(() => {
    const list = departures.map((d) => ({
      ...d,
      at: depTime(d.inMin, now),
      cancelled: disrupted && d.id === CANCELLED_ID,
    }))
    if (extraBus) list.push({ ...extraDef, at: extraBus })
    return list.sort((a, b) => a.at - b.at)
  }, [now, disrupted, extraBus])

  const addFeed = (item) => setFeed((f) => [{ id: ++feedId, at: Date.now(), ...item }, ...f].slice(0, 8))

  const submitReport = ({ depId, type, note }) => {
    const dep = rows.find((r) => r.id === depId)
    const t = REPORT_TYPES.find((r) => r.id === type)
    setReports((r) => ({
      ...r,
      [depId]: { type, label: t.label, count: (r[depId]?.count ?? 3) + 1, mine: true },
    }))
    addFeed({ who: 'Du', text: `${t.label} på linje ${dep.line}${note ? ` – «${note}»` : ''}`, type, mine: true })
    toast({ tone: 'live', title: 'Rapporten din er delt', body: `214 reisende på linje ${dep.line} og trafikksentralen ser den nå.` })
    setTimeout(() => {
      addFeed({ who: 'Trafikksentralen', text: OPERATOR_ANSWERS[type], operator: true })
      toast({ tone: 'ok', title: 'Trafikksentralen svarte deg', body: 'Se «Live fra holdeplassen».' })
    }, 2400)
  }

  return (
    <div>
      <SectionTitle eyebrow="Fane 1 · Toveis reiseplanlegging" title="Reis smartere – sammen">
        Sanntid fra trafikksentralen og fra de som faktisk står på holdeplassen. Du får informasjon, og du gir informasjon
        tilbake.
      </SectionTitle>

      <AnimatePresence>
        {disrupted && (
          <motion.button
            type="button"
            onClick={onShowCrisis}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-left"
          >
            <Zap className="size-5 shrink-0 text-rose-300" />
            <span className="flex-1 text-sm text-rose-100">
              <strong className="font-semibold">Linje 6 er innstilt.</strong> Fortell oss hvordan det påvirker deg.
            </span>
            <span className="text-sm font-semibold text-rose-200">Åpne</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <Glass as="form" onSubmit={search} className="p-4 sm:p-5">
            <div className="flex items-stretch gap-3">
              <div className="flex flex-col items-center py-4" aria-hidden>
                <CircleDot className="size-4 text-emerald-300" />
                <span className="my-1 w-px flex-1 border-l border-dashed border-white/20" />
                <MapPin className="size-4 text-teal-300" />
              </div>
              <div className="flex-1 space-y-2">
                <Field label="Fra" value={from} onChange={setFrom} />
                <Field label="Til" value={to} onChange={setTo} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFrom(to)
                  setTo(from)
                }}
                className="grid size-11 place-items-center self-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:rotate-180 hover:text-white"
                aria-label="Bytt fra og til"
              >
                <ArrowUpDown className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                  <span className="relative size-2 rounded-full bg-emerald-400" />
                </span>
                Sanntid · oppdatert {clock(now)}
              </span>
              <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                <Search className="size-4" /> Søk
              </button>
            </div>
          </Glass>

          <Glass className="p-2 sm:p-3">
            <div className="flex items-center justify-between px-3 pt-2 pb-3">
              <h3 className="font-semibold text-white">Neste avganger</h3>
              <span className="hidden truncate text-xs text-slate-400 sm:block">{from} → {to}</span>
            </div>
            <ul className="space-y-1.5" aria-busy={loading}>
              {loading
                ? Array.from({ length: 4 }, (_, i) => <li key={i} className="h-[76px] animate-pulse rounded-2xl bg-white/[0.04]" />)
                : (
                  <AnimatePresence initial={false}>
                    {rows.map((d) => (
                      <DepartureRow key={d.id} d={d} now={now} report={reports[d.id]} />
                    ))}
                  </AnimatePresence>
                )}
            </ul>
          </Glass>
        </div>

        <div className="min-w-0 space-y-5 lg:col-span-2">
          <ReportCard rows={rows.filter((r) => !r.cancelled)} onSubmit={submitReport} />
          <LiveFeed feed={feed} now={now} onChat={onChat} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  const id = `f-${label}`
  return (
    <div className="rounded-2xl bg-white/[0.05] px-4 py-2 ring-1 ring-white/10 transition focus-within:ring-2 focus-within:ring-emerald-400/70">
      <label htmlFor={id} className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-[15px] font-medium text-white outline-none" />
    </div>
  )
}

function DepartureRow({ d, now, report }) {
  const mins = minutesUntil(d.at, now)
  const state = d.cancelled ? 'cancelled' : d.extra ? 'extra' : 'ok'
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -16, backgroundColor: 'rgba(45,212,191,0.18)' }}
      animate={{ opacity: 1, x: 0, backgroundColor: d.cancelled ? 'rgba(244,63,94,0.07)' : 'rgba(255,255,255,0.02)' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 sm:gap-4"
    >
      <LineBadge line={d.line} state={state} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${d.cancelled ? 'text-slate-400' : 'text-white'}`}>{d.dest}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-xs text-slate-400">Plattform {d.platform} · {d.travel} min</span>
          {!d.cancelled && <CrowdMeter value={report?.type === 'full' ? 0.95 : d.crowd} />}
          {d.cancelled && <Pill tone="alert">Innstilt · teknisk feil</Pill>}
          {d.extra && <Pill tone="info">Ny · satt inn nå</Pill>}
          {report && (
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Pill tone="warn">
                <Flag className="size-3" /> {report.label} · {report.count} rapporter
              </Pill>
            </motion.span>
          )}
        </div>
      </div>
      <div className="text-right">
        {d.cancelled ? (
          <span className="text-lg font-bold text-slate-500 tabular-nums line-through">{clock(d.at)}</span>
        ) : (
          <>
            <span className="block text-lg leading-none font-bold text-white tabular-nums">
              {mins === 0 ? 'Nå' : mins <= 15 ? `${mins} min` : clock(d.at)}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">{mins <= 15 ? clock(d.at) : `om ${mins} min`}</span>
          </>
        )}
      </div>
    </motion.li>
  )
}

function ReportCard({ rows, onSubmit }) {
  const [depId, setDepId] = useState(null)
  const [type, setType] = useState(null)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const selected = depId ?? rows[0]?.id
  const sentTimer = useRef()

  const send = () => {
    onSubmit({ depId: selected, type, note: note.trim() })
    setSent(true)
    setType(null)
    setNote('')
    clearTimeout(sentTimer.current)
    sentTimer.current = setTimeout(() => setSent(false), 2600)
  }

  return (
    <Glass className="relative overflow-hidden p-5">
      <div className="absolute -top-16 -right-16 size-40 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Flag className="size-5 text-emerald-300" />
          <h3 className="font-semibold text-white">Rapporter situasjon</h3>
        </div>
        <p className="mt-1 text-sm text-slate-400">Står du på holdeplassen? Din melding oppdaterer linjen for alle.</p>

        <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Hvilken avgang?</p>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {rows.slice(0, 4).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDepId(r.id)}
              aria-pressed={selected === r.id}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold tabular-nums ring-1 transition ${
                selected === r.id ? 'bg-emerald-400 text-slate-950 ring-emerald-300' : 'bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10'
              }`}
            >
              {r.line} · {clock(r.at)}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Hva skjer?</p>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_TYPES.map((r) => {
            const Icon = REPORT_ICONS[r.icon]
            const on = type === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setType(r.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-medium ring-1 transition ${
                  on ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/60' : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="size-4 shrink-0" /> {r.label}
              </button>
            )
          })}
        </div>

        <label htmlFor="report-note" className="sr-only">Kommentar (valgfritt)</label>
        <input
          id="report-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Legg til kommentar (valgfritt)"
          className="mt-3 h-11 w-full rounded-xl bg-white/[0.05] px-4 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400/70"
        />

        <button
          type="button"
          disabled={!type || !selected}
          onClick={send}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:bg-white/10 disabled:text-slate-500"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={sent ? 's' : 'n'} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="flex items-center gap-2">
              {sent ? 'Sendt – takk! 💚' : (<><Send className="size-4" /> Del med alle reisende</>)}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </Glass>
  )
}

function LiveFeed({ feed, now, onChat }) {
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <Radio className="size-5 text-teal-300" /> Live fra holdeplassen
        </h3>
        <Pill tone="muted">Crowdcasting</Pill>
      </div>
      <ul className="mt-4 space-y-2.5" aria-live="polite">
        <AnimatePresence initial={false}>
          {feed.map((f) => (
            <motion.li
              key={f.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`rounded-2xl px-3.5 py-3 text-sm ring-1 ${
                f.operator ? 'bg-emerald-400/10 ring-emerald-400/25' : f.mine ? 'bg-white/[0.07] ring-white/15' : 'bg-white/[0.03] ring-white/5'
              }`}
            >
              <p className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                <span className={`font-semibold ${f.operator ? 'text-emerald-300' : 'text-slate-300'}`}>{f.who}</span>
                <span className="text-slate-500 tabular-nums">{ago(f.at, now)}</span>
              </p>
              <p className="leading-relaxed text-slate-200">{f.text}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <button type="button" onClick={() => onChat()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-white/5">
        <MessageCircleHeart className="size-4" /> Still et spørsmål til trafikksentralen
      </button>
    </Glass>
  )
}

function ago(at, now) {
  const m = Math.floor((now - at) / 60000)
  return m < 1 ? 'nå' : `${m} min siden`
}
