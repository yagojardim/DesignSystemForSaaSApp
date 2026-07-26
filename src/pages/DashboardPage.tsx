import { Avatar } from '../components/ds/Avatar'

// ─── Dark-safe color helpers ─────────────────────────────────────────────────
const STATUS = {
  healthy:  { color: '#06C18A', tint: 'rgba(6,193,138,0.12)',  border: 'rgba(6,193,138,0.3)',  label: 'Saudável' },
  'at-risk':{ color: '#F5A524', tint: 'rgba(245,165,36,0.12)', border: 'rgba(245,165,36,0.3)', label: 'Em risco' },
  blocked:  { color: '#F0455A', tint: 'rgba(240,69,90,0.12)',  border: 'rgba(240,69,90,0.3)',  label: 'Bloqueado' },
}

const DELIVERY_STATUS = {
  'in-progress': { color: '#4d82ff', tint: 'rgba(77,130,255,0.12)', label: 'Em andamento' },
  'in-review':   { color: '#F5A524', tint: 'rgba(245,165,36,0.12)', label: 'Em revisão' },
  done:          { color: '#06C18A', tint: 'rgba(6,193,138,0.12)',  label: 'Concluído' },
  blocked:       { color: '#F0455A', tint: 'rgba(240,69,90,0.12)',  label: 'Bloqueado' },
  backlog:       { color: '#546278', tint: 'rgba(84,98,120,0.15)',  label: 'Backlog' },
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const healthProjects = [
  { name: 'Payments API v3',       squad: 'squad-payments', status: 'healthy'  as const, reason: 'No prazo — 3 dias adiantado',          progress: 72, daysLeft: 7 },
  { name: 'Mobile App Rebrand',    squad: 'squad-mobile',   status: 'at-risk'  as const, reason: 'Sign-off do design atrasado 4 dias',   progress: 48, daysLeft: 3 },
  { name: 'Data Pipeline Migration', squad: 'squad-data',   status: 'blocked'  as const, reason: 'Aguardando credenciais de infra',       progress: 31, daysLeft: -1 },
]

const blockers = [
  { id: 'PM-142', title: 'Credenciais de produção ausentes (OAuth2)',  owner: 'Rafael Mendes',  days: 3, level: 'blocked'  as const },
  { id: 'PM-089', title: 'Aprovação legal do contrato de API externa', owner: 'Juliana Neves',  days: 5, level: 'blocked'  as const },
  { id: 'PM-201', title: 'Sign-off do design da tela de onboarding',   owner: 'Carla Souza',    days: 2, level: 'at-risk'  as const },
  { id: 'PM-178', title: 'Acesso ao ambiente de staging negado',        owner: 'Lucas Ferreira', days: 1, level: 'at-risk'  as const },
]

const deliveries = [
  { title: 'Fluxo de autenticação OAuth2',       due: '24 jul', assignee: 'Ana Lima',       status: 'in-progress' as const },
  { title: 'API de métricas executivas',          due: '25 jul', assignee: 'Lucas Ferreira', status: 'in-review'   as const },
  { title: 'Componentes do design system (v1)',   due: '26 jul', assignee: 'Carla Souza',    status: 'done'        as const },
  { title: 'Gateway de pagamento — fallback',     due: '28 jul', assignee: 'Rafael Mendes',  status: 'blocked'     as const },
  { title: 'Dashboard do cliente (read-only)',    due: '28 jul', assignee: 'Beatriz Costa',  status: 'backlog'     as const },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pill({ children, color, tint, border }: { children: React.ReactNode; color: string; tint: string; border: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ color, background: tint, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  )
}

function StatusDot({ color }: { color: string }) {
  return <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
}

function HealthCard({ p }: { p: typeof healthProjects[0] }) {
  const s = STATUS[p.status]
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl"
      style={{
        background: 'var(--bg-surface, #111d33)',
        border: `1px solid var(--border-subtle, #1c2c45)`,
        borderLeft: `3px solid ${s.color}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono mb-1" style={{ color: 'var(--text-muted, #546278)' }}>{p.squad}</p>
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-primary, #e8ecf4)' }}>{p.name}</p>
        </div>
        <Pill color={s.color} tint={s.tint} border={s.border}>
          <StatusDot color={s.color} />
          {s.label}
        </Pill>
      </div>
      {/* Reason chip */}
      <p
        className="text-xs px-3 py-1.5 rounded-lg"
        style={{ color: s.color, background: s.tint, border: `1px solid ${s.border}` }}
      >
        {p.reason}
      </p>
      {/* Progress */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-muted, #546278)' }}>Progresso</span>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary, #8a9ab8)' }}>{p.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle, #1c2c45)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${p.progress}%`, background: s.color }} />
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: 'var(--text-muted, #546278)' }}>
          {p.daysLeft > 0 ? `${p.daysLeft} dias restantes` : `${Math.abs(p.daysLeft)} dia(s) atrasado`}
        </span>
        <button
          className="text-xs transition-colors"
          style={{ color: 'var(--primary, #4d82ff)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        >
          Ver projeto →
        </button>
      </div>
    </div>
  )
}

function Sparkline() {
  const points = [12, 18, 22, 31, 38, 45, 52, 67]
  const max = Math.max(...points)
  const W = 140, H = 40
  const coords = points.map((v, i) => [((i / (points.length - 1)) * W).toFixed(1), (H - (v / max) * H).toFixed(1)])
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  const areaPath = `${linePath}L${W},${H}L0,${H}Z`
  const [lx, ly] = coords[coords.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <defs>
        <linearGradient id="spark-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d82ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4d82ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-g)" />
      <path d={linePath} stroke="#4d82ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill="#4d82ff" />
      <circle cx={lx} cy={ly} r="5.5" fill="#4d82ff" fillOpacity="0.2" />
    </svg>
  )
}

function DonutChart({ pct }: { pct: number }) {
  const r = 28, cx = 36, cy = 36, sw = 7
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#4d82ff" strokeWidth={sw}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="700" fill="#e8ecf4">{pct}%</text>
      <text x="50%" y="63%" dominantBaseline="middle" textAnchor="middle" fontSize="7" fill="#546278">done</text>
    </svg>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface, #111d33)', border: '1px solid var(--border-subtle, #1c2c45)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle, #1c2c45)' }}
      >
        {title}
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div
      className="p-5 space-y-5 overflow-y-auto h-full"
      style={{ maxWidth: 1280, margin: '0 auto' }}
    >
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary, #e8ecf4)' }}>
            Dashboard executivo
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted, #546278)' }}>
            Visão geral de saúde · Sprint 14 · 21–28 jul 2025
          </p>
        </div>
        <span
          className="text-[11px] font-medium px-3 py-1 rounded-full"
          style={{ color: '#06C18A', background: 'rgba(6,193,138,0.12)', border: '1px solid rgba(6,193,138,0.25)' }}
        >
          ● Atualizado há 12 min
        </span>
      </div>

      {/* 1. Health row */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted, #546278)' }}>
          Saúde dos projetos
        </p>
        <div className="grid grid-cols-3 gap-3">
          {healthProjects.map(p => <HealthCard key={p.name} p={p} />)}
        </div>
      </div>

      {/* 2. Main grid: 2/3 + 1/3 */}
      <div className="grid grid-cols-3 gap-4">

        {/* Left col: progress + blockers */}
        <div className="col-span-2 space-y-4">

          {/* Progress metric */}
          <Section
            title={
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary, #e8ecf4)' }}>Progresso geral — Q3</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: '#06C18A', background: 'rgba(6,193,138,0.12)' }}
                >
                  ↑ No prazo
                </span>
              </div>
            }
          >
            <div className="px-5 py-4 flex items-center gap-8">
              {/* Big metric */}
              <div className="flex-shrink-0 text-center">
                <p className="text-5xl font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary, #e8ecf4)' }}>67%</p>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted, #546278)' }}>124 / 185 tarefas</p>
              </div>

              {/* Progress chart */}
              <div className="flex-1 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle, #1c2c45)' }}>
                    <div className="h-full rounded-full" style={{ width: '67%', background: 'var(--primary, #4d82ff)' }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {['Sprint 11', 'Sprint 12', 'Sprint 13', 'Sprint 14 ←'].map((s, i) => (
                      <span
                        key={s}
                        className="text-[10px]"
                        style={{ color: i === 3 ? 'var(--primary, #4d82ff)' : 'var(--text-muted, #546278)', fontWeight: i === 3 ? 600 : 400 }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sparkline + label */}
                <div className="flex items-end justify-between pt-1" style={{ borderTop: '1px solid var(--border-subtle, #1c2c45)' }}>
                  <div>
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted, #546278)' }}>Curva de entrega (últ. 8 sprints)</p>
                    <Sparkline />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px]" style={{ color: 'var(--text-muted, #546278)' }}>Velocidade média</p>
                    <p className="text-sm font-bold" style={{ color: '#06C18A' }}>8.4 pts/sprint</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Blockers */}
          <Section
            title={
              <div className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(240,69,90,0.15)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 3.5v3M5.5 8v.5" stroke="#F0455A" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="5.5" cy="5.5" r="4.5" stroke="#F0455A" strokeWidth="1" />
                  </svg>
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary, #e8ecf4)' }}>
                  Impedimentos & bloqueios ativos
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#F0455A', background: 'rgba(240,69,90,0.15)' }}
                >
                  {blockers.length}
                </span>
              </div>
            }
            action={
              <button className="text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--primary, #4d82ff)' }}>
                Ver todos
              </button>
            }
          >
            <div>
              {blockers.map((b, i) => {
                const isBlocked = b.level === 'blocked'
                const dotColor = isBlocked ? '#F0455A' : '#F5A524'
                const chipColor = isBlocked ? '#F0455A' : '#F5A524'
                const chipBg = isBlocked ? 'rgba(240,69,90,0.12)' : 'rgba(245,165,36,0.12)'
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      borderBottom: i < blockers.length - 1 ? '1px solid var(--border-subtle, #1c2c45)' : 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    {/* Status dot */}
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ color: dotColor, background: chipBg, border: `1px solid ${dotColor}33` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                      {isBlocked ? 'Bloqueado' : 'Em risco'}
                    </span>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted, #546278)' }}>{b.id}</span>
                        <span className="text-sm truncate" style={{ color: 'var(--text-primary, #e8ecf4)' }}>{b.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={b.owner} size="xs" />
                        <span className="text-xs" style={{ color: 'var(--text-secondary, #8a9ab8)' }}>{b.owner}</span>
                      </div>
                    </div>

                    {/* Days chip */}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ color: chipColor, background: chipBg }}
                    >
                      {b.days}d bloqueado
                    </span>
                  </div>
                )
              })}
            </div>
          </Section>
        </div>

        {/* Right col: sprint */}
        <div>
          <Section
            title={
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #e8ecf4)' }}>Sprint 14</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted, #546278)' }}>Termina em 28 jul</p>
                </div>
                <DonutChart pct={72} />
              </div>
            }
          >
            <div
              className="px-4 py-2"
              style={{ borderBottom: '1px solid var(--border-subtle, #1c2c45)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted, #546278)' }}>
                Entregas imediatas
              </p>
            </div>
            {deliveries.map((d, i) => {
              const st = DELIVERY_STATUS[d.status]
              return (
                <div
                  key={d.title}
                  className="flex items-center gap-2.5 px-4 py-3 transition-colors"
                  style={{ borderBottom: i < deliveries.length - 1 ? '1px solid var(--border-subtle, #1c2c45)' : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <Avatar name={d.assignee} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium" style={{ color: 'var(--text-primary, #e8ecf4)' }}>{d.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted, #546278)' }}>
                      {d.assignee.split(' ')[0]} · {d.due}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ color: st.color, background: st.tint }}
                  >
                    {st.label}
                  </span>
                </div>
              )
            })}
          </Section>
        </div>
      </div>
    </div>
  )
}
