import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'

// Bunnark inne i telefonen. Lukkes med Esc, trykk utenfor eller ved å dra håndtaket ned.
export default function Sheet({ open, onClose, title, children }) {
  const drag = useDragControls()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const returnTo = document.activeElement
    panelRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnTo?.focus?.({ preventScroll: true })
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.section
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[88%] flex-col rounded-t-2xl bg-surface outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 380 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, i) => (i.offset.y > 100 || i.velocity.y > 500) && onClose()}
          >
            <div className="touch-none cursor-grab pt-2 pb-1" onPointerDown={(e) => drag.start(e)}>
              <div className="mx-auto h-1 w-9 rounded-full bg-line" />
              <div className="relative flex h-11 items-center justify-center px-4">
                <h2 className="text-[16px] font-semibold">{title}</h2>
                <button type="button" onClick={onClose} className="absolute right-4 text-[15px] text-accent">
                  Lukk
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-8">{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  )
}
