import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export default function Toast({ toast }) {
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-3 top-[52px] z-30 flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex w-full items-start gap-3 rounded-2xl bg-surface px-4 py-3 shadow-lg ring-1 ring-line"
          >
            <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">{toast.title}</p>
              {toast.body && <p className="text-[13px] text-muted">{toast.body}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
