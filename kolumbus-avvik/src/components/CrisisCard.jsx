import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import { Button } from './ui.jsx'
import { clock, depTime } from '../lib/time.js'
import { departures, CANCELLED_ID } from '../data.js'

const DELAY_REASONS = ['Forelesning', 'Jobb', 'Henting', 'Annet']

export default function CrisisCard({ open, now, onClose, onChat, onPlan }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex flex-col">
          <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <Card now={now} onClose={onClose} onChat={onChat} onPlan={onPlan} />
        </div>
      )}
    </AnimatePresence>
  )
}

function Card({ now, onClose, onChat, onPlan }) {
  const dep = departures.find((d) => d.id === CANCELLED_ID)
  const [step, setStep] = useState('ask') // ask → reason → ack
  const [reason, setReason] = useState(null)
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const returnTo = document.activeElement
    ref.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnTo?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <motion.section
      ref={ref}
      tabIndex={-1}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crisis-title"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 340 }}
      className="relative mx-3 mt-[52px] max-h-[calc(100%-64px)] overflow-y-auto rounded-2xl bg-surface p-4 shadow-2xl ring-1 ring-danger/40 outline-none"
    >
      <div className="flex items-center gap-2 text-[13px] font-semibold text-danger">
        <TriangleAlert className="size-4" />
        Driftsavvik
        <button type="button" onClick={onClose} className="ml-auto font-normal text-accent">
          Lukk
        </button>
      </div>
      <h2 id="crisis-title" className="mt-2 text-[17px] leading-snug font-semibold">
        Linje {dep.line} kl. {clock(depTime(dep.inMin, now))} fra UiS Tjodhallen er innstilt
      </h2>
      <p className="mt-1 text-[14px] leading-relaxed text-muted">
        Teknisk feil. Ekstrabuss er satt inn. 38 reisende er berørt.
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'ask' && (
          <motion.div key="ask" exit={{ opacity: 0 }} className="mt-4 space-y-2">
            <Button onClick={() => setStep('reason')}>Gi beskjed om at jeg blir forsinket</Button>
            <Button variant="secondary" onClick={onChat}>
              Snakk med trafikksentralen
            </Button>
            <Button variant="plain" className="h-10" onClick={onPlan}>
              Se andre avganger
            </Button>
          </motion.div>
        )}

        {step === 'reason' && (
          <motion.div key="reason" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
            <p className="mb-2 text-[14px] font-semibold">Hva blir du forsinket til?</p>
            <div className="grid grid-cols-2 gap-2">
              {DELAY_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r)
                    setStep('ack')
                  }}
                  className="h-11 rounded-xl bg-surface-2 text-[15px] active:bg-line"
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'ack' && (
          <motion.div key="ack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-[15px] text-accent-ink">
              Jeg blir forsinket til: {reason.toLowerCase()}
            </p>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-[90%] rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2.5">
              <p className="text-[12px] font-semibold text-accent">Trafikksentralen</p>
              <p className="text-[15px] leading-snug">
                Takk for beskjed. Forsinkelsesattesten er sendt til deg. Ekstrabuss 6E går fra plattform A om ca. 6 minutter.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="secondary" onClick={onChat}>
                Skriv mer
              </Button>
              <Button onClick={onPlan}>Se ekstrabussen</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
