import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, LocateFixed, X } from 'lucide-react'
import MapView from '../components/MapView.jsx'
import { Button, LineBadge } from '../components/ui.jsx'
import { vehicles as liveVehicles } from '../live.js'
import { CATEGORIES, PATTERNS } from '../routes.js'

const FILTERS = [
  ['alle', 'Alle'],
  ['bussveien', 'Bussveien'],
  ['by', 'Bybuss'],
  ['ekspress', 'Ekspress'],
  ['region', 'Region'],
  ['bat', 'Båt'],
]
const REGION = new Set(['jaeren', 'ryfylke', 'haugaland'])
const match = (f, cat) => f === 'alle' || f === cat || (f === 'region' && REGION.has(cat))

export default function LiveMap({ now, live, onLine }) {
  const [filter, setFilter] = useState('alle')
  const [selectedId, setSelectedId] = useState(null)
  const [follow, setFollow] = useState(false)

  const all = useMemo(() => liveVehicles(now, live), [now, live])
  const shown = useMemo(() => all.filter((v) => match(filter, v.route.cat) && v.route.cat !== 'skole'), [all, filter])
  const selected = all.find((v) => v.id === selectedId)

  // Ruten til valgt buss, med passerte holdeplasser fylt ut
  const p = selected ? PATTERNS[selected.pi] : null
  const path = useMemo(() => p?.quays.map((q) => [q.station.lat, q.station.lon]), [p])
  const stops = useMemo(() => (p && selected ? p.quays.map((q, i) => ({ name: q.station.name, lat: q.station.lat, lon: q.station.lon, passed: i <= selected.segment })) : []), [p, selected?.segment])

  return (
    <div className="relative h-full">
      <MapView
        className="absolute inset-0"
        vehicles={shown}
        focusId={selectedId}
        follow={follow}
        path={path}
        pathColor={selected ? CATEGORIES[selected.route.cat].color : undefined}
        stops={stops}
        onVehicle={(v) => {
          setSelectedId(v.id)
          setFollow(false)
        }}
      />

      {/* Filtre og antall øverst */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl bg-surface/95 px-3 py-2 shadow-md">
          <span className="flex items-center gap-2 text-[14px] font-semibold">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative size-2.5 rounded-full bg-emerald-500" />
            </span>
            {shown.length} i trafikk nå
          </span>
          <span className="text-[12px] text-muted">Simulert fra rutetabellen</span>
        </div>
        <div className="no-scrollbar pointer-events-auto mt-2 flex gap-1.5 overflow-x-auto">
          {FILTERS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`h-8 shrink-0 rounded-full px-3 text-[13px] font-medium shadow-sm ${filter === id ? 'bg-brand text-white' : 'bg-surface text-fg'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.section
            key="card"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            aria-label={`Linje ${selected.line}`}
            className="absolute inset-x-3 bottom-3 z-[500] rounded-2xl bg-surface p-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <LineBadge line={selected.line} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">mot {selected.headsign}</p>
                <p className="text-[13px] text-muted">
                  Neste stopp: <span className="text-fg">{selected.nextStop}</span>
                </p>
                <p className={`mt-0.5 text-[13px] font-medium ${selected.delay ? 'text-warn' : 'text-emerald-700'}`}>{selected.delay ? `${selected.delay} min forsinket` : 'I rute'}</p>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Lukk" className="grid size-8 place-items-center rounded-full bg-surface-2 text-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant={follow ? 'primary' : 'secondary'} className="h-11" onClick={() => setFollow((f) => !f)}>
                {follow ? <LocateFixed className="size-4" /> : <Crosshair className="size-4" />} {follow ? 'Følger bussen' : 'Følg bussen'}
              </Button>
              <Button variant="secondary" className="h-11" onClick={() => onLine(selected.route.id)}>
                Se linjen
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
