import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, HeartHandshake, Info, Send, ThumbsDown, ThumbsUp, Timer, UserRound, Users } from 'lucide-react'
import { Glass, Pill, SectionTitle } from '../components/ui.jsx'
import { QUICK_REPLIES } from '../data.js'

const AGENTS = {
  ai: { name: 'Move-assistent', role: 'AI · svarer med en gang', icon: Bot, ring: 'from-emerald-300 to-teal-400' },
  human: { name: 'Ingrid', role: 'Trafikksentralen · menneske', icon: UserRound, ring: 'from-amber-200 to-rose-300' },
}

export default function Support({ messages, typing, onSend, onRate, disrupted }) {
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const humanJoined = messages.some((m) => m.from === 'human')
  const lastAgent = [...messages].reverse().find((m) => m.from === 'ai' || m.from === 'human')
  const asked = new Set(messages.filter((m) => m.from === 'me').map((m) => m.text))

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const submit = (e) => {
    e.preventDefault()
    if (!draft.trim() || typing) return
    onSend(draft)
    setDraft('')
  }

  return (
    <div>
      <SectionTitle eyebrow="Fane 2 · Toveis support" title="En samtale, ikke et svar">
        AI-en svarer med en gang og kjenner situasjonen din. Når du vil, kobler et menneske fra trafikksentralen seg på
        uten at du må gjenta deg.
      </SectionTitle>

      <div className="grid gap-5 lg:grid-cols-3">
        <Glass className="flex h-[min(680px,calc(100dvh-18rem))] min-h-[480px] flex-col overflow-hidden lg:col-span-2 min-w-0">
          <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex -space-x-2">
              <Avatar kind="ai" />
              <AnimatePresence>{humanJoined && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Avatar kind="human" /></motion.span>}</AnimatePresence>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{humanJoined ? 'Ingrid og Move-assistenten' : 'Move-assistenten'}</p>
              <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Pålogget · svarer på sekunder
              </p>
            </div>
            {disrupted && <Pill tone="alert">Avvik linje 6</Pill>}
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5" role="log" aria-live="polite" aria-label="Samtale">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <Message key={m.id} m={m} isLast={m === lastAgent} onSend={onSend} onRate={onRate} busy={typing} />
              ))}
            </AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                <Avatar kind="ai" small />
                <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white/[0.07] px-4 py-3.5">
                  <span className="sr-only">Skriver …</span>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="size-1.5 rounded-full bg-emerald-300" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
                  ))}
                </span>
              </motion.div>
            )}
          </div>

          <div className="border-t border-white/10 px-4 pt-3 pb-4 sm:px-5">
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              {QUICK_REPLIES.filter((q) => !asked.has(q)).map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={typing}
                  onClick={() => onSend(q)}
                  className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="flex items-center gap-2">
              <label htmlFor="chat-input" className="sr-only">Skriv en melding</label>
              <input
                id="chat-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Skriv med egne ord …"
                autoComplete="off"
                className="h-12 min-w-0 flex-1 rounded-2xl bg-white/[0.06] px-4 text-[15px] text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400/70"
              />
              <button
                type="submit"
                disabled={!draft.trim() || typing}
                aria-label="Send"
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-slate-950 transition hover:bg-emerald-300 disabled:bg-white/10 disabled:text-slate-500"
              >
                <Send className="size-5" />
              </button>
            </form>
          </div>
        </Glass>

        <aside className="space-y-5">
          <Glass className="p-5">
            <h3 className="font-semibold text-white">Hva gjør dette toveis?</h3>
            <ul className="mt-4 space-y-4 text-sm">
              <Principle icon={Timer} title="Svar med en gang">Ingen kø, ingen «vi svarer innen 3 virkedager».</Principle>
              <Principle icon={Info} title="Kjenner konteksten">Avviket er lagt ved, så du slipper å forklare.</Principle>
              <Principle icon={HeartHandshake} title="Varm, lokal tone">Løsning først, empati alltid – på godt rogalandsk.</Principle>
              <Principle icon={Users} title="Menneske ved behov">Skriv «snakke med et menneske» for å møte Ingrid.</Principle>
            </ul>
          </Glass>
          <Glass className="p-5">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Denne samtalen</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="Meldinger fra deg" value={messages.filter((m) => m.from === 'me').length} />
              <Stat label="Tilbakemeldinger" value={messages.filter((m) => m.rating).length} />
            </dl>
          </Glass>
        </aside>
      </div>
    </div>
  )
}

function Message({ m, isLast, onSend, onRate, busy }) {
  if (m.from === 'system')
    return (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-fit max-w-[90%] rounded-full bg-white/5 px-3 py-1.5 text-center text-xs font-medium text-slate-400">
        {m.text}
      </motion.p>
    )

  if (m.from === 'me')
    return (
      <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-emerald-400 px-4 py-2.5 text-[15px] leading-snug font-medium text-slate-950">
          <span className="sr-only">Du: </span>
          {m.text}
        </p>
      </motion.div>
    )

  const agent = AGENTS[m.from]
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex items-end gap-2">
      <Avatar kind={m.from} small />
      <div className="max-w-[82%]">
        <p className="mb-1 ml-1 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{agent.name}</span> · {agent.role}
        </p>
        <div className={`rounded-2xl rounded-bl-md px-4 py-2.5 text-[15px] leading-relaxed text-slate-100 ${m.from === 'human' ? 'bg-amber-200/10 ring-1 ring-amber-200/20' : 'bg-white/[0.07]'}`}>
          {m.text}
        </div>
        {isLast && m.actions && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.actions.map((a) => (
              <button key={a} type="button" disabled={busy} onClick={() => onSend(a)} className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/10 disabled:opacity-50">
                {a}
              </button>
            ))}
          </div>
        )}
        <div className="mt-1.5 ml-1 flex items-center gap-1">
          {m.rating ? (
            <span className="text-xs text-slate-500">{m.rating === 'up' ? 'Du syntes dette hjalp 💚' : 'Takk – vi følger opp'}</span>
          ) : (
            <>
              <span className="mr-1 text-xs text-slate-500">Hjalp dette?</span>
              <RateBtn label="Ja, dette hjalp" onClick={() => onRate(m.id, 'up')} icon={ThumbsUp} />
              <RateBtn label="Nei, dette hjalp ikke" onClick={() => onRate(m.id, 'down')} icon={ThumbsDown} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function RateBtn({ label, onClick, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid size-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-emerald-300">
      <Icon className="size-3.5" />
    </button>
  )
}

function Avatar({ kind, small }) {
  const a = AGENTS[kind]
  const Icon = a.icon
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${a.ring} text-slate-950 ring-2 ring-slate-900 ${small ? 'size-7' : 'size-10'}`} aria-hidden>
      <Icon className={small ? 'size-4' : 'size-5'} />
    </span>
  )
}

function Principle({ icon: Icon, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Icon className="size-4" /></span>
      <span>
        <span className="block font-semibold text-slate-100">{title}</span>
        <span className="text-slate-400">{children}</span>
      </span>
    </li>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl bg-white/[0.04] p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-2xl font-bold text-white tabular-nums">{value}</dd>
    </div>
  )
}
