import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, RotateCcw } from 'lucide-react'
import { Group, SectionHeader } from '../components/ui.jsx'
import { somePost, someOriginal, someOld, someNew } from '../data.js'

const MODES = { old: someOld, new: someNew }

export default function Social() {
  const [mode, setMode] = useState('old')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const data = MODES[mode]
  const last = 1 + data.followUps.length + (mode === 'new' ? 1 : 0)
  const done = step >= last

  useEffect(() => {
    if (!playing) return
    if (done) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setStep((s) => s + 1), 1100)
    return () => clearTimeout(t)
  }, [playing, step, done])

  const pick = (m) => {
    setMode(m)
    setStep(0)
    setPlaying(true)
  }

  const progress = Math.min(1, step / 3)
  const sentiment = Math.round(35 + (data.sentiment - 35) * progress)

  return (
    <div className="h-full overflow-y-auto pb-6">
      <h1 className="px-4 pt-2 text-[30px] font-bold tracking-tight">Sosiale medier</h1>
      <p className="px-4 pt-1 text-[14px] leading-relaxed text-muted">Samme klage, to måter å svare på. Alle i kommentarfeltet leser svaret.</p>

      <div className="mx-4 mt-4 grid grid-cols-2 rounded-lg bg-surface p-0.5" role="tablist" aria-label="Velg modell">
        {[
          ['old', 'Enveis'],
          ['new', 'Toveis'],
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => pick(id)} className="relative h-8 text-[14px] font-medium">
            {mode === id && <motion.span layoutId="seg" className="absolute inset-0 rounded-md bg-surface-2 shadow" transition={{ type: 'spring', damping: 30, stiffness: 500 }} />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {/* Side om side: utfallet av de to modellene */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <Outcome label="Enveis" value={someOld.sentiment} tone="text-danger" active={mode === 'old'} onClick={() => pick('old')} />
        <Outcome label="Toveis" value={someNew.sentiment} tone="text-accent" active={mode === 'new'} onClick={() => pick('new')} />
      </div>

      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <h2 className="text-[13px] font-semibold text-muted uppercase">Kommentarfelt</h2>
        <button type="button" onClick={() => (done ? pick(mode) : setPlaying(true))} className="flex items-center gap-1 text-[14px] text-accent">
          {done ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5" />}
          {done ? 'Spill av igjen' : 'Spill av'}
        </button>
      </div>

      <Group>
        <div className="border-b border-line px-4 py-3">
          <Author name={data.brand} brand={mode} meta="12 min" />
          <p className="mt-2 text-[15px]">{somePost}</p>
          <p className="mt-2 text-[12px] text-faint tabular-nums">
            {Math.round(40 + (data.reactions.angry - 40) * progress)} sinte · {Math.round(2 + (data.reactions.like - 2) * progress)} liker
          </p>
        </div>
        <ul className="space-y-3 px-4 py-3">
          <Comment name={someOriginal.author} text={someOriginal.text} />
          <AnimatePresence>
            {step >= 1 && <Comment key={mode + 'r'} name={data.brand} brand={mode} text={data.reply} />}
            {data.followUps.slice(0, Math.max(0, step - 1)).map((c) => (
              <Comment key={mode + c.text} name={c.author} brand={c.brand ? mode : null} text={c.text} reply />
            ))}
          </AnimatePresence>
          {mode === 'old' && done && <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-danger">{someOld.footnote}</motion.li>}
        </ul>
      </Group>

      <AnimatePresence>
        {mode === 'new' && done && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <SectionHeader title="Fortsetter i privat melding" />
            <Group className="space-y-2 p-3">
              {someNew.dm.map((d, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.4 }}
                  className={`w-fit max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${d.from === 'brand' ? 'rounded-bl-md bg-surface-2' : 'ml-auto rounded-br-md bg-accent text-accent-ink'}`}
                >
                  {d.text}
                </motion.p>
              ))}
            </Group>
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader title="Stemning" right={`${sentiment}/100`} />
      <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-surface">
        <motion.div className={`h-full rounded-full ${mode === 'new' ? 'bg-accent' : 'bg-danger'}`} animate={{ width: `${sentiment}%` }} />
      </div>

      <SectionHeader title="Hvorfor det virker" />
      <Group>
        <Point title="Kontekstkollaps" text="Mange ulike lesere ser det samme svaret (Marwick & boyd, 2011). Tonen bedømmes av alle." />
        <Point title="Svar offentlig først" text="Gi beskjed om hva som skjer og hva man kan gjøre, og vis forståelse." />
        <Point title="Følg opp privat" text="Billett og refusjon ordnes i privat melding. Dialogen fortsetter i stedet for å stoppe." />
      </Group>
    </div>
  )
}

function Outcome({ label, value, tone, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl bg-surface px-3 py-2.5 text-left ring-inset ${active ? 'ring-1 ring-line' : ''}`}>
      <span className="block text-[12px] text-muted">{label}</span>
      <span className={`text-[22px] font-semibold tabular-nums ${tone}`}>{value}</span>
      <span className="text-[12px] text-faint"> /100 stemning</span>
    </button>
  )
}

function Author({ name, brand, meta }) {
  return (
    <div className="flex items-center gap-2.5">
      <Initial name={name} brand={brand} />
      <div>
        <p className="text-[14px] font-semibold">{name}</p>
        <p className="text-[12px] text-faint">{meta}</p>
      </div>
    </div>
  )
}

function Initial({ name, brand, small }) {
  const tone = brand === 'new' ? 'bg-accent text-accent-ink' : brand === 'old' ? 'bg-faint text-bg' : 'bg-surface-2 text-muted'
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${small ? 'size-7 text-[12px]' : 'size-9 text-[14px]'} ${tone}`} aria-hidden>
      {name[0]}
    </span>
  )
}

function Comment({ name, text, brand, reply }) {
  return (
    <motion.li layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${reply ? 'pl-6' : ''}`}>
      <Initial name={name} brand={brand} small />
      <div className="min-w-0 rounded-2xl bg-surface-2 px-3 py-2">
        <p className="text-[13px] font-semibold">{name}</p>
        <p className="text-[14px] leading-snug">{text}</p>
      </div>
    </motion.li>
  )
}

function Point({ title, text }) {
  return (
    <div className="border-line px-4 py-3 [&+&]:border-t">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-muted">{text}</p>
    </div>
  )
}
