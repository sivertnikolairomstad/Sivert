import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown, ChevronRight, CircleOff, Clock, Flag, List, MapPin, MessageCircle, Navigation, TriangleAlert, Users, X } from 'lucide-react'
import { Button, CrowdMeter, Group, LineBadge, SectionHeader, Tag } from '../components/ui.jsx'
import Sheet from '../components/Sheet.jsx'
import { REPORT_TYPES, OPERATOR_ANSWERS, crowdSeed } from '../data.js'
import { ALL_STOPS } from '../routes.js'
import { board, DIRECTIONS, DISRUPTED } from '../board.js'
import { clock, minutesUntil } from '../lib/time.js'

const REPORT_ICONS = { Users, Clock, CircleOff, TriangleAlert }
const ALIASES = { uis: 'UiS Tjodhallen', sentrum: 'Stavanger sentrum', stavanger: 'Stavanger sentrum', sandnes: 'Sandnes sentrum', sola: 'Sola sentrum', sykehuset: 'SUS', haugesund: 'Haugesund' }

let feedId = 0
export const initialFeed = () => crowdSeed.map((f) => ({ ...f, id: ++feedId, at: Date.now() - f.ago * 60000 }))

// Gjør fritekst om til en kjent holdeplass: eksakt navn, kallenavn eller eneste treff
function resolveStop(text) {
  const t = text.trim().toLowerCase()
  if (!t) return null
  const exact = ALL_STOPS.find((s) => s.toLowerCase() === t)
  if (exact) return exact
  if (ALIASES[t]) return ALIASES[t]
  const hits = ALL_STOPS.filter((s) => s.toLowerCase().includes(t))
  return hits.length === 1 ? hits[0] : null
}

export default function Planner({ now, disrupted, extraBus, toast, onShowCrisis, onChat, onLines, store }) {
  const { reports, setReports, feed, setFeed } = store
  const [from, setFrom] = useState('UiS Tjodhallen')
  const [to, setTo] = useState('')
  const [focus, setFocus] = useState(null) // 'from' | 'to' | null
  const [reportOpen, setReportOpen] = useState(false)
  const fromStop = resolveStop(from)
  const toStop = resolveStop(to)

  const rows = useMemo(() => {
    if (!fromStop) return []
    const list = board(fromStop, now, { to: toStop, count: 3 })
    if (disrupted && fromStop === DISRUPTED.stop) {
      const first = list.find((d) => d.key === DISRUPTED.key)
      if (first) first.cancelled = true
      if (extraBus && first) list.push({ ...first, id: 'extra', key: '6E|Stavanger sentrum', line: '6E', at: extraBus, cancelled: false, extra: true, crowd: 0.05, arrive: first.travel ? new Date(+extraBus + first.travel * 60000) : null })
    }
    return list.sort((a, b) => a.at - b.at)
  }, [fromStop, toStop, now, disrupted, extraBus])

  const nearest = rows.find((d) => !d.cancelled)

  const groups = useMemo(
    () =>
      DIRECTIONS.map((dir) => ({ dir, rows: rows.filter((d) => d.dir === dir).slice(0, 4) }))
        .filter((g) => g.rows.length)
        .sort((a, b) => a.rows[0].at - b.rows[0].at),
    [rows],
  )

  const addFeed = (item) => setFeed((f) => [{ id: ++feedId, at: Date.now(), ...item }, ...f].slice(0, 6))

  const submitReport = ({ row, type }) => {
    const t = REPORT_TYPES.find((r) => r.id === type)
    setReports((r) => ({ ...r, [row.key]: { type, label: t.label, count: (r[row.key]?.count ?? 3) + 1 } }))
    addFeed({ who: 'Du', text: `${t.label}, linje ${row.line} mot ${row.toward} fra ${fromStop}`, mine: true })
    setReportOpen(false)
    toast({ title: 'Rapporten er delt', body: `Alle som følger linje ${row.line} ser den nå.` })
    setTimeout(() => {
      addFeed({ who: 'Trafikksentralen', text: OPERATOR_ANSWERS[type], operator: true })
      toast({ title: 'Trafikksentralen svarte', body: OPERATOR_ANSWERS[type] })
    }, 2600)
  }

  const suggestions = focus ? ALL_STOPS.filter((s) => (focus === 'from' ? from : to).trim() && s.toLowerCase().includes((focus === 'from' ? from : to).trim().toLowerCase()) && s !== (focus === 'from' ? fromStop : toStop)).slice(0, 5) : []

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Søket ligger i den mørke toppen, som i vanlige reiseapper */}
      <div className="bg-brand px-4 pt-1 pb-4">
        <div className="overflow-hidden rounded-xl bg-surface">
          <div className="flex items-center">
            <div className="min-w-0 flex-1">
              <Field label="Fra" value={from} onChange={setFrom} onFocus={() => setFocus('from')} onBlur={() => setFocus(null)} dot="bg-accent" placeholder="Holdeplass" />
              <div className="ml-10 border-t border-line" />
              <Field label="Til" value={to} onChange={setTo} onFocus={() => setFocus('to')} onBlur={() => setFocus(null)} dot="bg-danger" placeholder="Hvor vil du reise? (valgfritt)" />
            </div>
            <button
              type="button"
              onClick={() => {
                setFrom(to || from)
                setTo(to ? from : '')
              }}
              aria-label="Bytt fra og til"
              className="mr-3 grid size-9 place-items-center rounded-full bg-surface-2 text-muted active:bg-line"
            >
              <ArrowUpDown className="size-4" />
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="border-t border-line" role="listbox" aria-label="Forslag">
              {suggestions.map((s) => (
                <li key={s} role="option" aria-selected="false">
                  <button
                    type="button"
                    // onMouseDown så valget registreres før feltet mister fokus
                    onMouseDown={(e) => {
                      e.preventDefault()
                      focus === 'from' ? setFrom(s) : setTo(s)
                      setFocus(null)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] active:bg-surface-2"
                  >
                    <MapPin className="size-4 text-faint" /> {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {disrupted && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <button type="button" onClick={onShowCrisis} className="flex w-full items-center gap-3 bg-danger px-4 py-3 text-left text-white active:bg-danger/90">
              <TriangleAlert className="size-5 shrink-0" />
              <span className="flex-1 text-[14px] leading-snug">
                <span className="font-semibold">Linje 6 fra UiS er innstilt.</span> Trykk for å si fra hvordan det påvirker deg.
              </span>
              <ChevronRight className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!fromStop ? (
        <p className="mx-4 mt-6 rounded-xl bg-surface px-4 py-5 text-center text-[15px] text-muted">
          {from.trim() ? `Fant ingen holdeplass som heter «${from.trim()}».` : 'Skriv inn holdeplassen du står ved.'}
        </p>
      ) : (
        <>
          {nearest && <Nearest d={nearest} now={now} from={fromStop} to={toStop} />}

          {toStop ? (
            <>
              <SectionHeader title={`Til ${toStop}`} right={`Sanntid ${clock(now)}`} />
              {rows.length ? (
                <Group>
                  <ul>
                    <AnimatePresence initial={false}>
                      {rows.slice(0, 6).map((d) => (
                        <DepartureRow key={d.id} d={d} now={now} report={reports[d.key]} showArrival />
                      ))}
                    </AnimatePresence>
                  </ul>
                </Group>
              ) : (
                <div className="mx-4 rounded-xl bg-surface px-4 py-4">
                  <p className="text-[15px]">Ingen direkte avganger fra {fromStop} til {toStop}.</p>
                  <Button variant="plain" className="mt-1 h-10" onClick={() => onChat(`Fra ${fromStop} til ${toStop}`)}>
                    <MessageCircle className="size-4" /> Spør Hjelp om beste reise
                  </Button>
                </div>
              )}
            </>
          ) : (
            groups.map((g) => (
              <div key={g.dir}>
                <SectionHeader title={`Retning ${g.dir}`} right={g.rows[0].platform === 'Kai' ? 'Kai' : `Plattform ${g.rows[0].platform}`} />
                <Group>
                  <ul>
                    <AnimatePresence initial={false}>
                      {g.rows.map((d) => (
                        <DepartureRow key={d.id} d={d} now={now} report={reports[d.key]} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </Group>
              </div>
            ))
          )}

          <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setReportOpen(true)} disabled={!rows.length}>
              <Flag className="size-[18px] text-accent" /> Rapporter
            </Button>
            <Button variant="secondary" onClick={onLines}>
              <List className="size-[18px] text-accent" /> Alle linjer
            </Button>
          </div>
        </>
      )}

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

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} rows={rows.filter((r) => !r.cancelled).slice(0, 5)} onSubmit={submitReport} />
    </div>
  )
}

function Field({ label, value, onChange, onFocus, onBlur, dot, placeholder }) {
  const id = `field-${label}`
  return (
    <div className="flex items-center gap-3 px-4">
      <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <label htmlFor={id} className="w-7 shrink-0 text-[13px] text-faint">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint"
      />
      {value && (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange('')} aria-label={`Tøm ${label.toLowerCase()}`} className="grid size-6 place-items-center rounded-full bg-surface-2 text-faint">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function Nearest({ d, now, from, to }) {
  const mins = minutesUntil(d.at, now)
  return (
    <motion.section layout aria-label="Nærmeste avgang" className="mx-4 mt-4 rounded-xl bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-accent">
        <Navigation className="size-3.5" /> Nærmeste avgang fra {from}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <LineBadge line={d.line} state={d.extra ? 'extra' : 'ok'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">mot {d.toward}</p>
          <p className="text-[13px] text-muted">
            Retning {d.dir} · {d.platform === 'Kai' ? 'Kai' : `Plattform ${d.platform}`}
            {to && d.arrive ? ` · fremme ${clock(d.arrive)}` : ''}
          </p>
        </div>
        <div className="text-right tabular-nums">
          <p className="text-[26px] leading-none font-bold">{mins === 0 ? 'Nå' : mins <= 30 ? mins : clock(d.at)}</p>
          {mins > 0 && mins <= 30 && <p className="text-[12px] text-muted">min</p>}
        </div>
      </div>
    </motion.section>
  )
}

function DepartureRow({ d, now, report, showArrival }) {
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
        <p className={`truncate text-[15px] font-medium ${d.cancelled ? 'text-faint' : ''}`}>{d.extra ? `${d.toward} (ekstrabuss)` : d.toward}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {showArrival && d.arrive ? <span className="text-[12px] text-faint">Fremme {clock(d.arrive)} · {d.travel} min</span> : <span className="text-[12px] text-faint">{d.platform === 'Kai' ? 'Kai' : `Plattform ${d.platform}`}</span>}
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
  const [rowId, setRowId] = useState(null)
  const [type, setType] = useState(null)
  const selected = rows.find((r) => r.id === rowId) ?? rows[0]

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
            onClick={() => setRowId(r.id)}
            aria-pressed={selected?.id === r.id}
            className={`h-9 shrink-0 rounded-full px-3.5 text-[14px] font-medium tabular-nums ${selected?.id === r.id ? 'bg-brand text-white' : 'bg-surface-2 text-fg'}`}
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
          disabled={!type || !selected}
          onClick={() => {
            onSubmit({ row: selected, type })
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
