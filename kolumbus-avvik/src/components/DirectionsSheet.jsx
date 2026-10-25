import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Footprints, LocateFixed, Navigation } from 'lucide-react'
import Sheet from './Sheet.jsx'
import MapView from './MapView.jsx'
import { LineBadge, SectionHeader } from './ui.jsx'
import { fetchWalkRoute, fmtDistance, heading, targetFor, walkMeters, walkMinutes } from '../directions.js'

// Veibeskrivelse til en holdeplass, helst til riktig plattform
export default function DirectionsSheet({ request, location, onLocate, onClose }) {
  const lastRef = useRef(null)
  if (request) lastRef.current = request
  const req = request ?? lastRef.current
  const [route, setRoute] = useState(null) // gangrute fra routing-tjenesten
  const [loading, setLoading] = useState(false)

  const target = useMemo(() => (req ? targetFor(req.stop, location, req) : null), [req, location])

  useEffect(() => {
    if (!request || !target) return
    let alive = true
    setRoute(null)
    setLoading(true)
    fetchWalkRoute(location, target).then((r) => {
      if (!alive) return
      setRoute(r)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [request, target?.lat, target?.lon, location.lat, location.lon])

  if (!req || !target) return <Sheet open={false} onClose={onClose} title="" />

  const meters = route?.meters ?? walkMeters(location, target)
  const dir = heading(location, target)
  const google = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lon}&travelmode=walking`
  const far = meters > 5000

  return (
    <Sheet open={!!request} onClose={onClose} title="Veibeskrivelse">
      <div className="px-4">
        <p className="text-[13px] text-muted">Til holdeplassen</p>
        <h3 className="text-[20px] leading-tight font-bold">
          {req.stop}
          {target.platform && target.platform !== '–' ? `, plattform ${target.platform}` : ''}
        </h3>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3">
          <Footprints className="size-6 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="text-[17px] font-semibold">
              {fmtDistance(meters)} · ca. {walkMinutes(meters)} min å gå
            </p>
            <p className="text-[13px] text-muted">{far ? 'Det er langt å gå. Ta heller en buss eller sjekk avstanden.' : `Holdeplassen ligger mot ${dir} fra deg.`}</p>
          </div>
        </div>
        <p className="mt-2 flex items-center justify-between gap-2 text-[12px] text-faint">
          <span>{location.demo ? 'Viser fra UiS (demo). Del posisjonen din for nøyaktig vei.' : 'Fra din posisjon nå.'}</span>
          {location.demo && (
            <button type="button" onClick={onLocate} className="flex shrink-0 items-center gap-1 font-medium text-accent">
              <LocateFixed className="size-3.5" /> Bruk min posisjon
            </button>
          )}
        </p>
      </div>

      <MapView
        className="mx-4 mt-3 h-56 overflow-hidden rounded-xl"
        you={location}
        walk={route?.path ?? [[location.lat, location.lon], [target.lat, target.lon]]}
        stops={[{ name: `${req.stop}${target.platform ? ` ${target.platform}` : ''}`, lat: target.lat, lon: target.lon, highlight: true }]}
        fit={[[location.lat, location.lon], [target.lat, target.lon]]}
        center={[target.lat, target.lon]}
        zoom={16}
      />

      <SectionHeader title="Slik går du" right={route ? `${route.steps.length} steg` : loading ? 'Henter gangrute …' : 'Luftlinje'} />
      <ol className="mx-4 overflow-hidden rounded-xl bg-surface-2">
        {(route?.steps ?? [
          { text: `Gå mot ${dir}, ca. ${fmtDistance(meters)}`, meters },
          { text: target.platform && target.platform !== '–' ? `Still deg ved plattform ${target.platform}` : 'Du er fremme ved holdeplassen', meters: 0 },
        ]).map((s, i) => (
          <li key={i} className="flex items-start gap-3 border-line px-4 py-2.5 [&+&]:border-t">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-white">{i + 1}</span>
            <span className="flex-1 text-[15px] leading-snug">{s.text}</span>
            {s.meters > 0 && <span className="text-[13px] text-muted tabular-nums">{fmtDistance(s.meters)}</span>}
          </li>
        ))}
      </ol>

      {target.platforms.length > 1 && (
        <>
          <SectionHeader title="Plattformer her" />
          <ul className="mx-4 overflow-hidden rounded-xl bg-surface-2">
            {target.platforms.map((p) => (
              <li key={p.platform + p.lat} className={`flex items-center gap-3 border-line px-4 py-2.5 [&+&]:border-t ${p.platform === target.platform ? 'bg-accent/10' : ''}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand text-[13px] font-bold text-white">{p.platform}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">mot {p.toward.slice(0, 3).join(', ')}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {p.lines.slice(0, 8).map((l) => (
                      <LineBadge key={l} line={l} size="sm" />
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="px-4 pt-4">
        <a href={google} target="_blank" rel="noreferrer" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white active:bg-accent/85">
          <Navigation className="size-[18px]" /> Åpne i Google Maps <ExternalLink className="size-4 opacity-70" />
        </a>
      </div>
    </Sheet>
  )
}
