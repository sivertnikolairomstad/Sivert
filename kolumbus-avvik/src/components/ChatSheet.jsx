import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SendHorizontal, Paperclip } from 'lucide-react'
import Sheet from './Sheet.jsx'
import { LineBadge } from './ui.jsx'

const QUICK_REPLIES = [
  {
    q: 'Når går neste buss?',
    a: 'Buss 3 går fra plattform D kl. 08:02 og er fremme i Tananger 08:31. Den er i rute nå. Neste buss 2 går 08:25.',
  },
  {
    q: 'Får jeg refusjon?',
    a: 'Ja. Ved innstilling over 20 min kan du søke refusjon for taxi eller ny billett under «Profil → Reisegaranti». Jeg har lagt saksnummeret K-48213 på kontoen din.',
  },
  {
    q: 'Gjelder billetten min på buss 3?',
    a: 'Ja, billetten din gjelder på alle Kolumbus-busser i samme sone. Du trenger ikke kjøpe ny.',
  },
]

const FALLBACK =
  'Takk! Jeg ser på saken nå. Bussen er tatt ut av drift og en erstatning er på vei – jeg gir beskjed her så snart vi vet mer.'

export default function ChatSheet({ open, onClose, disruption }) {
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const timers = useRef([])
  const greeted = useRef(false)

  const agentSay = (text, delay = 1100) => {
    setTyping(true)
    timers.current.push(
      setTimeout(() => {
        setTyping(false)
        setMessages((m) => [...m, { from: 'agent', text }])
      }, delay),
    )
  }

  // Første gang chatten åpnes hilser kundeservice – med avviket allerede som kontekst.
  useEffect(() => {
    if (open && !greeted.current) {
      greeted.current = true
      agentSay(
        `Hei, jeg heter Marte 👋 Jeg ser at buss ${disruption.line} kl. ${disruption.affectedDeparture} er innstilt. Hva kan jeg hjelpe deg med?`,
        900,
      )
    }
  }, [open])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = (text, answer = FALLBACK) => {
    if (!text.trim() || typing) return
    setMessages((m) => [...m, { from: 'me', text: text.trim() }])
    setDraft('')
    agentSay(answer, 1400)
  }

  const asked = new Set(messages.filter((m) => m.from === 'me').map((m) => m.text))
  const replies = QUICK_REPLIES.filter((r) => !asked.has(r.q))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      full
      title="Kundeservice"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-k-green" aria-hidden /> Pålogget · svarer vanligvis innen 2 min
        </span>
      }
      footer={
        <div className="border-t border-k-line bg-white px-4 pt-3 pb-5">
          {replies.length > 0 && (
            <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
              {replies.map((r) => (
                <button
                  key={r.q}
                  type="button"
                  disabled={typing}
                  onClick={() => send(r.q, r.a)}
                  className="shrink-0 rounded-full border border-k-green/60 bg-k-green-50 px-3.5 py-2 text-sm font-medium text-k-green-700 transition hover:bg-k-green/15 disabled:opacity-50"
                >
                  {r.q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full text-k-muted hover:bg-k-bg"
              aria-label="Legg ved bilde"
            >
              <Paperclip className="size-5" />
            </button>
            <label className="sr-only" htmlFor="chat-input">
              Skriv en melding
            </label>
            <input
              id="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Skriv en melding …"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-full bg-k-bg px-4 text-[15px] placeholder:text-k-muted focus:bg-white focus:ring-2 focus:ring-k-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || typing}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-k-green-600 text-white transition hover:bg-k-green-700 disabled:bg-k-line disabled:text-k-muted"
              aria-label="Send"
            >
              <SendHorizontal className="size-5" />
            </button>
          </form>
        </div>
      }
    >
      <div ref={listRef} className="h-full overflow-y-auto bg-k-bg px-4 py-4" aria-live="polite">
        {/* Kontekstkort: brukeren slipper å forklare situasjonen selv */}
        <div className="mx-auto mb-4 flex max-w-[85%] items-center gap-3 rounded-2xl border border-k-line bg-white p-3 text-sm shadow-sm">
          <LineBadge line={disruption.line} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold">Sak lagt ved automatisk</p>
            <p className="truncate text-k-muted">
              {disruption.affectedDeparture} {disruption.from} → {disruption.destination} · Innstilt
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
                  m.from === 'me'
                    ? 'self-end rounded-br-md bg-k-green-700 text-white'
                    : 'self-start rounded-bl-md bg-white text-k-ink shadow-sm'
                }`}
              >
                <span className="sr-only">{m.from === 'me' ? 'Du: ' : 'Marte: '}</span>
                {m.text}
              </motion.li>
            ))}
          </AnimatePresence>
          {typing && (
            <li className="flex gap-1 self-start rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm">
              <span className="sr-only">Marte skriver</span>
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="size-2 rounded-full bg-k-muted"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                  aria-hidden
                />
              ))}
            </li>
          )}
        </ul>
      </div>
    </Sheet>
  )
}
