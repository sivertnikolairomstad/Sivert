import { Bus } from 'lucide-react'

export function LineBadge({ line, tone = 'green', size = 'md' }) {
  const tones = {
    green: 'bg-k-green-600 text-white',
    muted: 'bg-k-line text-k-muted',
  }
  const sizes = {
    md: 'h-8 min-w-12 px-2 text-sm',
    sm: 'h-6 min-w-10 px-1.5 text-xs',
  }
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-lg font-bold tabular-nums ${tones[tone]} ${sizes[size]}`}
    >
      <Bus aria-hidden className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={2.5} />
      <span className="sr-only">Buss </span>
      {line}
    </span>
  )
}

export function StatusPill({ children, tone = 'alert' }) {
  const tones = {
    alert: 'bg-alert text-white',
    ok: 'bg-k-green-50 text-k-green-700 ring-1 ring-inset ring-k-green/40',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
