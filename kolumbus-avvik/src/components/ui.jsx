import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export function LineBadge({ line, state = 'ok' }) {
  const tones = {
    ok: 'bg-accent text-accent-ink',
    extra: 'bg-sky-300 text-sky-950',
    cancelled: 'bg-surface-2 text-faint line-through',
  }
  return (
    <span className={`inline-flex h-7 min-w-10 items-center justify-center rounded-md px-1.5 text-[13px] font-bold tabular-nums ${tones[state]}`}>
      <span className="sr-only">Linje </span>
      {line}
    </span>
  )
}

export function Tag({ tone = 'muted', children }) {
  const tones = {
    danger: 'bg-danger/15 text-danger',
    warn: 'bg-warn/15 text-warn',
    info: 'bg-sky-300/15 text-sky-300',
    accent: 'bg-accent/15 text-accent',
    muted: 'bg-surface-2 text-muted',
  }
  return <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}

export function SectionHeader({ title, right }) {
  return (
    <div className="flex items-baseline justify-between px-4 pt-6 pb-2">
      <h2 className="text-[13px] font-semibold text-muted uppercase">{title}</h2>
      {right && <span className="text-[13px] text-faint">{right}</span>}
    </div>
  )
}

export function Group({ children, className = '' }) {
  return <div className={`mx-4 overflow-hidden rounded-xl bg-surface ${className}`}>{children}</div>
}

// Listerad med hårstrek mellom radene, som i iOS-innstillinger
export function Row({ icon: Icon, iconTone = 'text-accent', title, sub, right, onClick, chevron = !!onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 text-left transition-colors active:bg-surface-2 [&+&]:border-t [&+&]:border-line"
    >
      {Icon && <Icon className={`size-5 shrink-0 ${iconTone}`} />}
      <span className="min-w-0 flex-1 py-3">
        <span className="block text-[15px] text-fg">{title}</span>
        {sub && <span className="mt-0.5 block text-[13px] text-muted">{sub}</span>}
      </span>
      {right}
      {chevron && <ChevronRight className="size-4 shrink-0 text-faint" />}
    </Tag>
  )
}

export function Switch({ on, onToggle, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${on ? 'bg-danger' : 'bg-surface-2'}`}>
      <motion.span className="absolute top-[2px] left-[2px] size-[26px] rounded-full bg-white shadow" animate={{ x: on ? 20 : 0 }} transition={{ type: 'spring', damping: 26, stiffness: 600 }} />
    </button>
  )
}

export function CrowdMeter({ value }) {
  const filled = Math.max(1, Math.round(value * 4))
  const tone = value > 0.8 ? 'bg-danger' : value > 0.5 ? 'bg-warn' : 'bg-accent'
  const label = value > 0.8 ? 'Full' : value > 0.5 ? 'Travelt' : 'Ledig'
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
      <span className="flex gap-[2px]" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={`h-2.5 w-1 rounded-sm ${i < filled ? tone : 'bg-line'}`} />
        ))}
      </span>
      {label}
    </span>
  )
}

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  const v = {
    primary: 'bg-accent text-accent-ink active:bg-accent/85 disabled:bg-surface-2 disabled:text-faint',
    secondary: 'bg-surface-2 text-fg active:bg-line',
    plain: 'text-accent active:opacity-60',
  }
  return (
    <button type="button" className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition ${v[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
