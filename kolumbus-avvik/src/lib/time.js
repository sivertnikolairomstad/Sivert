import { useEffect, useState } from 'react'

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

// Avgangene forankres i tidspunktet appen ble åpnet. Når en avgang har gått, ruller den
// videre med fast frekvens, så demoen kan stå åpen hele showcaset.
const START = Math.ceil(Date.now() / 60000) * 60000
const HEADWAY = 20 * 60000

export const clock = (d) => d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })

export function depTime(inMin, now) {
  let t = START + inMin * 60000
  while (t < now - 30000) t += HEADWAY
  return new Date(t)
}

export const minutesUntil = (date, now) => Math.max(0, Math.round((date - now) / 60000))
