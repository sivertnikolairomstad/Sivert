import { motion } from 'framer-motion'
import { TABS } from '../lib/tabs.js'
import { clock } from '../lib/time.js'

export default function TopBar({ now, tab, onTab, disrupted, onToggle }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20 sm:px-6">
        <Logo />

        <nav aria-label="Faner" className="mx-auto hidden rounded-2xl border border-white/10 bg-white/[0.03] p-1 md:block">
          <ul className="flex">
            {TABS.map(({ id, long, icon: Icon }, i) => {
              const active = tab === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onTab(id)}
                    aria-current={active ? 'page' : undefined}
                    title={`Snarvei: ${i + 1}`}
                    className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      active ? 'text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="dnav"
                        className="absolute inset-0 rounded-xl bg-emerald-400 shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)]"
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                      />
                    )}
                    <Icon className="relative size-4" />
                    <span className="relative">{long}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <time className="hidden text-sm font-medium tabular-nums text-slate-400 lg:block">{clock(now)}</time>
          <DisruptionSwitch on={disrupted} onToggle={onToggle} />
        </div>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className="flex shrink-0 items-center gap-2.5" aria-label="Move Rogaland">
      <span className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 shadow-[0_8px_24px_-6px_rgba(52,211,153,0.6)]">
        {/* Toveis-pil formet som en M – kommunikasjonen går begge veier */}
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="#022c22" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 18V7l8 7 8-7v11" />
          <path d="M16 18h4M4 18h4" opacity=".55" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-tight text-white">Move</span>
        <span className="block text-[11px] font-semibold tracking-[0.22em] text-emerald-300/90 uppercase">Rogaland</span>
      </span>
    </a>
  )
}

function DisruptionSwitch({ on, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      title="Snarvei: A"
      className={`group flex items-center gap-2.5 rounded-2xl border py-1.5 pr-1.5 pl-3 text-sm font-semibold transition-colors ${
        on ? 'border-rose-400/40 bg-rose-500/15 text-rose-200' : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
      }`}
    >
      <span className="hidden sm:inline">Simuler avvik</span>
      <span className="sm:hidden">Avvik</span>
      <span className={`relative h-7 w-12 rounded-full transition-colors ${on ? 'bg-rose-500' : 'bg-slate-700'}`}>
        <motion.span
          className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-white shadow"
          animate={{ x: on ? 20 : 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 500 }}
        />
        {on && <span className="absolute -top-0.5 -right-0.5 size-2.5 animate-ping rounded-full bg-rose-400" aria-hidden />}
      </span>
    </button>
  )
}
