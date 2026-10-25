import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, MessageCircle, Search } from 'lucide-react'
import Sheet from './Sheet.jsx'
import { Button, Group, LineBadge, Row, SectionHeader } from './ui.jsx'
import { CATEGORIES, ROUTES, routeById, nextDepartures } from '../routes.js'
import { clock } from '../lib/time.js'

// value: null = lukket, '' = linjeliste, id = én linje
export default function LinesSheet({ value, onChange, now, onAsk }) {
  const [q, setQ] = useState('')
  const lastRef = useRef(null)
  const route = value ? routeById(value) : null
  if (value !== null) lastRef.current = route
  const shown = value === null ? lastRef.current : route

  const groups = useMemo(() => {
    const t = q.trim().toLowerCase()
    const hit = ROUTES.filter((r) => !t || r.id.toLowerCase().includes(t) || r.stops.some((s) => s.toLowerCase().includes(t)))
    return Object.entries(CATEGORIES)
      .map(([k, c]) => ({ ...c, key: k, routes: hit.filter((r) => r.cat === k) }))
      .filter((g) => g.routes.length)
  }, [q])

  return (
    <Sheet open={value !== null} onClose={() => onChange(null)} title={shown ? (shown.mode === 'boat' && isNaN(shown.id) ? shown.name : `Linje ${shown.id}`) : 'Alle linjer'}>
      {shown ? (
        <div>
          <button type="button" onClick={() => onChange('')} className="flex items-center gap-0.5 px-3 text-[15px] text-accent">
            <ChevronLeft className="size-5" /> Alle linjer
          </button>
          <div className="flex items-center gap-3 px-4 pt-3">
            <LineBadge line={shown.id} />
            <div className="min-w-0">
              <p className="text-[16px] font-semibold">{shown.name}</p>
              <p className="text-[13px] text-muted">
                {CATEGORIES[shown.cat].label} · {shown.every < 60 ? `hvert ${shown.every}. min` : shown.every === 60 ? 'hver time' : `hver ${shown.every / 60}. time`}
              </p>
            </div>
          </div>
          {shown.note && <p className="mx-4 mt-3 rounded-lg bg-surface-2 px-3 py-2 text-[14px]">{shown.note}</p>}

          <SectionHeader title="Neste avganger" right={`fra ${shown.stops[0]}`} />
          <div className="flex gap-2 px-4">
            {nextDepartures(shown, now).map((d) => (
              <span key={+d} className="rounded-lg bg-surface-2 px-3 py-1.5 text-[15px] font-semibold tabular-nums">
                {clock(d)}
              </span>
            ))}
          </div>

          <SectionHeader title="Holdeplasser" />
          <ol className="px-4">
            {shown.stops.map((s, i) => (
              <li key={s} className="relative flex items-center gap-3 pb-3 last:pb-0">
                {i < shown.stops.length - 1 && <span className="absolute top-3 left-[5px] h-full w-0.5" style={{ background: CATEGORIES[shown.cat].color }} aria-hidden />}
                <span className="relative size-3 shrink-0 rounded-full border-2 bg-surface" style={{ borderColor: CATEGORIES[shown.cat].color }} aria-hidden />
                <span className="text-[15px]">{s}</span>
              </li>
            ))}
          </ol>

          <div className="px-4 pt-5">
            <Button variant="secondary" onClick={() => onAsk(`Hvor går ${/^\d|^[xn]\d/i.test(shown.id) ? `linje ${shown.id}` : shown.id}?`)}>
              <MessageCircle className="size-[18px]" /> Spør om denne linjen
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mx-4 flex h-10 items-center gap-2 rounded-lg bg-surface-2 px-3">
            <Search className="size-4 text-faint" />
            <label htmlFor="line-search" className="sr-only">
              Søk etter linje eller holdeplass
            </label>
            <input id="line-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Linje eller holdeplass" className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint" />
          </div>
          {groups.map((g) => (
            <div key={g.key}>
              <SectionHeader title={g.label} right={`${g.routes.length}`} />
              <Group>
                {g.routes.map((r) => (
                  <Row key={r.id} icon={() => <LineBadge line={r.id} size="sm" />} title={r.name} onClick={() => onChange(r.id)} />
                ))}
              </Group>
            </div>
          ))}
          {!groups.length && <p className="px-4 pt-6 text-center text-[15px] text-muted">Ingen linjer passer søket.</p>}
        </div>
      )}
    </Sheet>
  )
}
