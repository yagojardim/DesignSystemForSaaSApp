import { T } from '../components/ds/tokens'

interface Props { role: string; onBack: () => void }

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  PMO:      { label: 'PMO',      bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  PM:       { label: 'PM',       bg: 'rgba(125,146,255,0.15)', color: '#7d92ff' },
  'P.O':    { label: 'P.O',      bg: 'rgba(53,201,174,0.15)',  color: '#35c9ae' },
  SM:       { label: 'SM',       bg: 'rgba(230,178,60,0.15)',  color: '#e6b23c' },
  TechLead: { label: 'TechLead', bg: 'rgba(240,128,92,0.15)', color: '#f0805c' },
  Dev:      { label: 'Dev',      bg: 'rgba(56,189,248,0.15)', color: '#38bdf8' },
  'UX/UI':  { label: 'UX/UI',   bg: 'rgba(244,114,182,0.15)',color: '#f472b6' },
  QA:       { label: 'QA',       bg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
}

function normalizeRole(role: string): string {
  const map: Record<string, string> = {
    'PM': 'PM', 'P.O': 'P.O', 'PO': 'P.O',
    'PMO': 'PMO', 'SM': 'SM',
    'TechLead': 'TechLead', 'Dev': 'Dev',
    'UX/UI': 'UX/UI', 'QA': 'QA',
  }
  return map[role] ?? 'Dev'
}

// ── Shared primitives ──────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: T.bgSurface, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 130,
    }}>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? T.text1, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.bgSurface, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 16, ...style,
    }}>
      {children}
    </div>
  )
}

function StatusChip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
      color, background: bg, border: `1px solid ${color}40`,
    }}>{label}</span>
  )
}

function ProgressBar({ value, color = T.accent }: { value: number; color?: string }) {
  return (
    <div style={{ background: T.border, borderRadius: 4, height: 6, width: '100%' }}>
      <div style={{ background: color, borderRadius: 4, height: 6, width: `${value}%`, transition: 'width 0.3s' }} />
    </div>
  )
}

function MiniBarChart({ bars, color = T.accent }: { bars: number[]; color?: string }) {
  const max = Math.max(...bars, 1)
  return (
    <svg width="100%" height="60" viewBox={`0 0 ${bars.length * 28} 60`} preserveAspectRatio="none">
      {bars.map((v, i) => {
        const h = (v / max) * 48
        return (
          <rect
            key={i}
            x={i * 28 + 4} y={54 - h}
            width={20} height={h}
            rx={3} fill={color} opacity={0.7 + 0.3 * (i / bars.length)}
          />
        )
      })}
    </svg>
  )
}

function TableRow({ cols, widths }: { cols: React.ReactNode[]; widths?: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
      {cols.map((c, i) => (
        <div key={i} style={{ flex: widths ? undefined : 1, width: widths?.[i], minWidth: widths?.[i], fontSize: 12, color: T.text2 }}>
          {c}
        </div>
      ))}
    </div>
  )
}

// ── PMO Dashboard ──────────────────────────────────────────────────────────

function PMODashboard() {
  const projects = [
    { name: 'Website Relaunch', health: '🟢', sprint: 'Sprint 14', progress: 72, issues: 4 },
    { name: 'Infra & Eng',      health: '🟡', sprint: 'Sprint 11', progress: 45, issues: 9 },
    { name: 'Pesquisa',         health: '🟠', sprint: 'Sprint 7',  progress: 28, issues: 7 },
  ]
  const blockers = [
    { id: 'PM-142', desc: 'Integração pagamento bloqueada', owner: 'Carlos', days: 3 },
    { id: 'PM-115', desc: 'Deploy infra pendente aprovação', owner: 'Ana',    days: 5 },
    { id: 'PM-099', desc: 'Entrevistas usuário sem resposta', owner: 'Bia',   days: 8 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px 0' }}>Portfólio de Projetos</h1>
        <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Visão executiva · 3 projetos ativos</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total projetos" value={8} />
        <KpiCard label="Issues abertas" value={47} color={T.warn} />
        <KpiCard label="Velocity médio" value="21 pts" color={T.accent} />
        <KpiCard label="Budget gasto" value="68%" color={T.crit} sub="do planejado" />
      </div>

      {/* Project health table */}
      <Card>
        <SectionTitle>Saúde dos projetos</SectionTitle>
        <TableRow cols={['Projeto', 'Sprint atual', 'Progresso', 'Issues', 'Saúde']} widths={['160px', '100px', '1', '60px', '60px']} />
        {projects.map(p => (
          <TableRow key={p.name} cols={[
            <span style={{ color: T.text1, fontWeight: 500 }}>{p.name}</span>,
            <span style={{ color: T.text3 }}>{p.sprint}</span>,
            <div style={{ minWidth: 80 }}><ProgressBar value={p.progress} color={p.progress > 60 ? T.success : p.progress > 35 ? T.warn : T.crit} /></div>,
            <span>{p.issues}</span>,
            <span>{p.health}</span>,
          ]} widths={['160px', '100px', '1', '60px', '60px']} />
        ))}
      </Card>

      {/* Velocity chart */}
      <Card>
        <SectionTitle>Velocity — últimas 6 sprints</SectionTitle>
        <MiniBarChart bars={[18, 22, 19, 25, 21, 23]} color={T.accent} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {['S9','S10','S11','S12','S13','S14'].map(s => (
            <span key={s} style={{ fontSize: 10, color: T.text3, flex: 1, textAlign: 'center' }}>{s}</span>
          ))}
        </div>
      </Card>

      {/* Blockers */}
      <Card>
        <SectionTitle>Impedimentos críticos</SectionTitle>
        {blockers.map(b => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.crit, minWidth: 60 }}>{b.id}</span>
            <span style={{ flex: 1, fontSize: 12, color: T.text2 }}>{b.desc}</span>
            <span style={{ fontSize: 11, color: T.text3 }}>{b.owner}</span>
            <span style={{ fontSize: 11, color: T.crit }}>{b.days}d</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── PM / P.O Dashboard ─────────────────────────────────────────────────────

function PMDashboard() {
  const epics = [
    { key: 'EP-01', label: 'Autenticação SSO', color: '#7d92ff', progress: 85 },
    { key: 'EP-02', label: 'Billing v2',       color: '#e6b23c', progress: 52 },
    { key: 'EP-03', label: 'Mobile App',       color: '#a78bfa', progress: 30 },
  ]
  const backlog = [
    { key: 'PM-148', title: 'Tela de onboarding',     priority: T.accent,   est: '3', status: 'Refinado' },
    { key: 'PM-147', title: 'Relatório exportar CSV', priority: T.warn,    est: '2', status: 'Novo' },
    { key: 'PM-145', title: 'Integração Slack',       priority: T.crit,   est: '5', status: 'Bloqueado' },
    { key: 'PM-144', title: 'Dark mode toggle',       priority: T.success, est: '1', status: 'Refinado' },
    { key: 'PM-140', title: 'Notificações push',      priority: T.text3,   est: '3', status: 'Novo' },
  ]
  const deliveries = [
    { title: 'Beta público', due: '08 ago 2025' },
    { title: 'Billing GA',   due: '22 ago 2025' },
    { title: 'Mobile alpha', due: '05 set 2025' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px 0' }}>Meu Produto</h1>
        <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Sprint 14 · 13 dias restantes</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Em andamento" value={7}  color={T.accent} />
        <KpiCard label="Done esta sprint" value="4/16" color={T.success} />
        <KpiCard label="Bugs abertos" value={2} color={T.crit} />
      </div>

      {/* Roadmap */}
      <Card>
        <SectionTitle>Roadmap de épicos</SectionTitle>
        {epics.map(e => (
          <div key={e.key} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: e.color, fontWeight: 500 }}>{e.key} — {e.label}</span>
              <span style={{ fontSize: 11, color: T.text3 }}>{e.progress}%</span>
            </div>
            <ProgressBar value={e.progress} color={e.color} />
          </div>
        ))}
      </Card>

      {/* Backlog top 5 */}
      <Card>
        <SectionTitle>Top 5 Backlog</SectionTitle>
        <TableRow cols={['Key', 'Título', 'Prio', 'Est', 'Status']} widths={['70px','1','30px','40px','90px']} />
        {backlog.map(b => (
          <TableRow key={b.key} cols={[
            <span style={{ color: T.accent, fontWeight: 500 }}>{b.key}</span>,
            <span style={{ color: T.text1 }}>{b.title}</span>,
            <span style={{ fontSize: 14 }}>●</span>,
            <span style={{ color: T.text3 }}>{b.est}h</span>,
            <StatusChip label={b.status}
              color={b.status === 'Bloqueado' ? T.crit : b.status === 'Refinado' ? T.success : T.text3}
              bg={b.status === 'Bloqueado' ? T.critDim : b.status === 'Refinado' ? T.successDim : T.bgSurface2}
            />,
          ]} widths={['70px','1','30px','40px','90px']} />
        ))}
      </Card>

      {/* Próximas entregas */}
      <Card>
        <SectionTitle>Próximas entregas</SectionTitle>
        {deliveries.map(d => (
          <div key={d.title} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
            <span style={{ color: T.text1 }}>{d.title}</span>
            <span style={{ color: T.text3 }}>{d.due}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── TechLead / Dev Dashboard ───────────────────────────────────────────────

function DevDashboard() {
  const cols = [
    { label: 'Backlog', color: T.text3,   items: ['PM-148', 'PM-147'] },
    { label: 'Em Dev',  color: T.accent,  items: ['PM-142', 'PM-139'] },
    { label: 'Review',  color: T.warn,    items: ['PM-135'] },
    { label: 'Done',    color: T.success, items: ['PM-130'] },
  ]
  const prs = [
    { key: 'PM-103', title: 'feat: auth SSO integration',   status: 'Open',   color: T.success },
    { key: 'PM-107', title: 'fix: billing edge-case crash', status: 'Merged', color: T.accent },
    { key: 'PM-104', title: 'wip: mobile nav refactor',     status: 'Draft',  color: T.text3 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px 0' }}>Minhas Tarefas</h1>
        <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Sprint 14 · Board pessoal</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Atribuídas a mim" value={5} />
        <KpiCard label="Em andamento" value={2} color={T.accent} />
        <KpiCard label="Em revisão" value={1} color={T.warn} />
        <KpiCard label="Concluídas hoje" value={1} color={T.success} />
      </div>

      {/* Mini board */}
      <Card>
        <SectionTitle>Meu board</SectionTitle>
        <div style={{ display: 'flex', gap: 12 }}>
          {cols.map(c => (
            <div key={c.label} style={{ flex: 1, background: T.bgSurface2, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginBottom: 8 }}>{c.label}</div>
              {c.items.map(i => (
                <div key={i} style={{
                  background: T.bgSurface, border: `1px solid ${T.border}`,
                  borderRadius: 6, padding: '6px 8px', marginBottom: 4,
                  fontSize: 11, color: T.text2,
                }}>
                  {i}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* PRs */}
      <Card>
        <SectionTitle>Pull Requests</SectionTitle>
        {prs.map(pr => (
          <div key={pr.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, color: T.accent, minWidth: 60 }}>{pr.key}</span>
            <span style={{ flex: 1, fontSize: 12, color: T.text2 }}>{pr.title}</span>
            <StatusChip label={pr.status} color={pr.color} bg={`${pr.color}20`} />
          </div>
        ))}
      </Card>

      {/* Alert */}
      <div style={{
        background: T.critDim, border: `1px solid ${T.crit}40`,
        borderRadius: 10, padding: 14,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.crit, marginBottom: 4 }}>🚨 Alerta de bloqueio</div>
        <div style={{ fontSize: 12, color: T.text2 }}>
          <strong style={{ color: T.crit }}>PM-102</strong> — Dependência externa sem resposta há 3 dias. Escale para o PM.
        </div>
      </div>
    </div>
  )
}

// ── UX/UI Dashboard ────────────────────────────────────────────────────────

function UXDashboard() {
  const handoffs = [
    { key: 'PM-101', title: 'Tela de checkout redesign', status: 'Aguardando Dev' },
    { key: 'PM-107', title: 'Componentes de notificação', status: 'Aguardando Dev' },
  ]
  const figmaLinks = [
    { title: 'Website Relaunch — Design System', url: 'figma.com/file/abc123' },
    { title: 'Mobile App — Flows & Screens',     url: 'figma.com/file/xyz456' },
  ]
  const boardCols = [
    { label: 'Exploração', color: T.purple,  items: ['PM-150', 'PM-149'] },
    { label: 'Spec',       color: T.accent,  items: ['PM-148', 'PM-145'] },
    { label: 'Aprovado',   color: T.success, items: ['PM-143'] },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px 0' }}>Design Board</h1>
        <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Issues de Design · filtradas</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Issues Design" value={6} color={T.purple} />
        <KpiCard label="Aguardando feedback" value={2} color={T.warn} />
        <KpiCard label="Aprovadas hoje" value={1} color={T.success} />
      </div>

      {/* Mini board */}
      <Card>
        <SectionTitle>Board design</SectionTitle>
        <div style={{ display: 'flex', gap: 12 }}>
          {boardCols.map(c => (
            <div key={c.label} style={{ flex: 1, background: T.bgSurface2, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginBottom: 8 }}>{c.label}</div>
              {c.items.map(i => (
                <div key={i} style={{
                  background: T.bgSurface, border: `1px solid ${T.border}`,
                  borderRadius: 6, padding: '6px 8px', marginBottom: 4,
                  fontSize: 11, color: T.text2,
                }}>{i}</div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Handoffs */}
      <Card>
        <SectionTitle>Handoffs pendentes para Dev</SectionTitle>
        {handoffs.map(h => (
          <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, color: T.accent, minWidth: 60 }}>{h.key}</span>
            <span style={{ flex: 1, fontSize: 12, color: T.text2 }}>{h.title}</span>
            <StatusChip label={h.status} color={T.warn} bg={T.warnDim} />
          </div>
        ))}
      </Card>

      {/* Figma links */}
      <Card>
        <SectionTitle>Figma links do projeto</SectionTitle>
        {figmaLinks.map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <svg width="14" height="14" viewBox="0 0 38 57" fill="none">
              <rect width="19" height="19" rx="9.5" fill="#F24E1E"/>
              <rect y="19" width="19" height="19" rx="9.5" fill="#FF7262"/>
              <rect y="38" width="19" height="19" rx="9.5" fill="#1ABCFE"/>
              <rect x="19" y="19" width="19" height="19" rx="9.5" fill="#0ACF83"/>
              <circle cx="28.5" cy="28.5" r="9.5" fill="#A259FF"/>
            </svg>
            <div>
              <div style={{ fontSize: 12, color: T.text1 }}>{f.title}</div>
              <div style={{ fontSize: 10, color: T.text3 }}>{f.url}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── QA Dashboard ───────────────────────────────────────────────────────────

function QADashboard() {
  const bugs = [
    { key: 'PM-102', title: 'Crash no checkout iOS',        sev: 'Crítico', sevColor: T.crit,   sevDim: T.critDim,   days: 3, assignee: 'Carlos' },
    { key: 'PM-105', title: 'Campo email aceita espaços',   sev: 'Médio',   sevColor: T.warn,   sevDim: T.warnDim,   days: 1, assignee: 'Ana' },
  ]
  const testRuns = [
    { name: 'Smoke Suite — Sprint 14',    status: '✅', result: 'Passou 42/42' },
    { name: 'Regressão — Auth flow',      status: '❌', result: 'Falhou 3/28' },
    { name: 'E2E — Checkout',            status: '⏳', result: 'Em execução…' },
  ]
  const readyQueue = [
    { key: 'PM-144', title: 'Dark mode toggle',  from: 'Review' },
    { key: 'PM-139', title: 'Filtro de projetos', from: 'Review' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px 0' }}>Fila de Testes & Bugs</h1>
        <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Sprint 14 · QA dashboard</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Em teste" value={3} color={T.accent} />
        <KpiCard label="Bugs abertos" value={2} color={T.crit} sub="1 crítico" />
        <KpiCard label="Passou hoje" value={2} color={T.success} />
        <KpiCard label="Cobertura" value="74%" color={T.warn} />
      </div>

      {/* Bug table */}
      <Card>
        <SectionTitle>Tabela de bugs</SectionTitle>
        <TableRow cols={['Key', 'Título', 'Severidade', 'Dias', 'Assignee']} widths={['70px','1','90px','50px','80px']} />
        {bugs.map(b => (
          <TableRow key={b.key} cols={[
            <span style={{ color: T.crit, fontWeight: 600 }}>{b.key}</span>,
            <span style={{ color: T.text1 }}>{b.title}</span>,
            <StatusChip label={b.sev} color={b.sevColor} bg={b.sevDim} />,
            <span style={{ color: T.text3 }}>{b.days}d</span>,
            <span style={{ color: T.text2 }}>{b.assignee}</span>,
          ]} widths={['70px','1','90px','50px','80px']} />
        ))}
      </Card>

      {/* Test runs */}
      <Card>
        <SectionTitle>Test runs recentes</SectionTitle>
        {testRuns.map(t => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 16 }}>{t.status}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.text1 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: T.text3 }}>{t.result}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Ready queue */}
      <Card>
        <SectionTitle>Pronto para testar</SectionTitle>
        {readyQueue.map(q => (
          <div key={q.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, color: T.accent, minWidth: 60 }}>{q.key}</span>
            <span style={{ flex: 1, fontSize: 12, color: T.text2 }}>{q.title}</span>
            <StatusChip label={`← ${q.from}`} color={T.success} bg={T.successDim} />
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── SM Dashboard (fallback for SM role) ───────────────────────────────────

function SMDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px 0' }}>Scrum Master Board</h1>
        <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Sprint 14 · Cerimônias & Impedimentos</p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Impedimentos" value={2} color={T.crit} />
        <KpiCard label="Velocity sprint" value="21 pts" color={T.accent} />
        <KpiCard label="Dias restantes" value={13} color={T.warn} />
      </div>
      <Card>
        <SectionTitle>Impedimentos ativos</SectionTitle>
        {[
          { id: 'PM-142', desc: 'Integração pagamento bloqueada', days: 3 },
          { id: 'PM-115', desc: 'Deploy infra pendente aprovação', days: 5 },
        ].map(b => (
          <div key={b.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
            <span style={{ color: T.crit, fontWeight: 600, minWidth: 60 }}>{b.id}</span>
            <span style={{ flex: 1, color: T.text2 }}>{b.desc}</span>
            <span style={{ color: T.crit }}>{b.days}d</span>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>Próximas cerimônias</SectionTitle>
        {[
          { name: 'Daily Standup', date: 'Amanhã 09:00' },
          { name: 'Sprint Review', date: '08 ago 10:00' },
          { name: 'Retrospectiva', date: '08 ago 11:30' },
        ].map(c => (
          <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
            <span style={{ color: T.text1 }}>{c.name}</span>
            <span style={{ color: T.text3 }}>{c.date}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── TopBar ─────────────────────────────────────────────────────────────────

function TopBar({ role, onBack }: { role: string; onBack: () => void }) {
  const normalized = normalizeRole(role)
  const meta = ROLE_META[normalized] ?? ROLE_META['Dev']
  return (
    <div style={{
      height: 48, background: T.bgSurface,
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12, flexShrink: 0,
    }}>
      {/* Left */}
      <span style={{
        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
        background: meta.bg, color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}>{normalized}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>Altech Project</span>
      <span style={{ fontSize: 12, color: T.text3 }}>/ Dashboard</span>

      <div style={{ flex: 1 }} />

      {/* Right */}
      <button style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
      <button style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 4 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: T.accentDim, border: `1px solid ${T.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: T.accent,
      }}>AL</div>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: `1px solid ${T.border}`,
          borderRadius: 6, padding: '4px 10px',
          fontSize: 12, color: T.text2, cursor: 'pointer',
        }}
      >
        ← Voltar ao login
      </button>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function RoleDashboard({ role, onBack }: Props) {
  const normalized = normalizeRole(role)

  let content: React.ReactNode
  if (normalized === 'PMO') {
    content = <PMODashboard />
  } else if (normalized === 'PM' || normalized === 'P.O') {
    content = <PMDashboard />
  } else if (normalized === 'TechLead' || normalized === 'Dev') {
    content = <DevDashboard />
  } else if (normalized === 'UX/UI') {
    content = <UXDashboard />
  } else if (normalized === 'QA') {
    content = <QADashboard />
  } else if (normalized === 'SM') {
    content = <SMDashboard />
  } else {
    content = <DevDashboard />
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw', overflow: 'hidden',
      background: T.bgPage,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <TopBar role={role} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {content}
        </div>
      </div>
    </div>
  )
}
