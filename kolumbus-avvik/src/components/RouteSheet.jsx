import { Clock, Footprints, Users, Check } from 'lucide-react'
import Sheet from './Sheet.jsx'
import { LineBadge } from './ui.jsx'

export default function RouteSheet({ open, onClose, trip, selected, onSelect }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Alternativ: Buss ${trip.line}`}
      subtitle={`${trip.from} → ${trip.to}`}
      footer={
        <div className="border-t border-k-line bg-white px-5 pt-3 pb-6">
          <button
            type="button"
            onClick={onSelect}
            disabled={selected}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-k-green-600 text-base font-semibold text-white shadow-sm transition hover:bg-k-green-700 active:scale-[0.98] disabled:bg-k-green-50 disabled:text-k-green-700"
          >
            {selected ? (
              <>
                <Check className="size-5" strokeWidth={2.75} /> Reisen er oppdatert
              </>
            ) : (
              'Bytt til denne reisen'
            )}
          </button>
        </div>
      }
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <LineBadge line={trip.line} />
          <div className="flex-1">
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {trip.depart} <span className="text-k-muted">–</span> {trip.arrive}
            </p>
            <p className="text-sm text-k-muted">
              {trip.duration} · fremme {trip.delayVsOriginal} senere enn planlagt
            </p>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2 text-xs">
          <Fact icon={Footprints} label={trip.walk} />
          <Fact icon={Users} label={trip.occupancy} />
          <Fact icon={Clock} label="Sanntid: i rute" />
        </ul>

        <h3 className="mt-7 mb-3 text-xs font-semibold tracking-wider text-k-muted uppercase">
          Holdeplasser
        </h3>
        <ol className="relative">
          {trip.stops.map((stop, i) => {
            const edge = i === 0 || i === trip.stops.length - 1
            return (
              <li key={stop.name} className="relative flex gap-4 pb-5 last:pb-0">
                {i < trip.stops.length - 1 && (
                  <span className="absolute top-3 left-[7px] h-full w-0.5 bg-k-green" aria-hidden />
                )}
                <span
                  className={`relative z-10 mt-1 size-4 shrink-0 rounded-full border-[3px] border-k-green ${
                    edge ? 'bg-k-green' : 'bg-white'
                  }`}
                  aria-hidden
                />
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <div>
                    <p className={edge ? 'font-semibold' : 'text-k-ink-2'}>{stop.name}</p>
                    {stop.note && <p className="text-xs text-k-muted">{stop.note}</p>}
                  </div>
                  <time className="text-sm font-medium tabular-nums text-k-ink-2">{stop.time}</time>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Sheet>
  )
}

function Fact({ icon: Icon, label }) {
  return (
    <li className="flex flex-col items-start gap-1.5 rounded-xl bg-k-bg p-3 font-medium text-k-ink-2">
      <Icon className="size-4 text-k-green-700" aria-hidden />
      {label}
    </li>
  )
}
