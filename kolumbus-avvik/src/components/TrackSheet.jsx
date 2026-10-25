import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellRing, Footprints } from 'lucide-react'
import Sheet from './Sheet.jsx'
import MapView from './MapView.jsx'
import { LineBadge } from './ui.jsx'
import { CATEGORIES } from '../routes.js'
import { trackTrip, vehicles as liveVehicles } from '../live.js'
import { clock } from '../lib/time.js'

const fmt = (m) => {
  const d = new Date()
  d.setHours(0, Math.round(m), 0, 0)
  return clock(d)
}

// Følg bussen du venter på: hvor den er, hvor mange stopp den har igjen og når den er fremme
export default function TrackSheet({ dep, from, now, live, onClose, toast, onDirections }) {
  const lastRef = useRef(null)
  if (dep) lastRef.current = { dep, from }
  const shown = dep ? { dep, from } : lastRef.current
  const [notify, setNotify] = useState(false)
  const notified = useRef(false)

  const t = useMemo(() => (shown?.dep.trip ? trackTrip({ ...shown.dep.trip, line: shown.dep.extra ? '6E' : undefined }, shown.from, now) : null), [shown, now])
  const color = shown ? CATEGORIES[shown.dep.route?.cat ?? 'by'].color : undefined
  const bus = useMemo(() => {
    if (!t || t.notStarted) return []
    const id = `${shown.dep.trip.pi}|${shown.dep.trip.start}${shown.dep.extra ? '|6E' : ''}`
    return liveVehicles(now, live).filter((v) => v.id === id)
  }, [t, now, live, shown])

  useEffect(() => {
    setNotify(false)
    notified.current = false
  }, [dep?.id])

  // Varsel når bussen er to minutter unna
  useEffect(() => {
    if (notify && !notified.current && t && t.minutesAway !== null && t.minutesAway <= 2) {
      notified.current = true
      toast({ title: `Linje ${shown.dep.line} er snart her`, body: `Ca. ${Math.max(0, Math.round(t.minutesAway))} min til ${shown.from}.` })
    }
  }, [notify, t, toast, shown])

  if (!shown || !t) return <Sheet open={false} onClose={onClose} title="" />

  const upcoming = t.stops.slice(Math.max(0, t.target - 6), t.target + 1)
  const mins = Math.max(0, Math.round(t.minutesAway ?? 0))
  const status = t.arrived ? 'Bussen er ved holdeplassen nå' : t.notStarted ? `Starter fra ${t.stops[0].name} kl. ${fmt(t.stops[0].at)}` : `${t.stopsAway} ${t.stopsAway === 1 ? 'stopp' : 'stopp'} unna`

  return (
    <Sheet open={!!dep} onClose={onClose} title={`Linje ${shown.dep.line}`}>
      <div className="px-4">
        <div className="flex items-center gap-3">
          <LineBadge line={shown.dep.line} state={shown.dep.extra ? 'extra' : 'ok'} />
          <p className="min-w-0 flex-1 truncate text-[16px] font-semibold">mot {shown.dep.toward}</p>
        </div>

        <div className="mt-3 flex items-end justify-between rounded-xl bg-surface-2 px-4 py-3">
          <div>
            <p className="text-[13px] text-muted">Til {shown.from}</p>
            <p className="text-[17px] font-semibold">{status}</p>
            <p className={`text-[13px] ${t.delay ? 'text-warn' : 'text-emerald-700'}`}>{t.delay ? `${t.delay} min forsinket` : 'I rute'}</p>
          </div>
          <div className="text-right tabular-nums">
            <p className="text-[30px] leading-none font-bold">{t.arrived ? 'Nå' : mins}</p>
            {!t.arrived && <p className="text-[12px] text-muted">min</p>}
          </div>
        </div>
      </div>

      <MapView
        className="mx-4 mt-3 h-56 overflow-hidden rounded-xl"
        vehicles={bus}
        focusId={bus[0]?.id}
        follow
        path={t.pattern.quays.map((q) => [q.station.lat, q.station.lon])}
        pathColor={color}
        stops={t.stops.map((s, i) => ({ ...s, highlight: i === t.target }))}
        center={[t.stops[t.target]?.lat ?? t.position.lat, t.stops[t.target]?.lon ?? t.position.lon]}
        zoom={13}
      />

      <button
        type="button"
        onClick={() => onDirections({ stop: shown.from, line: shown.dep.line.replace(/E$/, ''), toward: shown.dep.toward })}
        className="mx-4 mt-2 flex items-center gap-2 text-[14px] font-medium text-accent"
      >
        <Footprints className="size-4" /> Vis vei til holdeplassen
      </button>

      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <h3 className="text-[17px] font-semibold">På vei til deg</h3>
        <button
          type="button"
          aria-pressed={notify}
          onClick={() => {
            setNotify((n) => !n)
            if (!notify) toast({ title: 'Varsel er på', body: `Du får beskjed når linje ${shown.dep.line} er 2 min unna.` })
          }}
          className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ${notify ? 'bg-brand text-white' : 'bg-surface-2'}`}
        >
          {notify ? <BellRing className="size-4" /> : <Bell className="size-4" />} {notify ? 'Varsler deg' : 'Varsle meg'}
        </button>
      </div>
      <ol className="px-4">
        {upcoming.map((s, i) => {
          const isTarget = i === upcoming.length - 1
          return (
            <li key={s.name + i} className="relative flex items-center gap-3 pb-3 last:pb-0">
              {!isTarget && <span className="absolute top-3 left-[5px] h-full w-0.5" style={{ background: s.passed ? color : '#d6dcdf' }} aria-hidden />}
              <span className="relative size-3 shrink-0 rounded-full border-2" style={{ borderColor: isTarget ? '#c62d1f' : color, background: s.passed ? color : '#fff' }} aria-hidden />
              <span className={`flex-1 text-[15px] ${s.passed ? 'text-faint' : ''} ${isTarget ? 'font-semibold' : ''}`}>{s.name}</span>
              <span className={`text-[14px] tabular-nums ${s.passed ? 'text-faint' : ''}`}>{fmt(s.at)}</span>
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}
