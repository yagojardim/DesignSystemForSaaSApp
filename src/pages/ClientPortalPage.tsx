import { useState, useRef, useEffect } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0e1016',
  surface:  '#171a22',
  surface2: '#1e2230',
  border:   '#262b37',
  border2:  '#2f3547',
  txt:      '#e7eaf2',
  txt2:     '#a2a8ba',
  txt3:     '#6a7390',
  accent:   '#7d92ff',
  success:  '#35c9ae',
  warn:     '#e6b23c',
  crit:     '#f0805c',
  radius:   '12px',
}

const SEV_COLOR = { low: C.success, medium: C.warn, high: C.crit, critical: '#e03a50' }
const SEV_LABEL = { low: 'Baixo', medium: 'Médio', high: 'Alto', critical: 'Crítico' }

// ─── Shared mini-components ───────────────────────────────────────────────────
function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ color, background: bg }}>
      {label}
    </span>
  )
}

function SevBadge({ level }: { level: keyof typeof SEV_COLOR }) {
  const c = SEV_COLOR[level]
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color: c, background: `${c}18`, borderColor: `${c}40` }}
    >
      {SEV_LABEL[level]}
    </span>
  )
}

function CardShell({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="text-sm font-semibold" style={{ color: C.txt }}>{children}</span>
      {action}
    </div>
  )
}

function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function CommentInput() {
  const [val, setVal] = useState('')
  return (
    <div className="flex items-center gap-2 mt-2 ml-4 mr-4">
      <div
        className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: C.surface2, border: `1px solid ${C.border2}` }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: C.txt3, flexShrink: 0 }}>
          <path d="M6 1.5a4.5 4.5 0 0 1 4.5 4.5c0 2.485-2.015 4.5-4.5 4.5H2L1 11.5V6A4.5 4.5 0 0 1 6 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="Adicionar comentário..."
          className="flex-1 text-xs bg-transparent outline-none"
          style={{ color: C.txt, caretColor: C.accent }}
        />
        {val.trim() && (
          <button
            onClick={() => setVal('')}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all hover:brightness-110"
            style={{ background: C.accent, color: '#fff' }}
          >
            Enviar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PROJECTS = [
  { id: 'p1', name: 'Website Relaunch',       progress: 68, sprint: 'Sprint 7', sprintPct: 82, status: 'on-track' },
  { id: 'p2', name: 'ERP Integration v2',     progress: 41, sprint: 'Sprint 4', sprintPct: 55, status: 'at-risk'  },
  { id: 'p3', name: 'Mobile App (iOS+Android)',progress: 24, sprint: 'Sprint 2', sprintPct: 30, status: 'on-track' },
]

const SPRINTS = [
  { name: 'Sprint 7 — Website Relaunch',       pct: 82, status: 'on-track', ends: '28 jul' },
  { name: 'Sprint 4 — ERP Integration v2',     pct: 55, status: 'at-risk',  ends: '1 ago'  },
  { name: 'Sprint 2 — Mobile App',             pct: 30, status: 'on-track', ends: '4 ago'  },
]

const RISKS = [
  { id: 'r1', title: 'Acesso ao ambiente de staging bloqueado pelo firewall corporativo', sev: 'high' as const,     project: 'ERP Integration v2',      owner: 'Rafael Mendes',  days: 4, detail: 'A equipe de TI do cliente não liberou as portas 8443 e 9000 no firewall corporativo, impedindo os testes de integração em staging. Isso afeta diretamente o cronograma do Sprint 4.' },
  { id: 'r2', title: 'Dependência de API de terceiro sem SLA definido',                    sev: 'medium' as const,   project: 'Website Relaunch',         owner: 'Ana Lima',       days: 7, detail: 'O fornecedor do módulo de chat não forneceu SLA contratual. Em caso de instabilidade, não há garantia de tempo de resolução.' },
  { id: 'r3', title: 'Atraso na entrega de assets de marca pelo cliente',                  sev: 'low' as const,      project: 'Mobile App',               owner: 'Carla Souza',    days: 2, detail: 'O guia de marca atualizado ainda não foi entregue. O time de design está usando versões anteriores, o que pode gerar retrabalho.' },
  { id: 'r4', title: 'Instabilidade no servidor de homologação',                            sev: 'critical' as const, project: 'ERP Integration v2',      owner: 'Lucas Ferreira', days: 1, detail: 'O servidor de homologação apresentou 3 quedas nas últimas 48 horas. Isso está bloqueando os testes de aceitação do Sprint 4 e pode impactar a entrega.' },
]

const CEREMONIES = [
  { type: 'Daily',         label: 'Daily Scrum',      date: '25 jul · 09:00', project: 'Website Relaunch',       color: C.accent   },
  { type: 'Review',        label: 'Sprint Review',    date: '28 jul · 14:00', project: 'ERP Integration v2',     color: C.success  },
  { type: 'Planning',      label: 'Sprint Planning',  date: '29 jul · 10:00', project: 'Mobile App',             color: C.warn     },
  { type: 'Retrospectiva', label: 'Retrospectiva',    date: '29 jul · 16:00', project: 'Website Relaunch',       color: '#a78bfa'  },
  { type: 'Daily',         label: 'Daily Scrum',      date: '30 jul · 09:00', project: 'ERP Integration v2',     color: C.accent   },
]

const BACKLOG = [
  { id: 'bl1', type: 'Epic',    title: 'Módulo de relatórios financeiros',     pts: 21, project: 'ERP Integration v2',  status: 'pending' },
  { id: 'bl2', type: 'História',title: 'Exportação de dados em CSV e XLSX',    pts: 5,  project: 'Website Relaunch',    status: 'pending' },
  { id: 'bl3', type: 'Bug',     title: 'Avatar não carrega no Safari 16.x',   pts: 2,  project: 'Mobile App',          status: 'pending' },
  { id: 'bl4', type: 'História',title: 'Suporte a dark mode no portal web',    pts: 8,  project: 'Website Relaunch',    status: 'pending' },
]

const NEXT_SPRINT = [
  { id: 'ns1', type: 'História',title: 'Dashboard de métricas de uso (Admin)', pts: 8,  project: 'Website Relaunch',    status: 'planned' },
  { id: 'ns2', type: 'História',title: 'Notificações push — eventos críticos', pts: 5,  project: 'Mobile App',          status: 'planned' },
  { id: 'ns3', type: 'Bug',     title: 'Lentidão no carregamento de listas',   pts: 3,  project: 'ERP Integration v2',  status: 'planned' },
  { id: 'ns4', type: 'Epic',    title: 'Integração com Slack (webhooks)',       pts: 13, project: 'Website Relaunch',    status: 'planned' },
]

const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  Epic:     { color: '#a78bfa', bg: '#2a1e4a' },
  História: { color: C.accent,  bg: '#1e2448' },
  Bug:      { color: C.crit,    bg: '#3a1e1e' },
}

// ─── BURNDOWN CHART ───────────────────────────────────────────────────────────
function BurndownChart() {
  const ideal  = [120, 111, 102, 93, 84, 75, 66, 57, 48, 39, 30, 21, 12, 3]
  const actual = [120, 114, 108, 97, 92, 85, 80, 73, 65, 60, 52, 44]
  const W = 340, H = 130, DAYS = 13, MAX = 120
  const x = (d: number) => Math.round((d / DAYS) * W)
  const y = (v: number) => Math.round(H - (v / MAX) * H)
  const iPath = ideal.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join('')
  const aPath = actual.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join('')
  const aArea = `${aPath}L${x(actual.length - 1)},${H}L0,${H}Z`
  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-3xl font-bold tabular-nums" style={{ color: C.txt }}>44 pts</span>
          <span className="text-xs ml-2" style={{ color: C.txt2 }}>restantes</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: C.txt3 }}>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-px border-t border-dashed" style={{ borderColor: C.txt3 }} />Ideal</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 rounded" style={{ background: C.accent }} />Real</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 110 }}>
        <defs>
          <linearGradient id="bdown-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 40, 80, 120].map(v => (
          <line key={v} x1={0} y1={y(v)} x2={W} y2={y(v)} stroke={C.border} strokeWidth="1" />
        ))}
        <path d={iPath} stroke={C.border2} strokeWidth="1.5" strokeDasharray="5 3" fill="none" />
        <path d={aArea} fill="url(#bdown-fill)" />
        <path d={aPath} stroke={C.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {actual.map((v, i) => i === actual.length - 1 && (
          <circle key={i} cx={x(i)} cy={y(v)} r="4" fill={C.accent} />
        ))}
      </svg>
      <div className="flex justify-between mt-1 text-[9px]" style={{ color: C.txt3 }}>
        {['D1', '', 'D3', '', 'D5', '', 'D7', '', 'D9', '', 'D11', '', 'D13'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
    </div>
  )
}

// ─── RISK OVERLAY ─────────────────────────────────────────────────────────────
function RiskOverlay({ risk, onClose }: { risk: typeof RISKS[0]; onClose: () => void }) {
  const c = SEV_COLOR[risk.sev]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(8,10,14,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg flex flex-col fade-rise"
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderTop: `3px solid ${c}`,
          borderRadius: C.radius,
          boxShadow: '0 32px 80px rgba(0,0,0,0.56)',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <SevBadge level={risk.sev} />
              <span className="text-[10px] font-mono" style={{ color: C.txt3 }}>{risk.id.toUpperCase()}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ color: C.txt3, background: C.surface2, border: `1px solid ${C.border}` }}
              >
                Somente leitura
              </span>
            </div>
            <h2 className="text-sm font-semibold leading-snug" style={{ color: C.txt }}>{risk.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ color: C.txt3, background: C.surface2 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.txt }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.txt3 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {/* Detail */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.txt3 }}>Descrição do risco</p>
            <p className="text-sm leading-relaxed" style={{ color: C.txt2 }}>{risk.detail}</p>
          </div>

          {/* Metadata grid */}
          <div
            className="grid grid-cols-2 gap-3 p-4 rounded-xl"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
          >
            {[
              { label: 'Projeto',     val: risk.project },
              { label: 'Responsável', val: risk.owner },
              { label: 'Bloqueado',   val: `${risk.days} dia(s)` },
              { label: 'Severidade',  val: SEV_LABEL[risk.sev] },
            ].map(m => (
              <div key={m.label}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.txt3 }}>{m.label}</p>
                <p className="text-xs font-medium" style={{ color: C.txt }}>{m.val}</p>
              </div>
            ))}
          </div>

          {/* Read-only notice */}
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl"
            style={{ background: `${C.warn}12`, border: `1px solid ${C.warn}30` }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: C.warn, flexShrink: 0, marginTop: 1 }}>
              <path d="M7 3.5v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <p className="text-xs" style={{ color: C.warn }}>
              Você tem acesso de visualização. Para ações sobre este risco, entre em contato com o responsável interno do projeto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CARD 1: Project progress bar ────────────────────────────────────────────
function ProgressCard({ project }: { project: typeof PROJECTS[0] }) {
  const c = project.status === 'at-risk' ? C.warn : C.success
  return (
    <CardShell>
      <CardTitle>
        Evolução do projeto
        <Pill color={c} label={project.status === 'at-risk' ? 'Em risco' : 'No prazo'} />
      </CardTitle>
      <div className="px-5 py-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-5xl font-bold tabular-nums" style={{ color: C.txt }}>{project.progress}</span>
            <span className="text-2xl font-bold" style={{ color: C.txt2 }}>%</span>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: C.txt2 }}>{project.name}</p>
            <p className="text-[10px] mt-0.5" style={{ color: C.txt3 }}>{project.sprint}</p>
          </div>
        </div>
        {/* Big progress bar */}
        <div className="h-3 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${c}cc, ${c})` }}
          />
        </div>
        {/* Tick marks */}
        <div className="flex justify-between mt-1.5 text-[9px]" style={{ color: C.txt3 }}>
          {[0, 25, 50, 75, 100].map(v => <span key={v}>{v}%</span>)}
        </div>
        {/* Sub-metrics */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          {[
            { label: 'Tarefas concluídas', val: '84 / 124' },
            { label: 'Sprint atual',         val: project.sprintPct + '%' },
            { label: 'Prazo',                val: '14 ago 2025' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className="text-sm font-bold tabular-nums" style={{ color: C.txt }}>{m.val}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.txt3 }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

// ─── CARD 2: Burndown ─────────────────────────────────────────────────────────
function BurndownCard() {
  return (
    <CardShell>
      <CardTitle>Burndown — Sprint atual</CardTitle>
      <BurndownChart />
    </CardShell>
  )
}

// ─── CARD 3: Project count ────────────────────────────────────────────────────
function ProjectCountCard({ count }: { count: number }) {
  const onTrack = PROJECTS.filter(p => p.status === 'on-track').length
  const atRisk  = PROJECTS.filter(p => p.status === 'at-risk').length
  return (
    <CardShell>
      <CardTitle>Projetos</CardTitle>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="text-6xl font-bold tabular-nums leading-none" style={{ color: C.txt }}>{count}</span>
          <div className="space-y-1.5">
            <Pill color={C.success} label={`${onTrack} no prazo`} />
            <br />
            <Pill color={C.warn}    label={`${atRisk} em risco`} />
          </div>
        </div>
        {/* Mini project list */}
        <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          {PROJECTS.map(p => {
            const c = p.status === 'at-risk' ? C.warn : C.success
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
                <span className="flex-1 text-xs truncate" style={{ color: C.txt2 }}>{p.name}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: C.txt }}>{p.progress}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </CardShell>
  )
}

// ─── CARD 4: Active sprint ────────────────────────────────────────────────────
function ActiveSprintCard() {
  return (
    <CardShell>
      <CardTitle>Sprint ativa</CardTitle>
      <div className="px-4 py-3 space-y-3">
        {SPRINTS.map(s => {
          const c = s.status === 'at-risk' ? C.warn : C.success
          return (
            <div
              key={s.name}
              className="p-3 rounded-xl"
              style={{ background: C.surface2, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium truncate" style={{ color: C.txt }}>{s.name}</span>
                <span className="text-xs font-bold tabular-nums ml-2 flex-shrink-0" style={{ color: c }}>{s.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: c }} />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: C.txt3 }}>Termina em {s.ends}</p>
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}

// ─── CARD 5: Risks ────────────────────────────────────────────────────────────
function RisksCard() {
  const [activeRisk, setActiveRisk] = useState<typeof RISKS[0] | null>(null)
  return (
    <>
      <CardShell>
        <CardTitle>
          Riscos abertos
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ color: C.crit, background: `${C.crit}20` }}
          >
            {RISKS.length}
          </span>
        </CardTitle>
        <div className="px-4 py-3 space-y-2">
          {RISKS.map(r => {
            const c = SEV_COLOR[r.sev]
            return (
              <button
                key={r.id}
                onClick={() => setActiveRisk(r)}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                style={{ background: C.surface2, border: `1px solid ${C.border}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c + '60'; (e.currentTarget as HTMLButtonElement).style.background = `${c}08` }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.background = C.surface2 }}
              >
                <span className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0 mt-0.5" style={{ background: c }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug mb-1 truncate" style={{ color: C.txt }}>{r.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SevBadge level={r.sev} />
                    <span className="text-[10px]" style={{ color: C.txt3 }}>{r.project}</span>
                    <span className="text-[10px]" style={{ color: C.txt3 }}>· {r.days}d bloqueado</span>
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: C.txt3, flexShrink: 0, marginTop: 2 }}>
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          })}
        </div>
      </CardShell>
      {activeRisk && <RiskOverlay risk={activeRisk} onClose={() => setActiveRisk(null)} />}
    </>
  )
}

// ─── CARD 6: Schedule ────────────────────────────────────────────────────────
function ScheduleCard() {
  return (
    <CardShell>
      <CardTitle>Próximas cerimônias</CardTitle>
      <div className="px-4 py-3 space-y-1.5">
        {CEREMONIES.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.color + '50' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: `${c.color}18`, color: c.color }}
            >
              {c.type.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: C.txt }}>{c.label}</p>
              <p className="text-[10px]" style={{ color: C.txt3 }}>{c.project}</p>
            </div>
            <span className="text-[10px] flex-shrink-0 font-mono" style={{ color: c.color }}>{c.date}</span>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

// ─── CARD 7 & 8: Backlog / Next sprint items ─────────────────────────────────
function ItemCard({ title, items, showComments }: { title: string; items: typeof BACKLOG; showComments: boolean }) {
  return (
    <CardShell>
      <CardTitle>
        {title}
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ color: C.accent, background: `${C.accent}18` }}
        >
          {items.length}
        </span>
      </CardTitle>
      <div className="px-4 py-3 space-y-2">
        {items.map(item => {
          const t = TYPE_COLOR[item.type] ?? { color: C.txt3, bg: C.surface2 }
          return (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden"
              style={{ background: C.surface2, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Tag label={item.type} color={t.color} bg={t.bg} />
                <span className="flex-1 text-xs truncate" style={{ color: C.txt }}>{item.title}</span>
                <span
                  className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: C.txt3, background: C.border }}
                >
                  {item.pts} pts
                </span>
                <span className="text-[10px] flex-shrink-0 truncate max-w-[90px]" style={{ color: C.txt3 }}>{item.project}</span>
              </div>
              {showComments && <CommentInput />}
              {showComments && <div className="pb-2" />}
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-xs">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: C.surface2, border: `1px solid ${C.border}` }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: C.txt3 }}>
            <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="16" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="16" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="16" y="16" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: C.txt }}>Nenhum projeto selecionado</p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: C.txt2 }}>
            Selecione um ou mais projetos no seletor acima para visualizar o dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── PROJECT SELECTOR ────────────────────────────────────────────────────────
function ProjectSelector({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const label = selected.size === 0
    ? 'Selecionar projeto...'
    : selected.size === 1
      ? PROJECTS.find(p => selected.has(p.id))?.name ?? ''
      : `${selected.size} projetos selecionados`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium transition-all"
        style={{
          background: C.surface2,
          border: `1px solid ${open ? C.accent : C.border}`,
          color: selected.size === 0 ? C.txt3 : C.txt,
          minWidth: 220,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: C.accent, flexShrink: 0 }}>
          <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="2" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="flex-1 text-left truncate">{label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: C.txt3, flexShrink: 0 }}>
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 left-0 z-30 py-1 fade-rise"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', minWidth: 240 }}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.txt3 }}>Projetos disponíveis</p>
          {PROJECTS.map(p => {
            const checked = selected.has(p.id)
            const c = p.status === 'at-risk' ? C.warn : C.success
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                style={{ background: checked ? `${C.accent}10` : 'transparent' }}
                onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: checked ? C.accent : C.surface2, border: `1px solid ${checked ? C.accent : C.border2}` }}
                >
                  {checked && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: C.txt }}>{p.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.txt3 }}>{p.sprint}</p>
                </div>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── PORTAL HEADER ────────────────────────────────────────────────────────────
function PortalHeader({
  selected, onToggle,
  isAdmin, setIsAdmin,
  activeFilter, setActiveFilter,
}: {
  selected: Set<string>; onToggle: (id: string) => void
  isAdmin: boolean; setIsAdmin: (v: boolean) => void
  activeFilter: string; setActiveFilter: (v: string) => void
}) {
  const FILTERS = ['Todos', 'Épicos', 'Histórias', 'Bugs']
  return (
    <header
      className="flex items-center justify-between gap-4 px-8 py-3 flex-shrink-0"
      style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${C.accent}, #5b6ef7)` }}
        >
          A
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: C.txt }}>Altech Agency</p>
          <p className="text-[10px]" style={{ color: C.txt3 }}>Portal do cliente</p>
        </div>
      </div>

      {/* Center: selector + filters */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        <ProjectSelector selected={selected} onToggle={onToggle} />
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-xl"
          style={{ background: C.surface2, border: `1px solid ${C.border}` }}
        >
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeFilter === f ? C.surface : 'transparent',
                color: activeFilter === f ? C.txt : C.txt3,
                boxShadow: activeFilter === f ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Right: role toggle + date */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: C.txt3 }}>Visualizador</span>
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className="relative w-10 h-5 rounded-full transition-all"
            style={{ background: isAdmin ? C.accent : C.border2 }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
              style={{ left: isAdmin ? '22px' : '2px' }}
            />
          </button>
          <span className="text-xs" style={{ color: isAdmin ? C.accent : C.txt3, fontWeight: isAdmin ? 600 : 400 }}>Admin</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium" style={{ color: C.txt }}>25 jul 2025</p>
          <p className="text-[10px]" style={{ color: C.txt3 }}>Atualizado agora</p>
        </div>
      </div>
    </header>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ClientPortalPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['p1']))
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Todos')

  function toggleProject(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const isSingle = selected.size === 1
  const singleProject = isSingle ? PROJECTS.find(p => selected.has(p.id)) : null
  const isEmpty = selected.size === 0

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <PortalHeader
        selected={selected} onToggle={toggleProject}
        isAdmin={isAdmin} setIsAdmin={setIsAdmin}
        activeFilter={activeFilter} setActiveFilter={setActiveFilter}
      />

      {/* State label strip */}
      <div
        className="flex items-center gap-2 px-8 py-2 flex-shrink-0"
        style={{ background: `${C.accent}08`, borderBottom: `1px solid ${C.border}` }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: C.accent }}>
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 4v3M5 3v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="text-[11px]" style={{ color: C.txt3 }}>
          {isEmpty
            ? 'Selecione um projeto no seletor acima'
            : isSingle
              ? `Modo: 1 projeto selecionado — todos os cards disponíveis · Perfil: ${isAdmin ? 'Admin (comentários ativos)' : 'Visualizador (somente leitura)'}`
              : `Modo: ${selected.size} projetos selecionados — Barra de progresso e Burndown ocultados · Perfil: ${isAdmin ? 'Admin' : 'Visualizador'}`}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', alignItems: 'start' }}>
            {/* Cards 1 & 2: single-project only */}
            {isSingle && singleProject && (
              <>
                <ProgressCard project={singleProject} />
                <BurndownCard />
              </>
            )}
            {/* Card 3: Project count */}
            <ProjectCountCard count={PROJECTS.length} />
            {/* Card 4: Active sprint */}
            <ActiveSprintCard />
            {/* Card 5: Risks */}
            <RisksCard />
            {/* Card 6: Schedule */}
            <ScheduleCard />
            {/* Card 7: Backlog */}
            <ItemCard title="Backlog" items={BACKLOG} showComments={isAdmin} />
            {/* Card 8: Next sprint */}
            <ItemCard title="Itens da próxima sprint" items={NEXT_SPRINT} showComments={isAdmin} />
          </div>
        )}
      </div>
    </div>
  )
}
