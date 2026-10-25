import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BusFront, CheckCheck, Clock3, MessageCircleHeart, Route, Users, X, Zap } from 'lucide-react'
import { clock, depTime } from '../lib/time.js'
import { departures, CANCELLED_ID } from '../data.js'

const DELAY_REASONS = ['Forelesning / eksamen', 'Jobb', 'Henting i barnehage', 'Annet']

export default function CrisisCard({ now, onClose, onChat, onPlan }) {
  const dep = departures.find((d) => d.id === CANCELLED_ID)
  const [step, setStep] = useState('ask') // ask → reason → ack
  const [reason, setReason] = useState(null)
  const closeRef = useRef(null)
  // Ref, ikke avhengighet: forelderen re-rendrer hvert sekund (klokka), og fokus skal ikke hoppe
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const returnTo = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnTo?.focus?.({ preventScroll: true })
    }
  }, [])

  const confirmDelay = (r) => {
    setReason(r)
    setStep('ack')
  }

  return (
    <motion.div className="fixed inset-0 z-40 flex items-start justify-center px-3 pt-16 sm:pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="crisis-title"
        aria-describedby="crisis-desc"
        initial={{ y: -40, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -24, scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative max-h-[calc(100dvh-5rem)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-rose-400/30 bg-slate-900/85 shadow-[0_30px_90px_-20px_rgba(244,63,94,0.55)] backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-500/20 text-rose-300 sm:size-12">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-rose-500/20" aria-hidden />
              <Zap className="relative size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.16em] text-rose-300 uppercase">Driftsavvik · nå</p>
              <h2 id="crisis-title" className="mt-1 text-xl leading-snug font-bold text-white">
                Linje {dep.line} kl. {clock(depTime(dep.inMin, now))} fra UiS Tjodhallen er innstilt
              </h2>
              <p id="crisis-desc" className="mt-1.5 text-sm leading-relaxed text-slate-300">
                Teknisk feil på bussen. Vi setter inn ekstrabuss og vil gjerne høre hvordan dette påvirker deg.
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Lukk varsel"
              className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1"><Users className="size-3.5" /> 38 reisende berørt</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1"><BusFront className="size-3.5" /> Ekstrabuss på vei</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1"><Clock3 className="size-3.5" /> Oppdatert {clock(now)}</span>
          </div>

          <div className="mt-5">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'ask' && (
                <motion.div key="ask" exit={{ opacity: 0, y: -6 }} className="space-y-2.5">
                  <p className="text-sm font-semibold text-white">Hvordan påvirker dette deg?</p>
                  <ActionButton primary icon={Clock3} onClick={() => setStep('reason')} title="Gi beskjed at jeg blir forsinket" sub="Vi sender deg en forsinkelsesattest med en gang" />
                  <ActionButton icon={MessageCircleHeart} onClick={onChat} title="Start direkte dialog med operatør" sub="Svar på sekunder · ekte mennesker ved behov" />
                  <button type="button" onClick={onPlan} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-white/5">
                    <Route className="size-4" /> Vis alternative avganger
                  </button>
                </motion.div>
              )}

              {step === 'reason' && (
                <motion.div key="reason" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <p className="mb-3 text-sm font-semibold text-white">Hva blir du forsinket til?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DELAY_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => confirmDelay(r)}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3.5 text-left text-sm font-medium text-slate-100 transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'ack' && (
                <motion.div key="ack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-emerald-400 px-4 py-2.5 text-sm font-medium text-slate-950">
                    Æ blir forsinket til: {reason.toLowerCase()}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-slate-100"
                  >
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <CheckCheck className="size-3.5" /> Trafikksentralen
                    </p>
                    Takk for at du sier ifra! Forsinkelsesattesten er sendt til deg. Vi har også tatt med svaret ditt i
                    planleggingen: ekstrabuss 6E går fra plattform A om ca. 6 min.
                  </motion.div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onChat} className="flex-1 rounded-xl bg-white/[0.06] py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                      Fortsett i chat
                    </button>
                    <button type="button" onClick={onPlan} className="flex-1 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                      Se ekstrabussen
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}

function ActionButton({ primary, icon: Icon, title, sub, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-colors ${
        primary
          ? 'bg-emerald-400 text-slate-950 shadow-[0_10px_30px_-10px_rgba(52,211,153,0.7)] hover:bg-emerald-300'
          : 'border border-white/15 bg-white/[0.05] text-white hover:bg-white/[0.09]'
      }`}
    >
      <Icon className="size-6 shrink-0" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className={`block text-sm ${primary ? 'text-slate-900/75' : 'text-slate-400'}`}>{sub}</span>
      </span>
    </motion.button>
  )
}
