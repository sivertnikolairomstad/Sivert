import { motion } from 'framer-motion'

export function Glass({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag
      className={`rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_20px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function LineBadge({ line, state = 'ok' }) {
  const tones = {
    ok: 'bg-emerald-400 text-slate-950',
    extra: 'bg-teal-300 text-slate-950',
    cancelled: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-400/40',
  }
  return (
    <span
      className={`inline-flex h-9 min-w-12 items-center justify-center rounded-xl px-2 text-sm font-black tabular-nums ${tones[state]}`}
    >
      <span className="sr-only">Linje </span>
      {line}
    </span>
  )
}

export function Pill({ tone = 'ok', children, className = '' }) {
  const tones = {
    ok: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
    warn: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
    alert: 'bg-rose-500/15 text-rose-300 ring-rose-400/40',
    info: 'bg-sky-400/10 text-sky-300 ring-sky-400/30',
    muted: 'bg-white/5 text-slate-300 ring-white/10',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

// Belegg som 5 segmenter – leses raskere enn en prosent
export function CrowdMeter({ value }) {
  const filled = Math.max(1, Math.round(value * 5))
  const tone = value > 0.8 ? 'bg-rose-400' : value > 0.5 ? 'bg-amber-300' : 'bg-emerald-400'
  const label = value > 0.8 ? 'Full' : value > 0.5 ? 'Travelt' : 'God plass'
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <motion.span
            key={i}
            layout
            className={`h-3 w-1.5 rounded-full ${i < filled ? tone : 'bg-white/10'}`}
          />
        ))}
      </span>
      {label}
    </span>
  )
}

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-emerald-300/80 uppercase">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      {children && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-400">{children}</p>}
    </div>
  )
}
