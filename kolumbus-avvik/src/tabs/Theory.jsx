import { motion } from 'framer-motion'
import { ArrowLeftRight, ArrowRight, Megaphone, ShieldAlert, Smartphone, Target, GraduationCap } from 'lucide-react'
import { Glass, SectionTitle } from '../components/ui.jsx'
import { grunigModels, theories } from '../data.js'

const ICONS = { ArrowLeftRight, ShieldAlert, Target, Smartphone, Megaphone }
const TAB_LABEL = { plan: 'Reise & avvik', chat: 'Support & dialog', some: 'SoMe-dialog' }

export default function Theory({ onTab }) {
  return (
    <div>
      <SectionTitle eyebrow="Fane 4 · Faglig teoridashbord" title="Teorien bak Move Rogaland">
        Slik henger det teoretiske rammeverket i oppgaven sammen med løsningen. Den røde tråden er overgangen fra enveis
        informasjon til toveis, symmetrisk dialog.
      </SectionTitle>

      <GrunigLadder />

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {theories.map((t, i) => (
          <TheoryCard key={t.id} t={t} i={i} onTab={onTab} wide={t.id === 'grunig'} />
        ))}
      </div>

      <Glass className="mt-5 flex items-start gap-4 p-5 sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <GraduationCap className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-white">Samlet argument</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Reisende i et driftsavvik er <em className="text-slate-200 not-italic">definitive interessenter</em>. De
            krever umiddelbar, situasjonstilpasset respons (SCCT) i kanaler de selv velger å bruke (UGT). Når de i tillegg
            inviteres til å bidra (crowdcasting) og får svar tilbake, blir kommunikasjonen{' '}
            <em className="text-emerald-300 not-italic">toveis symmetrisk</em>, og relasjonen styrkes i stedet for å
            svekkes.
          </p>
        </div>
      </Glass>
    </div>
  )
}

function GrunigLadder() {
  return (
    <Glass className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Grunig & Hunts fire modeller</p>
          <p className="mt-1 text-lg font-semibold text-white">Fra å informere til å samtale</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-rose-300"><span className="size-2 rounded-full bg-rose-400" /> Dagens praksis</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="size-2 rounded-full bg-emerald-400" /> Move Rogaland</span>
        </div>
      </div>
      <ol className="grid gap-3 sm:grid-cols-4">
        {grunigModels.map((m, i) => (
          <motion.li
            key={m.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            className={`relative rounded-2xl p-4 ring-1 ${
              m.target
                ? 'bg-emerald-400/15 ring-emerald-400/60 shadow-[0_0_40px_-10px_rgba(52,211,153,0.6)]'
                : m.today
                  ? 'bg-rose-500/10 ring-rose-400/40'
                  : 'bg-white/[0.03] ring-white/10'
            }`}
          >
            <span className="text-xs font-bold text-slate-500 tabular-nums">0{i + 1}</span>
            <p className={`mt-1 font-semibold ${m.target ? 'text-emerald-200' : 'text-white'}`}>{m.name}</p>
            <p className="mt-2 text-xs text-slate-400">{m.flow}</p>
            <p className="text-xs text-slate-400">Mål: {m.goal}</p>
            {(m.today || m.target) && (
              <span className={`absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${m.target ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'}`}>
                {m.target ? 'Mål' : 'I dag'}
              </span>
            )}
          </motion.li>
        ))}
      </ol>
    </Glass>
  )
}

function TheoryCard({ t, i, onTab, wide }) {
  const Icon = ICONS[t.icon]
  const Visual = VISUALS[t.id]
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + i * 0.06 }}
      className={wide ? 'md:col-span-2' : ''}
    >
      <Glass className="flex h-full flex-col p-5 transition hover:border-emerald-400/30">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400/25 to-teal-400/10 text-emerald-300 ring-1 ring-emerald-400/25">
            <Icon className="size-5" />
          </span>
          <div>
            <h3 className="leading-snug font-semibold text-white">{t.title}</h3>
            <p className="text-xs text-slate-400">{t.authors}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{t.core}</p>
        {Visual && <Visual />}
        <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-emerald-300/80 uppercase">I appen</p>
        <ul className="space-y-1.5 text-sm text-slate-300">
          {t.inApp.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden /> {x}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => onTab(t.tab)} className="mt-auto inline-flex items-center gap-1.5 self-start pt-5 text-sm font-semibold text-emerald-300 transition hover:gap-2.5">
          Se i appen: {TAB_LABEL[t.tab]} <ArrowRight className="size-4" />
        </button>
      </Glass>
    </motion.article>
  )
}

function SalienceVenn() {
  const c = [
    { cx: 70, cy: 62, label: 'Makt', lx: 40, ly: 40 },
    { cx: 130, cy: 62, label: 'Legitimitet', lx: 160, ly: 40 },
    { cx: 100, cy: 112, label: 'Hast', lx: 100, ly: 150 },
  ]
  return (
    <svg viewBox="0 0 200 182" className="mx-auto mt-4 w-full max-w-[220px]" role="img" aria-label="Venn-diagram: makt, legitimitet og hast overlapper i definitive interessenter">
      {c.map((k) => (
        <circle key={k.label} cx={k.cx} cy={k.cy} r="46" fill="rgba(52,211,153,0.10)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.2" />
      ))}
      {c.map((k) => (
        <text key={k.label + 't'} x={k.lx} y={k.ly} textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">
          {k.label}
        </text>
      ))}
      <motion.circle cx="100" cy="80" r="11" fill="#34d399" animate={{ r: [10, 13, 10] }} transition={{ duration: 2.4, repeat: Infinity }} />
      <text x="100" y="83.5" textAnchor="middle" fill="#022c22" fontSize="9" fontWeight="800">D</text>
      <text x="100" y="178" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="600">D = definitive: reisende i avvik</text>
    </svg>
  )
}

function ScctClusters() {
  const clusters = [
    { name: 'Offer', ex: 'Naturkrefter, rykter' },
    { name: 'Ulykke', ex: 'Teknisk feil', active: true },
    { name: 'Forebyggbar', ex: 'Menneskelig svikt' },
  ]
  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-1.5">
        {clusters.map((k) => (
          <div key={k.name} className={`rounded-xl p-2.5 text-center ring-1 ${k.active ? 'bg-amber-300/15 ring-amber-300/50' : 'bg-white/[0.03] ring-white/10'}`}>
            <p className={`text-xs font-semibold ${k.active ? 'text-amber-200' : 'text-slate-300'}`}>{k.name}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{k.ex}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Lav</span>
        <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-emerald-400/60 via-amber-300/60 to-rose-500/60" />
        <span>Høy ansvarstilskrivelse</span>
      </div>
    </div>
  )
}

function PoemChips() {
  const items = [
    { k: 'P', name: 'Paid', ex: 'Kampanjer, annonser' },
    { k: 'O', name: 'Owned', ex: 'App, chat, nettside', active: true },
    { k: 'E', name: 'Earned', ex: 'Deling, omtale, ros', active: true },
  ]
  return (
    <div className="mt-4 grid grid-cols-3 gap-1.5">
      {items.map((x) => (
        <div key={x.k} className={`rounded-xl p-2.5 ring-1 ${x.active ? 'bg-emerald-400/10 ring-emerald-400/40' : 'bg-white/[0.03] ring-white/10'}`}>
          <p className="text-lg leading-none font-black text-white">{x.k}</p>
          <p className="mt-1 text-xs font-semibold text-slate-200">{x.name}</p>
          <p className="text-[10px] leading-tight text-slate-500">{x.ex}</p>
        </div>
      ))}
    </div>
  )
}

function UgtNeeds() {
  const needs = ['Informasjon', 'Sosial interaksjon', 'Personlig identitet', 'Underholdning']
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {needs.map((n, i) => (
        <span key={n} className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${i < 3 ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/30' : 'bg-white/[0.03] text-slate-500 ring-white/10'}`}>
          {n}
        </span>
      ))}
    </div>
  )
}

const VISUALS = { salience: SalienceVenn, scct: ScctClusters, poem: PoemChips, ugt: UgtNeeds }
