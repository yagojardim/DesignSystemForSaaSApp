import { useState, useEffect, type ReactNode } from 'react'
import { T } from '../components/ds/tokens'
import {
  KpiCard, RagCard, ProgressCard, WorkQueue, SprintDonutCard,
  WorkItemDetailDrawer, FilterBar, DashboardSwitcher,
  SCard, ProgressBar, StatusBadge, ConditionalTag, Av,
  AuditFeed, ActivityTimeline, EmptyState, LoadingState,
  type WorkItem, type FilterState, type RagStatus,
} from '../components/ds/DashboardKit'
import {
  MOCK_TENANT, MOCK_USERS, getActiveScope, getActiveUser, setActiveUser,
  DASHBOARD_CATALOG, type UserScope, type DashboardType,
} from '../data/session'
import {
  WORK_ITEMS, getBlockedItems, getSprintItems, getReadyItems,
  getTestingItems, getBacklogWithAlerts,
} from '../data/workItems'

// ─── Shared hook: drawer + nav + filter state ─────────────────────────────────
function useDrawer() {
  const [drawerItem, setDrawerItem] = useState<WorkItem | null>(null)
  return { drawerItem, openDrawer: setDrawerItem, closeDrawer: () => setDrawerItem(null) }
}

function useFilters(): [FilterState, (f: FilterState) => void] {
  return useState<FilterState>({ project_id: '', squad_id: '', sprint: '' })
}

function applyFilters(items: WorkItem[], f: FilterState): WorkItem[] {
  return items.filter(w =>
    (!f.project_id || w.project_id === f.project_id) &&
    (!f.squad_id   || w.squad_id   === f.squad_id) &&
    (!f.sprint     || w.sprint     === f.sprint)
  )
}

const PROJECTS = [
  { id: 'proj_001', name: 'Website Relaunch' },
  { id: 'proj_002', name: 'Infra Migration' },
]
const SQUADS = [
  { id: 'squad_growth',   name: 'Growth' },
  { id: 'squad_platform', name: 'Platform' },
  { id: 'squad_design',   name: 'Design' },
]
const SPRINTS = ['Sprint 14', 'Sprint 15']

// ─── Panel grid wrapper ───────────────────────────────────────────────────────
function Grid({ cols = '1fr 1fr', children }: { cols?: string; children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>
}
function ColSpan({ children }: { children: ReactNode }) {
  return <div style={{ gridColumn: '1 / -1' }}>{children}</div>
}

// ─── 1. ADMIN MASTER ─────────────────────────────────────────────────────────
function AdminPanel({ onNav, onInvite }: { onNav: (v: string) => void; onInvite?: () => void }) {
  const [filters, setFilters] = useFilters()

  const modules = [
    { name: 'Board & Sprint',   active: true,  users: 9 },
    { name: 'Relatórios',       active: true,  users: 5 },
    { name: 'Portfólio / PMO',  active: true,  users: 2 },
    { name: 'Analytics',        active: false, users: 0 },
    { name: 'Automações',       active: false, users: 0 },
    { name: 'Planning Poker',   active: false, users: 0 },
  ]
  const auditEntries = [
    { action: 'Senha resetada (temporária)',   user: 'João Prado',   by: 'Diana Costa', when: '2h atrás', icon: '🔑' },
    { action: 'Usuário bloqueado',             user: 'Lúcia Branco', by: 'Diana Costa', when: '3d atrás', icon: '🔒' },
    { action: 'Dashboard atribuído (PMO + Admin)', user: 'Carlos D.', by: 'Diana Costa', when: '5d atrás', icon: '📊' },
    { action: 'Convite enviado',               user: 'Pedro Luz',    by: 'Diana Costa', when: '1sem',     icon: '✉️' },
  ]
  const users = [
    { name: 'Carlos Drummond', role: 'PMO',            status: 'active',   i: 'CD', c: '#35c9ae' },
    { name: 'Mariana Souza',   role: 'Project Manager',status: 'active',   i: 'MS', c: '#f5a524' },
    { name: 'Felipe Nunes',    role: 'Product Manager', status: 'active',  i: 'FN', c: '#a78bfa' },
    { name: 'João Prado',      role: 'Dev',             status: 'blocked',  i: 'JP', c: '#EF4444' },
    { name: 'Lúcia Branco',    role: 'QA',              status: 'inactive', i: 'LB', c: '#60a5fa' },
  ]
  const statusC = { active: T.success, blocked: T.crit, inactive: T.neutral }

  return (
    <>
      <Grid cols="repeat(6,1fr)">
        <KpiCard value="11" label="Usuários" sub="9 ativos" onClick={() => onNav('config')} />
        <KpiCard value="3"  label="Projetos" sub="2 ativos" onClick={() => onNav('projects-list')} />
        <KpiCard value="5"  label="Boards"   sub="4 ativos" onClick={() => onNav('project')} />
        <KpiCard value="3"  label="Módulos ativos" sub="de 6" onClick={() => onNav('config')} />
        <KpiCard value="1"  label="Bloqueados" sub="João Prado" color={T.crit} alert onClick={() => onNav('config')} />
        <KpiCard value="2"  label="Convites" sub="expiram em 7d" color={T.warn} onClick={() => onNav('config')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="2fr 1fr">
        <SCard title="Gestão de Usuários" action={
          <button onClick={() => onNav('config')} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Ver todos →</button>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Av initials={u.i} color={u.c} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.text1 }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: T.text3 }}>{u.role}</div>
                </div>
                <span style={{ fontSize: 10, color: (statusC as Record<string,string>)[u.status], background: `${(statusC as Record<string,string>)[u.status]}18`, border: `1px solid ${(statusC as Record<string,string>)[u.status]}33`, borderRadius: 4, padding: '2px 7px' }}>
                  {u.status === 'active' ? 'Ativo' : u.status === 'blocked' ? 'Bloqueado' : 'Inativo'}
                </span>
                {u.status === 'blocked'
                  ? <button style={{ fontSize: 10, color: T.success, background: `${T.success}14`, border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Desbloquear</button>
                  : u.status === 'active'
                  ? <button style={{ fontSize: 10, color: T.warn, background: `${T.warn}14`, border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Bloquear</button>
                  : <button style={{ fontSize: 10, color: T.accent, background: `${T.accent}14`, border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Reativar</button>
                }
              </div>
            ))}
          </div>
          <button onClick={() => onInvite ? onInvite() : onNav('config')} style={{ marginTop: 12, width: '100%', fontSize: 11, color: T.accent, background: `${T.accent}12`, border: `1px solid ${T.accent}33`, borderRadius: 6, padding: '6px', cursor: 'pointer' }}>
            + Convidar usuário
          </button>
        </SCard>

        <SCard title="Módulos">
          {modules.map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: m.active ? T.success : T.border }} />
                <span style={{ fontSize: 12, color: m.active ? T.text1 : T.text3 }}>{m.name}</span>
              </div>
              {m.active
                ? <span style={{ fontSize: 10, color: T.text3 }}>{m.users} usuários</span>
                : <button style={{ fontSize: 10, color: T.indigo, background: `${T.indigo}14`, border: `1px solid ${T.indigo}33`, borderRadius: 4, padding: '1px 7px', cursor: 'pointer' }}>Solicitar</button>
              }
            </div>
          ))}
        </SCard>

        <ColSpan>
          <SCard title="Auditoria — Atividade Administrativa Recente">
            <AuditFeed entries={auditEntries} />
          </SCard>
        </ColSpan>
      </Grid>
    </>
  )
}

// ─── 2. PMO ───────────────────────────────────────────────────────────────────
function PmoPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer: openPmoDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const blocked = applyFilters(getBlockedItems(), filters)

  const rags: { name: string; squad: string; rag: RagStatus; pct: number; days: string; reason?: string }[] = [
    { name: 'Website Relaunch', squad: 'Growth',   rag: 'healthy', pct: 68, days: '42d restantes' },
    { name: 'ERP Corporativo',  squad: 'Platform', rag: 'risk',    pct: 41, days: '18d restantes', reason: 'Aprovação de design atrasada 4d' },
    { name: 'Infra Migration',  squad: 'Platform', rag: 'blocked', pct: 22, days: '5d restantes',  reason: 'Credenciais de prod ausentes' },
    { name: 'Mobile App v2',    squad: 'Growth',   rag: 'healthy', pct: 85, days: '60d restantes' },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="4"   label="Projetos Ativos"      sub="2 no prazo"   onClick={() => onNav('projects-list')} />
        <KpiCard value="2"   label="Em Risco / Atrasados" sub="1 crítico"    color={T.warn} alert onClick={() => onNav('reports')} />
        <KpiCard value="71%" label="Previsibilidade"      sub="meta: 80%"    onClick={() => onNav('reports')} />
        <KpiCard value="67%" label="Planejado × Concluído" sub="Q2 2025"    onClick={() => onNav('reports')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <SCard title="Saúde por Projeto (RAG)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rags.map(r => (
              <RagCard key={r.name} name={r.name} squad={r.squad} rag={r.rag} pct={r.pct} daysLabel={r.days} reason={r.reason} onClick={() => onNav('project')} />
            ))}
          </div>
        </SCard>

        <WorkQueue title="Bloqueadores Críticos" items={blocked} onOpen={openPmoDrawer}
          showDaysBlocked onViewAll={() => onNav('list')}
          emptyMsg="Nenhum bloqueador ativo. Boa sinal! 🟢" />

        <ColSpan>
          <ProgressCard pct={67} label="Ritmo de Entrega — Portfólio" velocity="Velocity média: 38pt/sprint" onClick={() => onNav('reports')} />
        </ColSpan>
      </Grid>
    </>
  )
}

// ─── 3. PROJECT MANAGER ───────────────────────────────────────────────────────
function ProjectManagerPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const sprint14 = applyFilters(getSprintItems('Sprint 14', 'proj_001'), filters)
  const blocked  = applyFilters(getBlockedItems('proj_001'), filters)

  const team = [
    { name: 'Ana Lima',     i: 'AL', c: '#fb923c', ativas: 4, cap: 5 },
    { name: 'Lucas F.',     i: 'LF', c: '#34d399', ativas: 6, cap: 5 },
    { name: 'Rafael M.',    i: 'RM', c: '#60a5fa', ativas: 2, cap: 5 },
    { name: 'Bruno S.',     i: 'BS', c: '#fbbf24', ativas: 3, cap: 5 },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="72%" label="Progresso do Projeto" sub="Sprint 14 ativo" onClick={() => onNav('reports')} />
        <KpiCard value="18d" label="Prazo Restante"       sub="Entrega: 28 ago" onClick={() => onNav('gantt')} />
        <KpiCard value="2"   label="Bloqueios Ativos"     sub="1 crítico" color={T.crit} alert onClick={() => onNav('list')} />
        <KpiCard value="+12%" label="Risco de Escopo"     sub="vs planejamento" color={T.warn} alert onClick={() => onNav('reports')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <RagCard name="Website Relaunch" squad="Growth · Sprint 14" rag="risk" pct={72} daysLabel="18d restantes" reason="Escopo +12% — replanejamento necessário" onClick={() => onNav('project')} />

        <ProgressCard pct={67} label="Planejado × Concluído" velocity="Sprint 14 — 38pt concluídos" onClick={() => onNav('reports')} />

        <SprintDonutCard sprintName="Sprint 14" done={28} total={38} items={sprint14} onOpen={openDrawer} onViewSprint={() => onNav('project')} />

        <WorkQueue title="Bloqueadores & Riscos" items={blocked} onOpen={openDrawer}
          showDaysBlocked onViewAll={() => onNav('list')}
          emptyMsg="Nenhum bloqueador ativo." />

        <ColSpan>
          <SCard title="Carga do Time">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {team.map(m => (
                <div key={m.name} style={{ background: T.bgPage, borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Av initials={m.i} color={m.c} size={22} />
                    <span style={{ fontSize: 11, color: T.text1 }}>{m.name}</span>
                  </div>
                  <ProgressBar pct={(m.ativas / m.cap) * 100} color={m.ativas > m.cap ? T.crit : T.accent} />
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>{m.ativas}/{m.cap} issues</div>
                  {m.ativas > m.cap && <ConditionalTag label="Sobrecarga" severity="crit" />}
                </div>
              ))}
            </div>
          </SCard>
        </ColSpan>
      </Grid>
    </>
  )
}

// ─── 4. PRODUCT MANAGER ──────────────────────────────────────────────────────
function ProductManagerPanel({ onNav }: { onNav: (v: string) => void }) {
  const [filters, setFilters] = useFilters()

  const funnel = [
    { stage: 'Visitantes',   value: 12400, pct: 100 },
    { stage: 'Cadastros',    value: 3100,  pct: 25  },
    { stage: 'Ativação',     value: 1860,  pct: 60  },
    { stage: 'Engajamento',  value: 930,   pct: 50  },
    { stage: 'Retenção D30', value: 560,   pct: 60  },
  ]
  const features = [
    { name: 'Board Kanban',   adocao: 84 },
    { name: 'Relatórios',     adocao: 52 },
    { name: 'Portal Cliente', adocao: 31 },
    { name: 'Automações',     adocao: 12 },
  ]
  const roadmap = [
    { epic: 'Portal do Cliente v2', quarter: 'Q3 2025', status: 'Em andamento', valor: 'Reduz suporte 40%' },
    { epic: 'Analytics Avançado',   quarter: 'Q3 2025', status: 'Planejado',    valor: 'Upsell + retenção' },
    { epic: 'Automações',           quarter: 'Q4 2025', status: 'Planejado',    valor: 'Eficiência do time' },
  ]

  return (
    <>
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="930"  label="MAU"              sub="+8% vs mês ant." color={T.success} onClick={() => onNav('reports')} />
        <KpiCard value="7.5%" label="Stickiness"       sub="DAU/MAU — meta 10-20%" color={T.warn} onClick={() => onNav('reports')} />
        <KpiCard value="3.2%" label="Churn Rate"       sub="meta: &lt;2%" color={T.crit} alert onClick={() => onNav('reports')} />
        <KpiCard value="52%"  label="Adoção de Features" sub="base elegível" onClick={() => onNav('reports')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <SCard title="Funil de Conversão / Ativação">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnel.map((f, i) => (
              <div key={f.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.text2 }}>{f.stage}</span>
                  <span style={{ fontSize: 11, color: T.text1 }}>{f.value.toLocaleString('pt-BR')}</span>
                </div>
                <ProgressBar pct={i === 0 ? 100 : (f.value / funnel[0].value) * 100} color={T.accent} />
              </div>
            ))}
          </div>
        </SCard>

        <SCard title="Adoção de Features (base elegível)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map(f => (
              <div key={f.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.text1 }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: f.adocao >= 60 ? T.success : f.adocao >= 30 ? T.warn : T.crit }}>{f.adocao}%</span>
                </div>
                <ProgressBar pct={f.adocao} color={f.adocao >= 60 ? T.success : f.adocao >= 30 ? T.accent : T.crit} />
              </div>
            ))}
          </div>
        </SCard>

        <ColSpan>
          <SCard title="Roadmap Estratégico">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {roadmap.map(r => (
                <div key={r.epic} style={{ background: T.bgPage, borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }} onClick={() => onNav('epics')}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{r.epic}</div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{r.quarter}</div>
                  <div style={{ marginTop: 8 }}>
                    <ConditionalTag label={r.status} severity={r.status === 'Em andamento' ? 'info' : 'neutral'} />
                  </div>
                  <div style={{ fontSize: 10, color: T.success, marginTop: 8 }}>↑ {r.valor}</div>
                </div>
              ))}
            </div>
          </SCard>
        </ColSpan>
      </Grid>
    </>
  )
}

// ─── 5. PRODUCT OWNER ────────────────────────────────────────────────────────
function ProductOwnerPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const alertItems = applyFilters(getBacklogWithAlerts('proj_001'), filters)
  const readyItems = applyFilters(getReadyItems('proj_001'), filters)

  const team = [
    { name: 'Ana Lima',  i: 'AL', c: '#fb923c', items: 4, status: 'saudável' as const },
    { name: 'Lucas F.',  i: 'LF', c: '#34d399', items: 6, status: 'crítico'  as const },
    { name: 'Bruno S.',  i: 'BS', c: '#fbbf24', items: 3, status: 'atenção'  as const },
    { name: '—',         i: '?',  c: '#555',    items: 2, status: 'sem-resp' as const },
  ]
  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="62%" label="Cobertura Ready" sub="pts prontos ÷ velocity" onClick={() => onNav('list')} />
        <KpiCard value="54%" label="Saúde do Backlog" sub="itens saudáveis ÷ avaliáveis" color={T.warn} alert onClick={() => onNav('list')} />
        <KpiCard value="68%" label="Progresso Funcional" sub="considera aceite do PO" onClick={() => onNav('reports')} />
        <KpiCard value="4"   label="Bugs Funcionais" sub="aguardando PO" color={T.crit} alert onClick={() => onNav('list')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <WorkQueue title="Backlog com Alertas" items={alertItems} onOpen={openDrawer}
          onViewAll={() => onNav('navigator')}
          emptyMsg="Backlog saudável — nenhum alerta crítico." />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WorkQueue title="Ready para Próxima Sprint" items={readyItems} onOpen={openDrawer}
            onViewAll={() => onNav('list')} maxItems={4}
            emptyMsg="Nenhum item ready. Refine o backlog." />

          <SCard title="Time Atuando no Projeto">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {team.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Av initials={m.i} color={m.c} size={22} />
                  <span style={{ flex: 1, fontSize: 12, color: T.text1 }}>{m.name}</span>
                  <span style={{ fontSize: 10, color: T.text3 }}>{m.items}</span>
                  <ConditionalTag label={m.status} severity={m.status === 'crítico' ? 'crit' : m.status === 'atenção' ? 'warn' : m.status === 'sem-resp' ? 'crit' : 'neutral'} />
                </div>
              ))}
            </div>
          </SCard>
        </div>
      </Grid>
    </>
  )
}

// ─── 6. SCRUM MASTER ─────────────────────────────────────────────────────────
function ScrumMasterPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const blocked = applyFilters(getBlockedItems(), filters)
  const sprint14 = applyFilters(getSprintItems('Sprint 14'), filters)
  const parados = sprint14.filter(w => w.status === 'blocked' || (w.days_blocked ?? 0) >= 2)

  const aging = [
    { col: 'Em Dev',     avg: 2.1 },
    { col: 'Em Revisão', avg: 4.3 },
    { col: 'Em Teste',   avg: 3.8 },
  ]
  const cerimonias = [
    { name: 'Daily Standup',    data: 'Hoje 09h',    status: 'pendente' },
    { name: 'Sprint Review',    data: 'Sex 16h',     status: 'pendente' },
    { name: 'Retrospectiva',    data: 'Amanhã 14h',  status: 'pendente' },
    { name: 'Sprint Planning',  data: '28 jul 10h',  status: 'planejado' },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="62%" label="Saúde da Sprint" sub="28% parado" color={T.warn} alert onClick={() => onNav('project')} />
        <KpiCard value={String(blocked.length)} label="Impedimentos" sub="ativos" color={T.crit} alert onClick={() => onNav('list')} />
        <KpiCard value="⚠" label="Sprint Goal" sub="2 itens críticos parados" color={T.warn} onClick={() => onNav('project')} />
        <KpiCard value="6" label="WIP Atual" sub="limite: 5 — excedido" color={T.crit} alert onClick={() => onNav('project')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <WorkQueue title="Impedimentos por Responsável" items={blocked} onOpen={openDrawer}
          showDaysBlocked onViewAll={() => onNav('list')}
          emptyMsg="Nenhum impedimento ativo. 🟢" />

        <SCard title="Itens Parados + Aging WIP">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            {parados.length === 0
              ? <EmptyState message="Nenhum item parado." />
              : parados.map(p => (
                  <div key={p.id} onClick={() => openDrawer(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bgPage, borderRadius: 6, padding: '7px 10px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.text3, width: 52 }}>{p.key}</span>
                    <span style={{ flex: 1, fontSize: 12, color: T.text1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.title}</span>
                    {p.days_blocked && <ConditionalTag label={`${p.days_blocked}d`} severity={p.days_blocked >= 3 ? 'crit' : 'warn'} />}
                    <StatusBadge status={p.status} />
                  </div>
                ))
            }
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 8 }}>Aging médio por coluna</div>
            {aging.map(a => (
              <div key={a.col} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: T.text2, width: 80, flexShrink: 0 }}>{a.col}</span>
                <div style={{ flex: 1 }}><ProgressBar pct={(a.avg / 7) * 100} color={a.avg > 3 ? T.crit : T.warn} /></div>
                <span style={{ fontSize: 10, color: T.text3, width: 30, flexShrink: 0 }}>{a.avg}d</span>
              </div>
            ))}
          </div>
        </SCard>

        <ColSpan>
          <SCard title="Cerimônias & Ações de Facilitação">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {cerimonias.map(c => (
                <div key={c.name} style={{ background: T.bgPage, borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>{c.data}</div>
                  <div style={{ marginTop: 8 }}>
                    <ConditionalTag label={c.status === 'pendente' ? 'Pendente' : 'Planejado'} severity={c.status === 'pendente' ? 'info' : 'neutral'} />
                  </div>
                </div>
              ))}
            </div>
          </SCard>
        </ColSpan>
      </Grid>
    </>
  )
}

// ─── 7. TECH LEAD ─────────────────────────────────────────────────────────────
function TechLeadPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const inReview = applyFilters(
    WORK_ITEMS.filter(w => w.status === 'in-review' || w.type === 'bug'),
    filters
  )

  const dora = [
    { name: 'Deploy Frequency',      value: '2.1/sem', alert: false },
    { name: 'Change Failure Rate',   value: '6%',       alert: true  },
    { name: 'MTTR',                  value: '48min',    alert: false },
    { name: 'Lead Time for Changes', value: '3.2d',     alert: false },
  ]
  const divida = [
    { area: 'Cobertura de testes',  pct: 74, meta: 80 },
    { area: 'TODOs no código',      pct: 18, meta: 5  },
    { area: 'Deps desatualizadas',  pct: 35, meta: 10 },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="74%" label="Saúde Técnica" sub="cobertura de testes" color={T.warn} onClick={() => onNav('reports')} />
        <KpiCard value="3"   label="Bugs Críticos" sub="2 em prod" color={T.crit} alert onClick={() => onNav('list')} />
        <KpiCard value="4"   label="Deploys/semana" sub="+2 vs semana ant." color={T.success} onClick={() => onNav('reports')} />
        <KpiCard value="0.8%" label="Error Rate" sub="meta: &lt;0.5%" color={T.warn} alert onClick={() => onNav('reports')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <WorkQueue title="Gargalos de PRs / Issues em Revisão" items={inReview} onOpen={openDrawer}
          onViewAll={() => onNav('list')} emptyMsg="Nenhum gargalo no momento." />

        <SCard title="DORA Metrics">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {dora.map(d => (
              <div key={d.name} style={{ background: T.bgPage, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: d.alert ? T.warn : T.text1 }}>{d.value}</div>
                <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{d.name}</div>
              </div>
            ))}
          </div>
        </SCard>

        <ColSpan>
          <SCard title="Dívida Técnica / Saúde do Código">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {divida.map(d => (
                <div key={d.area}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: T.text2 }}>{d.area}</span>
                    <span style={{ fontSize: 10, color: d.pct > d.meta ? T.crit : T.success }}>{d.pct}% (meta {d.meta}%)</span>
                  </div>
                  <ProgressBar pct={d.pct} color={d.pct > d.meta ? T.crit : T.success} />
                </div>
              ))}
            </div>
          </SCard>
        </ColSpan>
      </Grid>
    </>
  )
}

// ─── 8. DEV ───────────────────────────────────────────────────────────────────
function DevPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()

  const myItems = applyFilters(
    WORK_ITEMS.filter(w => w.assignee?.name === 'Lucas Ferreira' || w.assignee?.name === 'Ana Lima'),
    filters
  ).sort((a, b) => {
    const order: Record<string, number> = { blocked: 0, 'in-review': 1, 'in-progress': 2, testing: 3, todo: 4, backlog: 5 }
    return (order[a.status] ?? 9) - (order[b.status] ?? 9)
  })
  const blocked = applyFilters(getBlockedItems(), filters).filter(w => w.assignee?.name === 'Lucas Ferreira')
  const recent = [
    { label: 'Merge PR #280 (fix: ordenação)', date: 'há 4h',   color: T.success },
    { label: 'ALT-143 movida para Bloqueado',  date: 'há 1h',   color: T.crit },
    { label: 'Comentário em ALT-141',          date: 'há 2h',   color: T.accent },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value={String(myItems.length)} label="Meus Itens Ativos" sub="1 bloqueado" onClick={() => onNav('list')} />
        <KpiCard value="1" label="Atrasados" sub="BUG-38 vence hoje" color={T.crit} alert onClick={() => onNav('list')} />
        <KpiCard value={String(blocked.length)} label="Meus Bloqueados" sub="" color={T.warn} alert onClick={() => onNav('list')} />
        <KpiCard value="2" label="PRs Abertos" sub="1 precisa de ação" color={T.accent} onClick={() => onNav('project')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="2fr 1fr">
        <SprintDonutCard sprintName="Minha Fila Ativa — Sprint 14" done={8} total={16} items={myItems} onOpen={openDrawer} onViewSprint={() => onNav('project')} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WorkQueue title="Meus Bloqueados" items={blocked} onOpen={openDrawer} showDaysBlocked
            emptyMsg="Nenhum item bloqueado." />

          <SCard title="Atividade Recente">
            <ActivityTimeline events={recent} />
          </SCard>
        </div>
      </Grid>
    </>
  )
}

// ─── 9. UX / UI ──────────────────────────────────────────────────────────────
function UxPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const designItems = applyFilters(
    WORK_ITEMS.filter(w => w.squad_id === 'squad_design' || (w.tags ?? []).some(t => ['design', 'handoff', 'frontend'].includes(t))),
    filters
  )

  const validacoes = [
    { item: 'Board Kanban v2',   feedback: 'Aprovado pelo PO',           status: 'in-review' as const, color: T.success },
    { item: 'Modal de criação',  feedback: 'Dev devolveu — acessibilidade', status: 'blocked'  as const, color: T.crit  },
    { item: 'Filtros avançados', feedback: 'Aguardando usuário teste',   status: 'testing'  as const, color: T.warn   },
  ]
  const dsAlerts = [
    { component: 'Button',  issue: 'Variante ghost ausente no tema escuro' },
    { component: 'Badge',   issue: 'Tamanho inconsistente com Figma' },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value="8"  label="Fluxos em Design"   sub="3 projetos" onClick={() => onNav('list')} />
        <KpiCard value="3"  label="Protótipos p/ Val."  sub="aguardando PO/usuário" color={T.accent} onClick={() => onNav('list')} />
        <KpiCard value="4"  label="Pendências Críticas" sub="1 acessibilidade" color={T.crit} alert onClick={() => onNav('list')} />
        <KpiCard value="1"  label="Handoff Pronto" sub="Dashboard por Papel" color={T.success} onClick={() => onNav('list')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <WorkQueue title="Fila de Design Ativa" items={designItems} onOpen={openDrawer}
          onViewAll={() => onNav('list')} emptyMsg="Fila de design vazia." />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SCard title="Design QA / Validação">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {validacoes.map(v => (
                <div key={v.item} style={{ background: T.bgPage, borderRadius: 7, padding: '9px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.text1 }}>{v.item}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{v.feedback}</div>
                </div>
              ))}
            </div>
          </SCard>

          <SCard title="Design System — Inconsistências">
            {dsAlerts.length === 0
              ? <EmptyState message="Design System consistente. ✅" />
              : dsAlerts.map(a => (
                  <div key={a.component} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <ConditionalTag label={a.component} severity="info" />
                    <span style={{ fontSize: 11, color: T.text2 }}>{a.issue}</span>
                  </div>
                ))
            }
          </SCard>
        </div>
      </Grid>
    </>
  )
}

// ─── 10. QA ──────────────────────────────────────────────────────────────────
function QaPanel({ onNav }: { onNav: (v: string) => void }) {
  const { drawerItem, openDrawer, closeDrawer } = useDrawer()
  const [filters, setFilters] = useFilters()
  const testing = applyFilters(getTestingItems(), filters)
  const bugs    = applyFilters(WORK_ITEMS.filter(w => w.type === 'bug'), filters)
  const cobertura = [
    { criterio: 'Critérios de aceite validados', pct: 68 },
    { criterio: 'Casos de teste documentados',   pct: 45 },
    { criterio: 'Regressão coberta',             pct: 82 },
  ]

  return (
    <>
      {drawerItem && <WorkItemDetailDrawer item={drawerItem} onClose={closeDrawer} onNav={onNav} />}
      <Grid cols="repeat(4,1fr)">
        <KpiCard value={String(testing.length)} label="Aguardando Teste" sub="Ready for QA" onClick={() => onNav('list')} />
        <KpiCard value={String(bugs.filter(b => b.priority === 'critical' || b.priority === 'high').length)} label="Bugs Críticos" sub="1 em prod" color={T.crit} alert onClick={() => onNav('list')} />
        <KpiCard value="28%" label="Taxa de Rejeição" sub="meta: &lt;15%" color={T.warn} alert onClick={() => onNav('reports')} />
        <KpiCard value="6"   label="Evidências Pendentes" sub="dev não submeteu" color={T.warn} onClick={() => onNav('list')} />
      </Grid>

      <div style={{ marginTop: 12 }}>
        <FilterBar filters={filters} onChange={setFilters} projects={PROJECTS} squads={SQUADS} sprints={SPRINTS} />
      </div>

      <Grid cols="1fr 1fr">
        <SCard title="Fila de Execução de Testes">
          {testing.length === 0
            ? <EmptyState message="Nenhum item aguardando teste." action={{ label: 'Ver board', onClick: () => onNav('project') }} />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {testing.map(item => (
                  <div key={item.id} style={{ background: T.bgPage, borderRadius: 7, padding: '9px 12px', cursor: 'pointer' }} onClick={() => openDrawer(item)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.text3, width: 52 }}>{item.key}</span>
                      <span style={{ flex: 1, fontSize: 12, color: T.text1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.title}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                      <button onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: T.success, background: `${T.success}14`, border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Aprovar</button>
                      <button onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: T.crit,    background: `${T.crit}14`,    border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Reprovar</button>
                      <button onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: T.text3,   background: `${T.text3}14`,   border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Solicitar evidência</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </SCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WorkQueue title="Bugs para Reteste" items={bugs.filter(b => b.status === 'testing')} onOpen={openDrawer}
            onViewAll={() => onNav('list')} emptyMsg="Nenhum bug aguardando reteste." />

          <SCard title="Cobertura / Critérios Validados">
            {cobertura.map(c => (
              <div key={c.criterio} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.text2 }}>{c.criterio}</span>
                  <span style={{ fontSize: 10, color: c.pct >= 70 ? T.success : T.warn }}>{c.pct}%</span>
                </div>
                <ProgressBar pct={c.pct} color={c.pct >= 70 ? T.success : T.warn} />
              </div>
            ))}
          </SCard>
        </div>
      </Grid>
    </>
  )
}

// ─── Panel dispatcher ────────────────────────────────────────────────────────
function DashboardContent({ type, onNav, onInvite }: { type: DashboardType; onNav: (v: string) => void; onInvite?: () => void }) {
  switch (type) {
    case 'admin':           return <AdminPanel          onNav={onNav} onInvite={onInvite} />
    case 'pmo':             return <PmoPanel            onNav={onNav} />
    case 'project-manager': return <ProjectManagerPanel onNav={onNav} />
    case 'product-manager': return <ProductManagerPanel onNav={onNav} />
    case 'product-owner':   return <ProductOwnerPanel   onNav={onNav} />
    case 'scrum-master':    return <ScrumMasterPanel    onNav={onNav} />
    case 'tech-lead':       return <TechLeadPanel       onNav={onNav} />
    case 'dev':             return <DevPanel            onNav={onNav} />
    case 'ux':              return <UxPanel             onNav={onNav} />
    case 'qa':              return <QaPanel             onNav={onNav} />
  }
}

// ─── Inspection user switcher ─────────────────────────────────────────────────
function InspectionSwitcher({ onUserChange }: { onUserChange: () => void }) {
  const [open, setOpen] = useState(false)
  const active = getActiveUser()
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        fontSize: 11, color: T.text3, background: `${T.text3}10`,
        border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>Inspection Mode:</span>
        <strong style={{ color: T.text2 }}>{active.name}</strong>
        <span style={{ color: T.text3 }}>({active.role_context})</span>
        <span style={{ opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 500,
          background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 8,
          boxShadow: T.shadowModal, minWidth: 270, padding: 6,
        }}>
          <div style={{ fontSize: 10, color: T.text3, padding: '4px 10px 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Simular usuário</div>
          {MOCK_USERS.map(u => (
            <button key={u.user_id} onClick={() => { setActiveUser(u.user_id); setOpen(false); onUserChange() }} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: u.user_id === active.user_id ? `${T.accent}14` : 'transparent',
            }}>
              <Av initials={u.avatar_initials} color={u.avatar_color} size={24} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, color: T.text1 }}>{u.name}</div>
                <div style={{ fontSize: 10, color: T.text3 }}>{u.role_context} · {u.assigned_dashboards.length} dash</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface Props { onNav?: (view: string) => void; onInvite?: () => void }

export default function DashboardHomePage({ onNav, onInvite }: Props) {
  const [scope, setScope]           = useState<UserScope | null>(null)
  const [activeDashId, setActiveDash] = useState<DashboardType | null>(null)
  const [rev, setRev]               = useState(0)

  useEffect(() => {
    const s = getActiveScope()
    setScope(s)
    setActiveDash(s.default_dashboard.dashboard_id as DashboardType)
  }, [rev])

  const activeDef = activeDashId ? DASHBOARD_CATALOG[activeDashId] : null

  if (!scope || !activeDashId || !activeDef) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <LoadingState rows={4} />
        <span style={{ fontSize: 12, color: T.text3 }}>Carregando dashboard...</span>
      </div>
    )
  }

  const user = getActiveUser()
  const assignedDefs = scope.assigned_dashboards.map(d => ({
    dashboard_id: d.dashboard_id,
    label: DASHBOARD_CATALOG[d.dashboard_id as DashboardType]?.label ?? d.dashboard_id,
  }))
  const navigate = (view: string) => onNav?.(view)

  return (
    <div style={{ padding: 24, minHeight: '100%', background: T.bgPage }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.accent, background: `${T.accent}18`,
              border: `1px solid ${T.accent}33`, borderRadius: 4, padding: '2px 7px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{MOCK_TENANT.name}</span>
            <span style={{ color: T.border2, fontSize: 14 }}>/</span>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text1 }}>
              {activeDef.label}
            </h1>
            {assignedDefs.length > 1 && (
              <>
                <span style={{ color: T.border2, fontSize: 14 }}>·</span>
                <DashboardSwitcher dashboards={assignedDefs} active={activeDashId} onSwitch={id => setActiveDash(id as DashboardType)} />
              </>
            )}
          </div>
          {/* Central question */}
          <p style={{ margin: '6px 0 0 0', fontSize: 13, color: T.text2, fontStyle: 'italic', borderLeft: `2px solid ${T.accent}`, paddingLeft: 10 }}>
            {activeDef.question}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <InspectionSwitcher onUserChange={() => { setScope(null); setActiveDash(null); setRev(r => r + 1) }} />
        </div>
      </div>

      {/* ── Scope debug pills ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
        {[`Papel: ${scope.role_context}`, `Usuário: ${user.name}`, `Módulos: ${scope.modules_allowed.join(' · ')}`].map(t => (
          <span key={t} style={{ fontSize: 9, color: T.text3, background: `${T.text3}0A`, border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 7px' }}>{t}</span>
        ))}
      </div>

      {/* ── Dashboard content ───────────────────────────────────── */}
      <DashboardContent type={activeDashId} onNav={navigate} onInvite={onInvite} />
    </div>
  )
}
