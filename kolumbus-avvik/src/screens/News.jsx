import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, MessageCircle, ThumbsUp, TriangleAlert } from 'lucide-react'
import Sheet from '../components/Sheet.jsx'
import { Button, Group, Tag } from '../components/ui.jsx'
import { NEWS } from '../data.js'

const FILTERS = ['Alle', 'Driftsmelding', 'Ruteendring', 'Nyhet', 'Båt']
const TAG_TONE = { Driftsmelding: 'danger', Ruteendring: 'warn', Nyhet: 'info', Båt: 'muted' }

const LIVE = {
  id: 'live',
  tag: 'Driftsmelding',
  date: 'Nå',
  title: 'Linje 6 fra UiS øst mot Stavanger er innstilt',
  body: 'Avgangen er innstilt på grunn av teknisk feil. Ekstrabuss 6E går fra plattform B, og linje 7 går som normalt. Si fra hvordan dette påvirker deg, så hjelper vi deg videre.',
  ask: 'Hvor går linje 6?',
  useful: 18,
}

export default function News({ disrupted, onAsk, onShowCrisis }) {
  const [filter, setFilter] = useState('Alle')
  const [openId, setOpenId] = useState(null)
  const [votes, setVotes] = useState({}) // id → true
  const items = [...(disrupted ? [LIVE] : []), ...NEWS].filter((n) => filter === 'Alle' || n.tag === filter)
  const open = [LIVE, ...NEWS].find((n) => n.id === openId)

  return (
    <div className="h-full overflow-y-auto pb-6">
      <h1 className="px-4 pt-4 text-[26px] font-bold tracking-tight">Nyheter</h1>
      <p className="px-4 text-[14px] text-muted">Siste oppdateringer fra Kolumbus</p>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`h-8 shrink-0 rounded-full px-3.5 text-[14px] font-medium ${filter === f ? 'bg-brand text-white' : 'bg-surface text-fg ring-1 ring-line ring-inset'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <Group className="mt-4">
        <ul>
          <AnimatePresence initial={false}>
            {items.map((n) => (
              <motion.li key={n.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-line [&+&]:border-t">
                <button type="button" onClick={() => setOpenId(n.id)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-surface-2 ${n.id === 'live' ? 'bg-red-50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Tag tone={TAG_TONE[n.tag]}>
                        {n.id === 'live' && <TriangleAlert className="size-3" />}
                        {n.tag}
                      </Tag>
                      <span className="text-[12px] text-faint">{n.date}</span>
                    </div>
                    <p className="mt-1.5 text-[16px] leading-snug font-semibold">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-muted">{n.body}</p>
                  </div>
                  <ChevronRight className="mt-6 size-4 shrink-0 text-faint" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {!items.length && <p className="px-4 py-6 text-center text-[14px] text-muted">Ingen saker i denne kategorien.</p>}
      </Group>

      <Sheet open={!!openId} onClose={() => setOpenId(null)} title={open?.tag ?? ''}>
        {open && (
          <article className="px-4">
            <p className="text-[12px] text-faint">Kolumbus · {open.date}</p>
            <h2 className="mt-1 text-[20px] leading-snug font-bold">{open.title}</h2>
            <p className="mt-3 text-[16px] leading-relaxed">{open.body}</p>

            <div className="mt-5 flex items-center gap-3 border-y border-line py-3">
              <button
                type="button"
                aria-pressed={!!votes[open.id]}
                onClick={() => setVotes((v) => ({ ...v, [open.id]: !v[open.id] }))}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium ${votes[open.id] ? 'bg-brand text-white' : 'bg-surface-2'}`}
              >
                <ThumbsUp className="size-4" /> Nyttig
              </button>
              <span className="text-[13px] text-muted tabular-nums">{open.useful + (votes[open.id] ? 1 : 0)} syntes dette var nyttig</span>
            </div>

            <div className="space-y-2 pt-4">
              {open.id === 'live' && (
                <Button
                  onClick={() => {
                    setOpenId(null)
                    onShowCrisis()
                  }}
                >
                  Si fra hvordan dette påvirker deg
                </Button>
              )}
              <Button variant="secondary" onClick={() => onAsk(open.ask)}>
                <MessageCircle className="size-[18px]" /> Still spørsmål om dette
              </Button>
            </div>
          </article>
        )}
      </Sheet>
    </div>
  )
}
