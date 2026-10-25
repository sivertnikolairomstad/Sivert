import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, Radio } from 'lucide-react'

const ICONS = { ok: CheckCircle2, info: Info, live: Radio }
const TONES = { ok: 'text-emerald-300', info: 'text-sky-300', live: 'text-teal-300' }

export default function Toasts({ toasts, behind }) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-3 bottom-24 flex ${behind ? 'z-30' : 'z-50'} flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end`}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] ?? Info
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${TONES[t.tone] ?? TONES.info}`} />
              <div>
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.body && <p className="mt-0.5 text-sm text-slate-400">{t.body}</p>}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
