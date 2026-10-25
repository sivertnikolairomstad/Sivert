import { useRef } from 'react'
import Sheet from './Sheet.jsx'
import DirectionsView from './DirectionsView.jsx'

// Veibeskrivelse i bunnark (fra Reise-fanen og sporingen)
export default function DirectionsSheet({ request, location, onLocate, onClose }) {
  const lastRef = useRef(null)
  if (request) lastRef.current = request
  const req = request ?? lastRef.current
  return (
    <Sheet open={!!request} onClose={onClose} title="Veibeskrivelse">
      {req && <DirectionsView req={req} location={location} onLocate={onLocate} />}
    </Sheet>
  )
}
