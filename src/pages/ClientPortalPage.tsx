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

// ─── Data ─────────────────────────────────────────────────────────────────────
const PROJECTS = [
  { id: 'p1', name: 'Website Relaunch',        progress: 68, sprint: 'Sprint 7', sprintPct: 82, status: 'on-track' },
  { id: 'p2', name: 'ERP Integration v2',      progress: 41, sprint: 'Sprint 4', sprintPct: 55, status: 'at-risk'  },
  { id: 'p3', name: 'Mobile App (iOS+Android)', progress: 24, sprint: 'Sprint 2', sprintPct: 30, status: 'on-track' },
]

const SPRINTS = [
  { name: 'Sprint 7 — Website Relaunch',   pct: 82, status: 'on-track', ends: '28 jul' },
  { name: 'Sprint 4 — ERP Integration v2', pct: 55, status: 'at-risk',  ends: '1 ago'  },
  { name: 'Sprint 2 — Mobile App',         pct: 30, status: 'on-track', ends: '4 ago'  },
]

// Riscos visíveis ao cliente: apenas impactos funcionais de negócio, sem dados técnicos internos
const RISKS = [
  { id: 'r1', title: 'Integração com sistema legado pode impactar prazo do Sprint 4', sev: 'high' as const,   project: 'ERP Integration v2', days: 4, detail: 'A integração com o sistema legado está pendente de validação. O prazo de entrega do Sprint 4 pode ser afetado caso a validação não ocorra até 28/jul.' },
  { id: 'r2', title: 'Aprovação de identidade visual aguardada',                      sev: 'medium' as const, project: 'Website Relaunch',    days: 7, detail: 'A aprovação final do guia de marca está pendente. Entregas visuais do sprint podem ser ajustadas após confirmação.' },
  { id: 'r3', title: 'Assets de marca ainda não entregues',                           sev: 'low' as const,    project: 'Mobile App',          days: 2, detail: 'Os materiais de marca atualizados ainda não foram fornecidos. O time aguarda para prosseguir com os ajustes visuais.' },
]

// Entregas desta sprint — visão funcional de alto nível, sem detalhe técnico
const SPRINT_DELIVERIES: { id: string; title: string; status: 'done' | 'review' | 'progress'; project: string }[] = [
  { id: 'd1', title: 'Nova página inicial com identidade atualizada',       status: 'done',     project: 'Website Relaunch'    },
  { id: 'd2', title: 'Formulário de contato com confirmação por e-mail',    status: 'done',     project: 'Website Relaunch'    },
  { id: 'd3', title: 'Painel de importação de dados legados',               status: 'review',   project: 'ERP Integration v2' },
  { id: 'd4', title: 'Fluxo de cadastro e onboarding',                     status: 'review',   project: 'Mobile App'          },
  { id: 'd5', title: 'Relatório de status consolidado para gestores',       status: 'progress', project: 'ERP Integration v2' },
]

const DELIVERY_STATUS = {
  done:     { label: 'Concluído',   color: C.success },
  review:   { label: 'Em revisão',  color: C.warn    },
  progress: { label: 'Em andamento', color: C.accent  },
}

// Itens aguardando validação do cliente
const VALIDATION_ITEMS = [
  { id: 'v1', title: 'Identidade visual — aprovação do guia de marca',   project: 'Website Relaunch',    dueDate: '27 jul' },
  { id: 'v2', title: 'Fluxo de onboarding do app — validação funcional', project: 'Mobile App',          dueDate: '29 jul' },
  { id: 'v3', title: 'Layout do painel de gestão — feedback de UX',      project: 'ERP Integration v2',  dueDate: '31 jul' },
]

// Roadmap publicado — marcos de negócio
const ROADMAP = [
  { id: 'm1', date: 'Ago 2025', title: 'Beta fechado',          desc: 'Lançamento para grupo de clientes piloto',            status: 'upcoming' as const },
  { id: 'm2', date: 'Set 2025', title: 'Lançamento público',    desc: 'Disponibilização geral do produto reformulado',        status: 'upcoming' as const },
  { id: 'm3', date: 'Out 2025', title: 'Integração ERP v2',     desc: 'Conexão completa com sistema legado em produção',      status: 'upcoming' as const },
  { id: 'm4', date: 'Dez 2025', title: 'App Mobile GA',         desc: 'Versão estável do aplicativo iOS e Android publicada', status: 'upcoming' as const },
]

// Entregas recentes — features concluídas com link de demo
const RECENT_DELIVERIES = [
  { id: 're1', title: 'Novo portal de autenticação',             project: 'Website Relaunch',   date: '18 jul 2025' },
  { id: 're2', title: 'Dashboard de acompanhamento de pedidos',  project: 'ERP Integration v2', date: '14 jul 2025' },
  { id: 're3', title: 'Tela de perfil e preferências do usuário', project: 'Mobile App',         date: '10 jul 2025' },
]

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
              { label: 'Projeto',    val: risk.project         },
              { label: 'Impacto',    val: `${risk.days} dia(s)` },
              { label: 'Severidade', val: SEV_LABEL[risk.sev]  },
              { label: 'Status',     val: 'Em tratamento'       },
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
            style={{ background: `${C.accent}0E`, border: `1px solid ${C.accent}25` }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>
              <path d="M7 3.5v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <p className="text-xs" style={{ color: C.txt2 }}>
              Este item está sendo acompanhado pela equipe. Em caso de dúvidas, utilize o canal de comunicação do projeto.
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
        <div className="h-3 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${c}cc, ${c})` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[9px]" style={{ color: C.txt3 }}>
          {[0, 25, 50, 75, 100].map(v => <span key={v}>{v}%</span>)}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          {[
            { label: 'Tarefas concluídas', val: '84 / 124'   },
            { label: 'Sprint atual',        val: project.sprintPct + '%' },
            { label: 'Prazo',               val: '14 ago 2025' },
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

// ─── CARD 2: Sprint deliveries (client-safe, replaces Burndown) ───────────────
function SprintDeliveriesCard({ projectFilter }: { projectFilter: Set<string> }) {
  const projectNames = new Set(PROJECTS.filter(p => projectFilter.has(p.id)).map(p => p.name))
  const items = SPRINT_DELIVERIES.filter(d => projectNames.size === 0 || projectNames.has(d.project))
  return (
    <CardShell>
      <CardTitle>Entregas desta sprint</CardTitle>
      <div className="px-4 py-3 space-y-2">
        {items.map(d => {
          const s = DELIVERY_STATUS[d.status]
          return (
            <div
              key={d.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: C.surface2, border: `1px solid ${C.border}` }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="flex-1 text-xs leading-snug" style={{ color: C.txt }}>{d.title}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}35` }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
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
                    <span className="text-[10px]" style={{ color: C.txt3 }}>· {r.days}d impacto</span>
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

// ─── CARD 6: Awaiting client validation ──────────────────────────────────────
function ValidationCard() {
  const [approved, setApproved] = useState<Set<string>>(new Set())
  return (
    <CardShell style={{ borderLeft: `3px solid ${C.success}` }}>
      <CardTitle>
        Aguardando sua validação
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ color: C.success, background: `${C.success}20` }}
        >
          {VALIDATION_ITEMS.length - approved.size} pendentes
        </span>
      </CardTitle>
      <div className="px-4 py-3 space-y-2">
        {VALIDATION_ITEMS.map(v => {
          const done = approved.has(v.id)
          return (
            <div
              key={v.id}
              className="p-3 rounded-xl transition-all"
              style={{
                background: done ? `${C.success}08` : C.surface2,
                border: `1px solid ${done ? C.success + '40' : C.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug" style={{ color: done ? C.txt3 : C.txt, textDecoration: done ? 'line-through' : 'none' }}>{v.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.txt3 }}>{v.project} · Prazo: {v.dueDate}</p>
                </div>
              </div>
              {!done ? (
                <div className="flex items-center gap-2">
                  <button
                    className="h-7 px-3 rounded-lg text-xs font-medium transition-all"
                    style={{ background: C.surface, border: `1px solid ${C.border2}`, color: C.txt2 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border2 }}
                  >
                    Ver preview
                  </button>
                  <button
                    onClick={() => setApproved(prev => new Set([...prev, v.id]))}
                    className="h-7 px-3 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: C.success, color: '#fff' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                  >
                    Aprovar
                  </button>
                </div>
              ) : (
                <p className="text-[10px] font-semibold" style={{ color: C.success }}>✓ Aprovado por você</p>
              )}
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}

// ─── CARD 7: Published roadmap ────────────────────────────────────────────────
function RoadmapCard() {
  return (
    <CardShell>
      <CardTitle>Roadmap publicado</CardTitle>
      <div className="px-5 py-4">
        <div className="relative pl-4" style={{ borderLeft: `2px solid ${C.border2}` }}>
          {ROADMAP.map((m, i) => (
            <div key={m.id} className={`relative ${i < ROADMAP.length - 1 ? 'pb-5' : ''}`}>
              {/* Dot */}
              <span
                className="absolute -left-[5px] top-0.5 w-2 h-2 rounded-full"
                style={{ background: C.accent, boxShadow: `0 0 0 3px ${C.surface}` }}
              />
              <div className="pl-4">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block"
                  style={{ color: C.accent, background: `${C.accent}18`, border: `1px solid ${C.accent}30` }}
                >
                  {m.date}
                </span>
                <p className="text-xs font-semibold mt-1" style={{ color: C.txt }}>{m.title}</p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: C.txt3 }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

// ─── CARD 8: Recent deliveries ────────────────────────────────────────────────
function RecentDeliveriesCard() {
  return (
    <CardShell>
      <CardTitle>Entregas recentes</CardTitle>
      <div className="px-4 py-3 space-y-2">
        {RECENT_DELIVERIES.map(d => (
          <div
            key={d.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}
          >
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${C.success}18` }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: C.success }}>
                <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: C.txt }}>{d.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.txt3 }}>{d.project} · {d.date}</p>
            </div>
            <button
              className="h-6 px-2.5 rounded-md text-[10px] font-semibold flex-shrink-0 transition-all"
              style={{ color: C.accent, background: `${C.accent}12`, border: `1px solid ${C.accent}30` }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${C.accent}22` }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${C.accent}12` }}
            >
              Ver demo
            </button>
          </div>
        ))}
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
}: {
  selected: Set<string>; onToggle: (id: string) => void
}) {
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

      {/* Center: project selector */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        <ProjectSelector selected={selected} onToggle={onToggle} />
      </div>

      {/* Right: date */}
      <div className="flex items-center gap-4 flex-shrink-0">
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
      <PortalHeader selected={selected} onToggle={toggleProject} />

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
              ? `Visualizando: ${singleProject?.name} — ${singleProject?.sprint}`
              : `Visão consolidada: ${selected.size} projetos selecionados`}
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
                <SprintDeliveriesCard projectFilter={selected} />
              </>
            )}
            {/* Card 3: Project count */}
            <ProjectCountCard count={PROJECTS.length} />
            {/* Card 4: Active sprint */}
            <ActiveSprintCard />
            {/* Card 5: Risks */}
            <RisksCard />
            {/* Card 6: Awaiting validation (action required) */}
            <ValidationCard />
            {/* Card 7: Published roadmap */}
            <RoadmapCard />
            {/* Card 8: Recent deliveries */}
            <RecentDeliveriesCard />
          </div>
        )}
      </div>
    </div>
  )
}
