import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Angry, ArrowRight, Lock, MessageSquareOff, MessagesSquare, Pause, Play, RotateCcw, Share2, SkipForward, ThumbsUp } from 'lucide-react'
import { Glass, SectionTitle } from '../components/ui.jsx'
import { someOriginal, someOld, someNew } from '../data.js'

// Steg: 0 = sint kommentar, 1 = selskapets svar, 2.. = reaksjoner, siste = DM
const STEPS = 2 + Math.max(someOld.followUps.length, someNew.followUps.length) + 1

export default function Social() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const done = step >= STEPS - 1

  useEffect(() => {
    if (!playing) return
    if (done) return setPlaying(false)
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 900 : 1300)
    return () => clearTimeout(t)
  }, [playing, step, done])

  const progress = step / (STEPS - 1)

  return (
    <div>
      <SectionTitle eyebrow="Fane 3 · SoMe & kontekstkollaps" title="Fra å stenge dialogen til å åpne den">
        Samme sinte kommentar, to måter å svare på. I sosiale medier leser alle med: den som klager, de som er enige, og de
        som bare ser på. Svaret må fungere for alle samtidig.
      </SectionTitle>

      <Glass className="mb-5 flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => (done ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? 'Pause' : done ? 'Spill av igjen' : step === 0 ? 'Spill av scenarioet' : 'Fortsett'}
        </button>
        <button type="button" onClick={() => setStep((s) => Math.min(s + 1, STEPS - 1))} disabled={done} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.06] px-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-40">
          <SkipForward className="size-4" /> Neste steg
        </button>
        <button type="button" onClick={() => (setStep(0), setPlaying(false))} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:text-white" aria-label="Nullstill">
          <RotateCcw className="size-4" />
        </button>
        <div className="ml-auto flex min-w-40 flex-1 items-center gap-3 sm:max-w-xs">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" animate={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{step + 1}/{STEPS}</span>
        </div>
      </Glass>

      <div className="grid gap-5 lg:grid-cols-2">
        <Column variant="old" data={someOld} step={step} progress={progress} />
        <Column variant="new" data={someNew} step={step} progress={progress} />
      </div>

      <Glass className="mt-5 grid gap-5 p-5 sm:p-6 md:grid-cols-3">
        <Insight title="Kontekstkollaps" body="Marwick & boyd (2011): ulike publikum smelter sammen i én strøm. Et svar skrevet til «saken» leses av hundrevis som dømmer tonen." />
        <Insight title="Offentlig anerkjennelse" body="Svar raskt og menneskelig der klagen ble gitt. Gi instruerende informasjon først (SCCT), og vis empati." />
        <Insight title="Privat oppfølging" body="Flytt det personlige (billett, refusjon) trygt til DM, men først etter at du har svart offentlig. Dialogen fortsetter, den blir ikke skjøvet vekk." />
      </Glass>
    </div>
  )
}

function Column({ variant, data, step, progress }) {
  const isNew = variant === 'new'
  const brand = isNew ? 'Move Rogaland' : 'Kollektivselskapet'
  const sentiment = Math.round(35 + (data.sentiment - 35) * Math.min(1, Math.max(0, (step - 1) / 3)))
  const followVisible = Math.max(0, step - 1)
  const showDm = isNew && step >= STEPS - 1
  const scale = Math.min(1, Math.max(0, (step - 1) / 3))
  const angry = Math.round(40 + (data.reactions.angry - 40) * scale)
  const likes = Math.round(2 + (data.reactions.like - 2) * scale)

  return (
    <section aria-label={isNew ? 'Ny toveis-modell' : 'Gammel enveis-praksis'} className="min-w-0">
      <div className={`mb-3 flex items-center gap-2.5 rounded-2xl px-4 py-3 ring-1 ${isNew ? 'bg-emerald-400/10 ring-emerald-400/30' : 'bg-rose-500/10 ring-rose-400/30'}`}>
        {isNew ? <MessagesSquare className="size-5 text-emerald-300" /> : <MessageSquareOff className="size-5 text-rose-300" />}
        <div className="flex-1">
          <p className={`text-xs font-semibold tracking-wider uppercase ${isNew ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isNew ? 'Ny toveis-modell' : 'Gammel enveis-praksis'}
          </p>
          <p className="text-sm text-slate-300">{isNew ? 'Anerkjenn offentlig, løs personlig' : 'Henvis videre, avslutt saken'}</p>
        </div>
      </div>

      <Glass className="overflow-hidden">
        {/* Selskapets opprinnelige innlegg */}
        <div className="border-b border-white/5 p-4">
          <div className="flex items-center gap-2.5">
            <BrandAvatar isNew={isNew} />
            <div>
              <p className="text-sm font-semibold text-white">{brand}</p>
              <p className="text-xs text-slate-500">12 min · <Share2 className="inline size-3" /></p>
            </div>
          </div>
          <p className="mt-3 text-[15px] text-slate-200">⚠️ Linje 6 fra UiS er innstilt pga. teknisk feil.</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1"><Angry className="size-3.5 text-rose-300" /> <Num v={angry} /></span>
            <span className="inline-flex items-center gap-1"><ThumbsUp className="size-3.5 text-sky-300" /> <Num v={likes} /></span>
          </div>
        </div>

        <ul className="min-h-[340px] space-y-3 p-4">
          <Comment author={someOriginal.author} text={someOriginal.text} angry />
          <AnimatePresence>
            {step >= 1 && <Comment key="reply" author={brand} text={data.reply} brand={isNew ? 'new' : 'old'} />}
            {data.followUps.slice(0, followVisible).map((c) => (
              <Comment key={c.author + c.text} author={c.author} text={c.text} brand={c.brand ? 'new' : null} nested angry={!isNew && !c.brand} />
            ))}
          </AnimatePresence>
          {!isNew && step >= 1 && followVisible >= data.followUps.length && (
            <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-11 text-xs text-rose-300">
              <MessageSquareOff className="size-3.5" /> Selskapet svarte aldri igjen. Delt 48 ganger.
            </motion.li>
          )}
        </ul>

        <AnimatePresence>
          {showDm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden border-t border-white/5 bg-white/[0.02]">
              <div className="p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Lock className="size-3.5" /> Fortsetter privat på DM <ArrowRight className="size-3" />
                </p>
                <div className="space-y-2">
                  {data.dm.map((d, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.45 }}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${d.from === 'brand' ? 'rounded-bl-md bg-white/[0.07] text-slate-100' : 'ml-auto rounded-br-md bg-emerald-400 font-medium text-slate-950'}`}
                    >
                      {d.text}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-white/5 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Stemning i kommentarfeltet</span>
            <span className={`font-bold tabular-nums ${sentiment >= 50 ? 'text-emerald-300' : 'text-rose-300'}`}>{sentiment}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={sentiment} aria-label="Stemning">
            <motion.div
              className={`h-full rounded-full ${isNew ? 'bg-gradient-to-r from-amber-300 to-emerald-400' : 'bg-gradient-to-r from-amber-300 to-rose-500'}`}
              animate={{ width: `${sentiment}%` }}
              transition={{ type: 'spring', damping: 24 }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {progress === 0 ? 'Før svaret' : isNew ? 'Dialogen fortsetter og blir løst' : 'Dialogen stopper og sinnet sprer seg'}
          </p>
        </div>
      </Glass>
    </section>
  )
}

function Comment({ author, text, brand, nested, angry }) {
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2.5 ${nested ? 'pl-6' : ''}`}>
      {brand ? <BrandAvatar isNew={brand === 'new'} small /> : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-bold text-slate-200" aria-hidden>
          {author[0]}
        </span>
      )}
      <div className={`min-w-0 rounded-2xl rounded-tl-md px-3.5 py-2.5 ${brand === 'new' ? 'bg-emerald-400/10 ring-1 ring-emerald-400/25' : brand === 'old' ? 'bg-slate-700/40 ring-1 ring-white/10' : 'bg-white/[0.05]'}`}>
        <p className="text-xs font-semibold text-slate-200">
          {author} {angry && !brand && <span aria-label="sint">😡</span>}
        </p>
        <p className={`mt-0.5 text-sm leading-relaxed ${brand === 'old' ? 'font-mono text-[13px] text-slate-400' : 'text-slate-200'}`}>{text}</p>
      </div>
    </motion.li>
  )
}

function BrandAvatar({ isNew, small }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full ${small ? 'size-8' : 'size-10'} ${isNew ? 'bg-gradient-to-br from-emerald-300 to-teal-500 text-slate-950' : 'bg-slate-600 text-slate-300'} text-xs font-black`} aria-hidden>
      {isNew ? 'M' : 'K'}
    </span>
  )
}

function Num({ v }) {
  return (
    <motion.span key={v} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="tabular-nums">
      {v}
    </motion.span>
  )
}

function Insight({ title, body }) {
  return (
    <div>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  )
}
