import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown, ChevronRight, CircleOff, Clock, Flag, List, MessageCircle, TriangleAlert, Users } from 'lucide-react'
import { Button, CrowdMeter, Group, LineBadge, SectionHeader, Tag } from '../components/ui.jsx'
import Sheet from '../components/Sheet.jsx'
import { ROUTE, departures, CANCELLED_ID, extraBus as extraDef, REPORT_TYPES, OPERATOR_ANSWERS, crowdSeed } from '../data.js'
import { clock, depTime, minutesUntil } from '../lib/time.js'

const REPORT_ICONS = { Users, Clock, CircleOff, TriangleAlert }

let feedId = 0
export const initialFeed = () => crowdSeed.map((f) => ({ ...f, id: ++feedId, at: Date.now() - f.ago * 60000 }))

export default function Planner({ now, disrupted, extraBus, toast, onShowCrisis, onChat, onLines, store }) {
  const { reports, setReports, feed, setFeed } = store
  const [from, setFrom] = useState(ROUTE.from)
  const [to, setTo] = useState(ROUTE.to)
  const [reportOpen, setReportOpen] = useState(false)

  const rows = useMemo(() => {
    const list = departures.map((d) => ({ ...d, at: depTime(d.inMin, now), cancelled: disrupted && d.id === CANCELLED_ID }))
    if (extraBus) list.push({ ...extraDef, at: extraBus })
    return list.sort((a, b) => a.at - b.at)
  }, [now, disrupted, extraBus])

  const addFeed = (item) => setFeed((f) => [{ id: ++feedId, at: Date.now(), ...item }, ...f].slice(0, 6))

  const submitReport = ({ depId, type }) => {
    const dep = rows.find((r) => r.id === depId)
    const t = REPORT_TYPES.find((r) => r.id === type)
    setReports((r) => ({ ...r, [depId]: { type, label: t.label, count: (r[depId]?.count ?? 3) + 1 } }))
    addFeed({ who: 'Du', text: `${t.label}, linje ${dep.line} kl. ${clock(dep.at)}`, mine: true })
    setReportOpen(false)
    toast({ title: 'Rapporten er delt', body: `Alle som følger linje ${dep.line} ser den nå.` })
    setTimeout(() => {
      addFeed({ who: 'Trafikksentralen', text: OPERATOR_ANSWERS[type], operator: true })
      toast({ title: 'Trafikksentralen svarte', body: OPERATOR_ANSWERS[type] })
    }, 2600)
  }

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Søket ligger i den mørke toppen, som i vanlige reiseapper */}
      <div className="bg-brand px-4 pt-1 pb-4">
      <div className="overflow-hidden rounded-xl bg-surface">
        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            <Field label="Fra" value={from} onChange={setFrom} dot="bg-accent" />
            <div className="ml-10 border-t border-line" />
            <Field label="Til" value={to} onChange={setTo} dot="bg-danger" />
          </div>
          <button
            type="button"
            onClick={() => {
              setFrom(to)
              setTo(from)
            }}
            aria-label="Bytt fra og til"
            className="mr-3 grid size-9 place-items-center rounded-full bg-surface-2 text-muted active:bg-line"
          >
            <ArrowUpDown className="size-4" />
          </button>
        </div>
      </div>
      </div>

      <AnimatePresence initial={false}>
        {disrupted && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <button type="button" onClick={onShowCrisis} className="flex w-full items-center gap-3 bg-danger px-4 py-3 text-left text-white active:bg-danger/90">
              <TriangleAlert className="size-5 shrink-0" />
              <span className="flex-1 text-[14px] leading-snug">
                <span className="font-semibold">Linje 6 er innstilt.</span> Trykk for å si fra hvordan det påvirker deg.
              </span>
              <ChevronRight className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader title="Avganger" right={`Sanntid ${clock(now)}`} />
      <Group>
        <ul>
          <AnimatePresence initial={false}>
            {rows.map((d) => (
              <DepartureRow key={d.id} d={d} now={now} report={reports[d.id]} />
            ))}
          </AnimatePresence>
        </ul>
      </Group>

      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setReportOpen(true)}>
          <Flag className="size-[18px] text-accent" /> Rapporter
        </Button>
        <Button variant="secondary" onClick={onLines}>
          <List className="size-[18px] text-accent" /> Alle linjer
        </Button>
      </div>

      <SectionHeader title="Fra holdeplassen" />
      <Group>
        <ul aria-live="polite">
          <AnimatePresence initial={false}>
            {feed.map((f) => (
              <motion.li key={f.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-line px-4 py-3 [&+&]:border-t">
                <p className="flex items-baseline justify-between text-[13px]">
                  <span className={`font-semibold ${f.operator ? 'text-accent' : f.mine ? 'text-fg' : 'text-muted'}`}>{f.who}</span>
                  <span className="text-faint">{ago(f.at, now)}</span>
                </p>
                <p className="mt-0.5 text-[15px] leading-snug">{f.text}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Group>
      <div className="mx-4 mt-2">
        <Button variant="plain" className="h-10" onClick={onChat}>
          <MessageCircle className="size-4" /> Spør trafikksentralen
        </Button>
      </div>

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} rows={rows.filter((r) => !r.cancelled).slice(0, 4)} onSubmit={submitReport} />
    </div>
  )
}

function Field({ label, value, onChange, dot }) {
  const id = `field-${label}`
  return (
    <div className="flex items-center gap-3 px-4">
      <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <label htmlFor={id} className="w-7 shrink-0 text-[13px] text-faint">
        {label}
      </label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none" />
    </div>
  )
}

function DepartureRow({ d, now, report }) {
  const mins = minutesUntil(d.at, now)
  return (
    <motion.li
      layout
      initial={{ opacity: 0, backgroundColor: 'rgba(14,165,233,0.14)' }}
      animate={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0)' }}
      transition={{ backgroundColor: { duration: 2 } }}
      className="flex items-center gap-3 border-line px-4 py-3 [&+&]:border-t"
    >
      <LineBadge line={d.line} state={d.cancelled ? 'cancelled' : d.extra ? 'extra' : 'ok'} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-medium ${d.cancelled ? 'text-faint' : ''}`}>{d.dest}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[12px] text-faint">Plattform {d.platform}</span>
          {d.cancelled ? <Tag tone="danger">Innstilt</Tag> : <CrowdMeter value={report?.type === 'full' ? 0.95 : d.crowd} />}
          {d.extra && <Tag tone="info">Ny</Tag>}
          {report && (
            <Tag tone="warn">
              {report.label} · {report.count}
            </Tag>
          )}
        </div>
      </div>
      <div className="text-right tabular-nums">
        {d.cancelled ? (
          <span className="text-[15px] text-faint line-through">{clock(d.at)}</span>
        ) : (
          <>
            <span className="block text-[17px] font-semibold">{mins === 0 ? 'Nå' : mins <= 15 ? `${mins} min` : clock(d.at)}</span>
            {mins <= 15 && <span className="text-[12px] text-faint">{clock(d.at)}</span>}
          </>
        )}
      </div>
    </motion.li>
  )
}

function ReportSheet({ open, onClose, rows, onSubmit }) {
  const [depId, setDepId] = useState(null)
  const [type, setType] = useState(null)
  const selected = rows.some((r) => r.id === depId) ? depId : rows[0]?.id

  return (
    <Sheet
      open={open}
      onClose={() => {
        setType(null)
        onClose()
      }}
      title="Rapporter situasjon"
    >
      <p className="px-4 text-[14px] text-muted">Meldingen din vises for alle som følger avgangen, og trafikksentralen svarer.</p>

      <SectionHeader title="Avgang" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setDepId(r.id)}
            aria-pressed={selected === r.id}
            className={`h-9 shrink-0 rounded-full px-3.5 text-[14px] font-medium tabular-nums ${selected === r.id ? 'bg-brand text-white' : 'bg-surface-2 text-fg'}`}
          >
            {r.line} · {clock(r.at)}
          </button>
        ))}
      </div>

      <SectionHeader title="Hva skjer?" />
      <div className="grid grid-cols-2 gap-2 px-4">
        {REPORT_TYPES.map((r) => {
          const Icon = REPORT_ICONS[r.icon]
          const on = type === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setType(r.id)}
              aria-pressed={on}
              className={`flex h-14 items-center gap-2.5 rounded-xl px-3.5 text-[15px] ring-inset ${on ? 'bg-accent/10 text-accent ring-2 ring-accent' : 'bg-surface-2'}`}
            >
              <Icon className="size-5 shrink-0" /> {r.label}
            </button>
          )
        })}
      </div>

      <div className="px-4 pt-5">
        <Button
          disabled={!type}
          onClick={() => {
            onSubmit({ depId: selected, type })
            setType(null)
          }}
        >
          Send rapport
        </Button>
      </div>
    </Sheet>
  )
}

function ago(at, now) {
  const m = Math.floor((now - at) / 60000)
  return m < 1 ? 'nå' : `${m} min siden`
}
