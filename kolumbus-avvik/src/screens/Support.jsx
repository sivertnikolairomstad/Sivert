import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, ThumbsDown, ThumbsUp } from 'lucide-react'
import { QUICK_REPLIES } from '../data.js'
import { LineBadge } from '../components/ui.jsx'
import DirectionsView from '../components/DirectionsView.jsx'
import { nearestStops } from '../directions.js'

const NAMES = { ai: 'Move-assistenten', human: 'Ingrid, trafikksentralen' }

export default function Support({ messages, typing, onSend, onRate, onRoute, onLocate, location, disrupted }) {
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const humanJoined = messages.some((m) => m.from === 'human')
  const lastAgent = [...messages].reverse().find((m) => m.from === 'ai' || m.from === 'human')
  const asked = new Set(messages.filter((m) => m.from === 'me').map((m) => m.text))
  const quick = QUICK_REPLIES.filter((q) => !asked.has(q))

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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Avatar kind={humanJoined ? 'human' : 'ai'} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold">{humanJoined ? 'Ingrid' : 'Move-assistenten'}</p>
          <p className="text-[12px] text-muted">{humanJoined ? 'Trafikksentralen' : 'Kjenner alle Kolumbus-linjene'}</p>
        </div>
        {disrupted && <span className="rounded bg-danger px-1.5 py-0.5 text-[11px] font-semibold text-white">Avvik linje 6</span>}
      </div>

      <div ref={listRef} role="log" aria-label="Samtale" className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <Message key={m.id} m={m} prev={messages[i - 1]} isLast={m === lastAgent} onSend={onSend} onRate={onRate} onRoute={onRoute} onLocate={onLocate} location={location} busy={typing} />
          ))}
        </AnimatePresence>
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-fit gap-1 rounded-2xl bg-surface px-4 py-3 shadow-sm">
            <span className="sr-only">Skriver</span>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="size-2 rounded-full bg-faint" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </motion.div>
        )}
      </div>

      <div className="border-t border-line bg-surface pt-2 pb-2">
        {quick.length > 0 && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto px-3">
            {quick.map((q) => (
              <button key={q} type="button" disabled={typing} onClick={() => onSend(q)} className="h-8 shrink-0 rounded-full border border-line px-3 text-[13px] text-fg active:bg-surface-2 disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-center gap-2 px-3">
          <label htmlFor="chat-input" className="sr-only">
            Melding
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Melding"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 text-[16px] outline-none placeholder:text-faint focus:border-faint"
          />
          <button type="submit" disabled={!draft.trim() || typing} aria-label="Send" className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white disabled:bg-surface-2 disabled:text-faint">
            <ArrowUp className="size-5" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  )
}

function Message({ m, prev, isLast, onSend, onRate, onRoute, onLocate, location, busy }) {
  if (m.from === 'system')
    return <p className="py-2 text-center text-[12px] text-faint">{m.text}</p>

  if (m.from === 'me')
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[78%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[15px] leading-snug text-white">{m.text}</p>
      </motion.div>
    )

  // Navnet vises bare når avsenderen bytter, som i vanlige meldingsapper
  const showName = prev?.from !== m.from
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={m.deps || m.directions ? "w-[92%]" : "max-w-[82%]"}>
      {showName && <p className="mb-1 ml-1 text-[12px] text-faint">{NAMES[m.from]}</p>}
      {m.deps ? (
        <div className="overflow-hidden rounded-2xl rounded-bl-md bg-surface shadow-sm">
          <p className="border-b border-line px-3.5 py-2 text-[14px] font-semibold">{m.title}</p>
          <ul>
            {m.deps.map((d, i) => (
              <li key={i} className="flex items-center gap-2.5 border-line px-3.5 py-2 [&+&]:border-t">
                <button type="button" onClick={() => onRoute(d.line)} aria-label={`Vis linje ${d.line}`} className="shrink-0">
                  <LineBadge line={d.line} size="sm" state={d.cancelled ? 'cancelled' : 'ok'} />
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[14px] ${d.cancelled ? 'text-faint line-through' : ''}`}>{d.toward}</span>
                  {(d.notes || d.cancelled) && <span className={`block text-[12px] ${d.cancelled ? 'font-semibold text-danger' : 'text-muted'}`}>{d.cancelled ? 'Innstilt' : d.notes}</span>}
                </span>
                <span className="text-right tabular-nums">
                  <span className="block text-[15px] font-semibold">{d.soon || d.time}</span>
                  {d.soon && <span className="block text-[11px] text-faint">{d.time}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={`rounded-2xl rounded-bl-md px-3.5 py-2 text-[15px] leading-snug whitespace-pre-line shadow-sm ${m.from === 'human' ? 'bg-sky-100' : 'bg-surface'}`}>{m.text}</p>
      )}
      {m.directions && (
        // Veibeskrivelsen vises rett i chatten: kart, avstand og steg for steg
        <div className="mt-1.5 overflow-hidden rounded-2xl bg-surface pt-3 shadow-sm">
          <DirectionsView compact req={{ ...m.directions, stop: m.directions.stop ?? nearestStops(location, 1)[0].name }} location={location} onLocate={onLocate} />
        </div>
      )}
      {m.routes?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {m.routes.map((id) => (
            <button key={id} type="button" onClick={() => onRoute(id)} aria-label={`Vis linje ${id}`} className="rounded-md active:opacity-70">
              <LineBadge line={id} size="sm" />
            </button>
          ))}
        </div>
      )}
      {isLast && m.actions && (
        <div className="mt-2 flex flex-wrap gap-2">
          {m.actions.map((a) => (
            <button key={a} type="button" disabled={busy} onClick={() => onSend(a)} className="h-8 rounded-full bg-surface px-3 text-[13px] font-medium text-accent ring-1 ring-line ring-inset active:bg-surface-2 disabled:opacity-50">
              {a}
            </button>
          ))}
        </div>
      )}
      {isLast && (
        <div className="mt-1 ml-1 flex items-center gap-0.5 text-[12px] text-faint">
          {m.rating ? (
            <span>Takk for tilbakemeldingen</span>
          ) : (
            <>
              <span className="mr-1">Var svaret nyttig?</span>
              <button type="button" aria-label="Ja" onClick={() => onRate(m.id, 'up')} className="grid size-7 place-items-center rounded-full active:bg-surface-2">
                <ThumbsUp className="size-3.5" />
              </button>
              <button type="button" aria-label="Nei" onClick={() => onRate(m.id, 'down')} className="grid size-7 place-items-center rounded-full active:bg-surface-2">
                <ThumbsDown className="size-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

function Avatar({ kind }) {
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-semibold ${kind === 'human' ? 'bg-sky-100 text-sky-800' : 'bg-brand text-white'}`} aria-hidden>
      {kind === 'human' ? 'I' : 'M'}
    </span>
  )
}

