import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Footprints, LocateFixed, Navigation } from 'lucide-react'
import MapView from './MapView.jsx'
import { LineBadge } from './ui.jsx'
import { fetchWalkRoute, fmtDistance, heading, targetFor, walkMeters, walkMinutes } from '../directions.js'

// Selve veibeskrivelsen. Brukes både i bunnarket og direkte i chatten (`compact`).
export default function DirectionsView({ req, location, onLocate, compact = false }) {
  const target = useMemo(() => targetFor(req.stop, location, req), [req, location])
  const [route, setRoute] = useState(null) // gangrute fra routing-tjenesten
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!target) return
    let alive = true
    setLoading(true)
    fetchWalkRoute(location, target).then((r) => {
      if (!alive) return
      setRoute(r)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [target?.lat, target?.lon, location.lat, location.lon])

  if (!target) return <p className="text-[14px] text-muted">Fant ikke holdeplassen {req.stop}.</p>

  const meters = route?.meters ?? walkMeters(location, target)
  const dir = heading(location, target)
  const google = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lon}&travelmode=walking`
  const platform = target.platform && target.platform !== '–' ? target.platform : null
  const steps = route?.steps ?? [
    { text: `Gå mot ${dir}, ca. ${fmtDistance(meters)}`, meters },
    { text: platform ? `Still deg ved plattform ${platform}` : 'Du er fremme ved holdeplassen', meters: 0 },
  ]
  const here = target.platforms.find((p) => p.platform === target.platform)
  const pad = compact ? 'px-3.5' : 'px-4'

  return (
    <div>
      <div className={pad}>
        {!compact && <p className="text-[13px] text-muted">Til holdeplassen</p>}
        <h3 className={`${compact ? 'text-[16px]' : 'text-[20px]'} leading-tight font-bold`}>
          {req.stop}
          {platform ? `, plattform ${platform}` : ''}
        </h3>
        <div className={`mt-2 flex items-center gap-3 rounded-xl bg-surface-2 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
          <Footprints className="size-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className={`${compact ? 'text-[15px]' : 'text-[17px]'} font-semibold`}>
              {fmtDistance(meters)} · ca. {walkMinutes(meters)} min å gå
            </p>
            <p className="text-[13px] text-muted">{meters > 5000 ? 'Det er langt å gå. Ta heller en buss.' : `Mot ${dir} fra deg`}</p>
          </div>
        </div>
      </div>

      <MapView
        className={`${compact ? 'mx-3.5 h-44' : 'mx-4 h-56'} mt-2 overflow-hidden rounded-xl`}
        you={location}
        walk={route?.path ?? [[location.lat, location.lon], [target.lat, target.lon]]}
        stops={[{ name: `${req.stop}${platform ? ` ${platform}` : ''}`, lat: target.lat, lon: target.lon, highlight: true }]}
        fit={[[location.lat, location.lon], [target.lat, target.lon]]}
        center={[target.lat, target.lon]}
        zoom={16}
      />

      <div className={`${pad} mt-3 mb-1 flex items-baseline justify-between`}>
        <p className="text-[14px] font-semibold">Slik går du</p>
        <span className="text-[12px] text-faint">{route ? 'Gangrute' : loading ? 'Henter gangrute …' : 'Luftlinje (uten nett)'}</span>
      </div>
      <ol className={`${compact ? 'mx-3.5' : 'mx-4'} overflow-hidden rounded-xl bg-surface-2`}>
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 border-line px-3 py-2 [&+&]:border-t">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-white">{i + 1}</span>
            <span className="flex-1 text-[14px] leading-snug">{s.text}</span>
            {s.meters > 0 && <span className="text-[12px] text-muted tabular-nums">{fmtDistance(s.meters)}</span>}
          </li>
        ))}
      </ol>

      {compact && here && (
        <p className={`${pad} mt-2 flex flex-wrap items-center gap-1 text-[13px] text-muted`}>
          Herfra går
          {here.lines.slice(0, 6).map((l) => (
            <LineBadge key={l} line={l} size="sm" />
          ))}
        </p>
      )}

      {!compact && target.platforms.length > 1 && (
        <>
          <p className="mt-5 mb-2 px-4 text-[17px] font-semibold">Plattformer her</p>
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

      <div className={`${pad} ${compact ? 'pt-3 pb-3.5' : 'pt-4'} flex flex-col gap-2`}>
        <a href={google} target="_blank" rel="noreferrer" className={`flex ${compact ? 'h-10 text-[14px]' : 'h-12 text-[15px]'} w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white active:bg-accent/85`}>
          <Navigation className="size-4" /> Åpne i Google Maps <ExternalLink className="size-3.5 opacity-70" />
        </a>
        <p className="flex items-center justify-between gap-2 text-[12px] text-faint">
          <span>{location.demo ? 'Fra UiS (demo). Del posisjonen for nøyaktig vei.' : 'Fra din posisjon nå.'}</span>
          {location.demo && (
            <button type="button" onClick={onLocate} className="flex shrink-0 items-center gap-1 font-medium text-accent">
              <LocateFixed className="size-3.5" /> Bruk min posisjon
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
