import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIES, ROUTES } from '../routes.js'

const TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/">CARTO</a> · Rutedata: Entur'

const colorOf = (route) => CATEGORIES[route?.cat ?? 'by'].color

function busIcon(v, focused) {
  return L.divIcon({
    className: 'mr-icon',
    iconSize: [0, 0],
    html: `<span class="mr-bus${focused ? ' is-focus' : ''}" style="background:${colorOf(v.route)}">${v.line}</span>`,
  })
}

// Leaflet-kart inne i appen. Alt er valgfritt: busser, en markert rute, holdeplasser og «deg».
export default function MapView({ vehicles = [], onVehicle, focusId, follow, path, pathColor = '#0a6b7c', walk, stops = [], you, center = [58.93, 5.72], zoom = 12, fit, className = '' }) {
  const el = useRef(null)
  const map = useRef(null)
  const layers = useRef({})
  const markers = useRef(new Map())
  const onVehicleRef = useRef(onVehicle)
  onVehicleRef.current = onVehicle

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, preferCanvas: true }).setView(center, zoom)
    L.tileLayer(TILES, { attribution: ATTRIBUTION, subdomains: 'abcd', maxZoom: 19 }).addTo(m)
    // Linjenettet tegnes fra holdeplassene, så kartet gir mening også uten kartbilder (offline)
    const net = L.layerGroup().addTo(m)
    for (const r of ROUTES) {
      if (r.cat === 'skole') continue
      L.polyline(
        r.main.quays.map((q) => [q.station.lat, q.station.lon]),
        { color: colorOf(r), weight: 1.5, opacity: 0.25, interactive: false },
      ).addTo(net)
    }
    layers.current = { buses: L.layerGroup().addTo(m), path: L.layerGroup().addTo(m), walk: L.layerGroup().addTo(m), stops: L.layerGroup().addTo(m), you: L.layerGroup().addTo(m) }
    const setZoomClass = () => el.current?.classList.toggle('mr-far', m.getZoom() < 13)
    m.on('zoomend', setZoomClass)
    setZoomClass()
    map.current = m
    return () => {
      m.remove()
      markers.current.clear()
    }
  }, [])

  // Busser: flytt eksisterende markører i stedet for å lage nye, så de glir jevnt
  useEffect(() => {
    const group = layers.current.buses
    if (!group) return
    const seen = new Set()
    for (const v of vehicles) {
      seen.add(v.id)
      const focused = v.id === focusId
      let mk = markers.current.get(v.id)
      if (!mk) {
        mk = L.marker([v.lat, v.lon], { icon: busIcon(v, focused), keyboard: false, title: `Linje ${v.line} mot ${v.headsign}` })
        mk.on('click', () => onVehicleRef.current?.(mk.vehicle))
        mk.addTo(group)
        markers.current.set(v.id, mk)
      } else {
        mk.setLatLng([v.lat, v.lon])
        if (mk.focused !== focused) mk.setIcon(busIcon(v, focused))
      }
      mk.vehicle = v
      mk.focused = focused
      mk.setZIndexOffset(focused ? 1000 : 0)
    }
    for (const [id, mk] of markers.current) {
      if (!seen.has(id)) {
        group.removeLayer(mk)
        markers.current.delete(id)
      }
    }
    if (follow && focusId) {
      const v = vehicles.find((x) => x.id === focusId)
      if (v) map.current.panTo([v.lat, v.lon], { animate: true })
    }
  }, [vehicles, focusId, follow])

  useEffect(() => {
    const g = layers.current.path
    if (!g) return
    g.clearLayers()
    if (path?.length) {
      L.polyline(path, { color: '#fff', weight: 7, opacity: 0.9 }).addTo(g)
      L.polyline(path, { color: pathColor, weight: 4 }).addTo(g)
    }
  }, [path, pathColor])

  // Gangrute: stiplet blå linje fra deg til holdeplassen
  useEffect(() => {
    const g = layers.current.walk
    if (!g) return
    g.clearLayers()
    if (walk?.length) L.polyline(walk, { color: '#1a73e8', weight: 5, dashArray: '2 9', lineCap: 'round' }).addTo(g)
  }, [walk])

  // Vis hele området (f.eks. deg og holdeplassen) når `fit` endrer seg
  const fitKey = fit ? fit.flat().map((x) => x.toFixed(4)).join(',') : ''
  useEffect(() => {
    if (fit?.length && map.current) map.current.fitBounds(fit, { padding: [36, 36], maxZoom: 17 })
  }, [fitKey])

  useEffect(() => {
    const g = layers.current.stops
    if (!g) return
    g.clearLayers()
    stops.forEach((s) =>
      L.circleMarker([s.lat, s.lon], { radius: s.highlight ? 7 : 4, color: s.highlight ? '#c62d1f' : pathColor, weight: 2, fillColor: s.passed ? pathColor : '#fff', fillOpacity: 1 })
        .bindTooltip(s.name, { direction: 'top', offset: [0, -4] })
        .addTo(g),
    )
  }, [stops, pathColor])

  useEffect(() => {
    const g = layers.current.you
    if (!g) return
    g.clearLayers()
    if (you) L.marker([you.lat, you.lon], { icon: L.divIcon({ className: 'mr-icon', iconSize: [0, 0], html: '<span class="mr-you"></span>' }), interactive: false }).addTo(g)
  }, [you])

  // Flytt kartet når midtpunktet endrer seg (f.eks. ny holdeplass)
  const centerKey = center.join(',')
  useEffect(() => {
    if (fit?.length) return
    map.current?.setView(center, map.current.getZoom() < zoom ? zoom : map.current.getZoom(), { animate: true })
  }, [centerKey])

  return <div ref={el} className={`mr-map isolate ${className}`} role="application" aria-label="Kart over busser" />
}
