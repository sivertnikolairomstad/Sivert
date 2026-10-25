import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'

// Bunnark som lever inne i telefonrammen. Lukkes med Esc, klikk på bakgrunn eller dra ned i håndtaket.
export default function Sheet({ open, onClose, title, subtitle, children, full = false, footer }) {
  const closeRef = useRef(null)
  const returnFocusRef = useRef(null)
  const dragControls = useDragControls()
  const startDrag = (e) => dragControls.start(e)

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement
    // preventScroll: arket starter utenfor rammen, vanlig focus() ville rulle overflow-hidden-forelderen
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-k-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className={`relative flex flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ${
              full ? 'h-[92%]' : 'max-h-[85%]'
            }`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 600) && onClose()}
          >
            <div
              className="flex cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing"
              onPointerDown={startDrag}
            >
              <span className="h-1.5 w-10 rounded-full bg-k-line" aria-hidden />
            </div>
            <header
              className="flex touch-none items-start gap-3 border-b border-k-line px-5 pt-1 pb-4"
              onPointerDown={startDrag}
            >
              <div className="min-w-0 flex-1">
                <h2 id="sheet-title" className="text-lg font-bold tracking-tight">
                  {title}
                </h2>
                {subtitle && <p className="mt-0.5 text-sm text-k-muted">{subtitle}</p>}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="-mr-1 grid size-10 shrink-0 place-items-center rounded-full bg-k-bg text-k-ink-2 transition hover:bg-k-line"
                aria-label="Lukk"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
            {footer}
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  )
}
