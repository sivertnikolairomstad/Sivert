import { useRef, useState } from 'react'
import { ArrowLeftRight, Megaphone, ShieldAlert, Smartphone, Target } from 'lucide-react'
import { Button, Group, Row, SectionHeader, Tag } from '../components/ui.jsx'
import Sheet from '../components/Sheet.jsx'
import { grunigModels, theories } from '../data.js'

const ICONS = { ArrowLeftRight, ShieldAlert, Target, Smartphone, Megaphone }
const TAB_LABEL = { plan: 'Reise', chat: 'Hjelp', some: 'SoMe' }

export default function Theory({ onTab }) {
  const [openId, setOpenId] = useState(null)
  // Behold siste teori mens arket animeres ut, så innholdet ikke forsvinner midt i animasjonen
  const lastRef = useRef(null)
  const t = theories.find((x) => x.id === openId) ?? lastRef.current
  lastRef.current = t

  return (
    <div className="h-full overflow-y-auto pb-6">
      <h1 className="px-4 pt-2 text-[30px] font-bold tracking-tight">Teori</h1>
      <p className="px-4 pt-1 text-[14px] leading-relaxed text-muted">Rammeverket bak løsningen. Hovedgrepet er å gå fra enveis informasjon til toveis dialog.</p>

      <SectionHeader title="Grunig & Hunts fire modeller" />
      <Group>
        <ol>
          {grunigModels.map((m, i) => (
            <li key={m.name} className="flex items-center gap-3 border-line px-4 py-3 [&+&]:border-t">
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${m.target ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px]">{m.name}</span>
                <span className="block text-[13px] text-muted">{m.flow}</span>
              </span>
              {m.today && <Tag tone="danger">I dag</Tag>}
              {m.target && <Tag tone="accent">Move Rogaland</Tag>}
            </li>
          ))}
        </ol>
      </Group>

      <SectionHeader title="Teorier i oppgaven" />
      <Group>
        {theories.map((x) => (
          <Row key={x.id} icon={ICONS[x.icon]} title={x.title} sub={x.authors} onClick={() => setOpenId(x.id)} />
        ))}
      </Group>

      <SectionHeader title="Samlet" />
      <p className="mx-4 rounded-xl bg-surface px-4 py-3 text-[14px] leading-relaxed text-muted">
        Reisende i et avvik er definitive interessenter. De trenger rask respons tilpasset situasjonen (SCCT), i kanaler de selv velger (UGT). Når de også kan bidra og får svar tilbake, blir kommunikasjonen toveis symmetrisk.
      </p>

      <Sheet open={!!openId} onClose={() => setOpenId(null)} title={t?.title ?? ''}>
        {t && (
          <div className="px-4">
            <p className="text-[13px] text-faint">{t.authors}</p>
            <p className="mt-2 text-[15px] leading-relaxed">{t.core}</p>
            {VISUALS[t.id]?.()}
            <SectionHeader title="I appen" />
            <div className="-mx-4">
              <Group>
                <ul>
                  {t.inApp.map((x) => (
                    <li key={x} className="border-line px-4 py-3 text-[14px] leading-snug [&+&]:border-t">
                      {x}
                    </li>
                  ))}
                </ul>
              </Group>
            </div>
            <div className="pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenId(null)
                  onTab(t.tab)
                }}
              >
                Vis i appen: {TAB_LABEL[t.tab]}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function Salience() {
  const circles = [
    { cx: 64, cy: 58, label: 'Makt', lx: 34, ly: 30 },
    { cx: 116, cy: 58, label: 'Legitimitet', lx: 150, ly: 30 },
    { cx: 90, cy: 102, label: 'Hast', lx: 90, ly: 150 },
  ]
  return (
    <svg viewBox="0 0 180 160" className="mx-auto mt-4 w-48" role="img" aria-label="Makt, legitimitet og hast overlapper i definitive interessenter">
      {circles.map((c) => (
        <circle key={c.label} cx={c.cx} cy={c.cy} r="40" fill="rgba(62,207,142,0.08)" stroke="#2a302e" strokeWidth="1.5" />
      ))}
      {circles.map((c) => (
        <text key={c.label + 't'} x={c.lx} y={c.ly} textAnchor="middle" fill="#949e9a" fontSize="10">
          {c.label}
        </text>
      ))}
      <circle cx="90" cy="74" r="10" fill="#3ecf8e" />
      <text x="90" y="77.5" textAnchor="middle" fill="#062b1b" fontSize="9" fontWeight="700">
        D
      </text>
    </svg>
  )
}

function Scct() {
  const clusters = [
    ['Offer', 'Naturkrefter, rykter'],
    ['Ulykke', 'Teknisk feil', true],
    ['Forebyggbar', 'Menneskelig svikt'],
  ]
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {clusters.map(([name, ex, on]) => (
        <div key={name} className={`rounded-lg px-2 py-2 text-center ${on ? 'bg-warn/15 text-warn' : 'bg-surface-2 text-muted'}`}>
          <p className="text-[13px] font-semibold">{name}</p>
          <p className="text-[11px] opacity-80">{ex}</p>
        </div>
      ))}
    </div>
  )
}

const VISUALS = { salience: Salience, scct: Scct }
