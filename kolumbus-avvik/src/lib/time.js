import { useEffect, useState } from 'react'

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

export const clock = (d) => d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })

export const minutesUntil = (date, now) => Math.max(0, Math.round((date - now) / 60000))
