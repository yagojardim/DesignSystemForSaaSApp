import { useState } from 'react'
import { T } from '../components/ds/tokens'
import {
  MOCK_USERS, MOCK_TENANT, DASHBOARD_CATALOG, deactivateMockUser, blockMockUser,
  type MockUser,
} from '../data/session'
import {
  type Capability, capabilityVisibility, type CapabilityVisibility, ROLE_TIER,
} from '../data/permissions'
import type { RoleContext, DashboardType } from '../data/session'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserWithStatus = MockUser & { status?: 'active' | 'inactive' | 'blocked' }

type Tab = 'membros' | 'permissoes' | 'dashboards'

// ─── Role display config ──────────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleContext, string> = {
  Admin:          'Admin',
  PMO:            'PMO',
  ProjectManager: 'Proj. Manager',
  ProductManager: 'Prod. Manager',
  ProductOwner:   'Product Owner',
  ScrumMaster:    'Scrum Master',
  TechLead:       'Tech Lead',
  Dev:            'Dev',
  QA:             'QA',
  UX:             'UX / UI',
}

const ROLE_COLORS: Record<RoleContext, string> = {
  Admin:          '#7d92ff',
  PMO:            '#35c9ae',
  ProjectManager: '#f5a524',
  ProductManager: '#a78bfa',
  ProductOwner:   '#f0455a',
  ScrumMaster:    '#60a5fa',
  TechLead:       '#34d399',
  Dev:            '#fb923c',
  QA:             '#fbbf24',
  UX:             '#e879f9',
}

// ─── Capability labels ────────────────────────────────────────────────────────

const CAP_LABELS: Record<Capability, string> = {
  'create:epic':          'Criar Épicos',
  'create:feature':       'Criar Funcionalidades',
  'access:dashview':      'Dashboard Executivo',
  'approve:hours':        'Aprovar Horas',
  'log:hours':            'Lançar Horas',
  'create:story':         'Criar Histórias',
  'create:task':          'Criar Tarefas',
  'create:bug':           'Criar Bugs',
  'create:subtask':       'Criar Subtarefas',
  'backlog:prioritize':   'Priorizar Backlog',
  'sprint:manage':        'Gerenciar Sprint',
  'board:manage':         'Gerenciar Board',
  'accept:functional':    'Aceite Funcional',
  'signoff:qa':           'Sign-off QA',
  'project:create':       'Criar Projetos',
  'users:manage':         'Gerenciar Usuários',
  'module:request':       'Solicitar Módulos',
  'access:client-portal': 'Portal do Cliente',
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function userStatus(u: UserWithStatus): 'active' | 'inactive' | 'blocked' {
  return u.status ?? 'active'
}

const STATUS_COLOR: Record<'active' | 'inactive' | 'blocked', string> = {
  active:   T.success,
  inactive: T.neutral,
  blocked:  T.warn,
}

const STATUS_LABEL: Record<'active' | 'inactive' | 'blocked', string> = {
  active:   'Ativo',
  inactive: 'Inativo',
  blocked:  'Suspenso',
}

// ─── Av ───────────────────────────────────────────────────────────────────────

function Av({ user, size = 32 }: { user: MockUser; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user.avatar_color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#fff', flexShrink: 0,
      letterSpacing: '-0.02em',
    }}>
      {user.avatar_initials}
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'membros',    label: 'Membros' },
    { id: 'permissoes', label: 'Matriz de Permissões' },
    { id: 'dashboards', label: 'Dashboards' },
  ]
  return (
    <div className="flex gap-1" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 16px',
            fontSize: 13, fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? T.text1 : T.text2,
            borderBottom: active === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
            background: 'transparent',
            transition: 'all 0.15s',
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ onInvite }: { onInvite: () => void }) {
  const [users, setUsers] = useState<UserWithStatus[]>(() =>
    [...MOCK_USERS] as UserWithStatus[]
  )
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'block' | null>(null)

  const visible = users.filter(u => {
    if (filter === 'all') return true
    return userStatus(u) === filter
  })

  function applyAction(userId: string, action: 'deactivate' | 'block') {
    if (action === 'deactivate') deactivateMockUser(userId)
    else blockMockUser(userId)
    setUsers(prev => prev.map(u =>
      u.user_id === userId
        ? { ...u, status: action === 'deactivate' ? 'inactive' : 'blocked' }
        : u
    ))
    setConfirmId(null)
    setConfirmAction(null)
  }

  function reactivate(userId: string) {
    const u = MOCK_USERS.find(u => u.user_id === userId)
    if (u) (u as UserWithStatus).status = 'active'
    setUsers(prev => prev.map(u =>
      u.user_id === userId ? { ...u, status: 'active' } : u
    ))
  }

  const counts = {
    active:   users.filter(u => userStatus(u) === 'active').length,
    inactive: users.filter(u => userStatus(u) === 'inactive').length,
    blocked:  users.filter(u => userStatus(u) === 'blocked').length,
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive', 'blocked'] as const).map(f => {
            const label = f === 'all'
              ? `Todos (${users.length})`
              : f === 'active'   ? `Ativos (${counts.active})`
              : f === 'inactive' ? `Inativos (${counts.inactive})`
              : `Suspensos (${counts.blocked})`
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12,
                  fontWeight: filter === f ? 600 : 400,
                  background: filter === f ? T.accentDim : 'transparent',
                  color: filter === f ? T.accent : T.text2,
                  border: `1px solid ${filter === f ? T.accentBorder : T.border}`,
                  transition: 'all 0.15s',
                }}
              >{label}</button>
            )
          })}
        </div>
        <button
          onClick={onInvite}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: T.accent, color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Convidar membro
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: T.bgSurface, borderRadius: 12,
        border: `1px solid ${T.border}`, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Membro', 'Função', 'Squad', 'Status', 'Módulos', 'Ações'].map(col => (
                <th key={col} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: T.text3, letterSpacing: '0.06em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((u, i) => {
              const st = userStatus(u)
              const isLast = i === visible.length - 1
              const isAdmin = u.user_id === 'u_admin'
              const isConfirming = confirmId === u.user_id

              return (
                <tr
                  key={u.user_id}
                  style={{
                    borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                    opacity: st === 'inactive' ? 0.55 : 1,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = `${T.text3}08` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                >
                  {/* Membro */}
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-3">
                      <Av user={u} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: T.text3 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Função */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: ROLE_COLORS[u.role_context],
                      background: `${ROLE_COLORS[u.role_context]}18`,
                      border: `1px solid ${ROLE_COLORS[u.role_context]}33`,
                      borderRadius: 5, padding: '2px 8px',
                    }}>
                      {ROLE_LABELS[u.role_context]}
                    </span>
                    <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>
                      Tier {ROLE_TIER[u.role_context]}
                    </div>
                  </td>

                  {/* Squad */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: T.text2 }}>
                      {u.squad_id === '*' ? '— todos —' : u.squad_id.replace('squad_', '')}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: STATUS_COLOR[st], flexShrink: 0,
                          boxShadow: st === 'active' ? `0 0 6px ${T.success}80` : 'none',
                        }}
                      />
                      <span style={{ fontSize: 12, color: STATUS_COLOR[st], fontWeight: 500 }}>
                        {STATUS_LABEL[st]}
                      </span>
                    </div>
                  </td>

                  {/* Módulos */}
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex flex-wrap gap-1" style={{ maxWidth: 200 }}>
                      {u.modules_enabled.slice(0, 4).map(m => (
                        <span
                          key={m}
                          style={{
                            fontSize: 10, color: T.text3,
                            background: `${T.text3}12`,
                            border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: '1px 6px',
                          }}
                        >{m}</span>
                      ))}
                      {u.modules_enabled.length > 4 && (
                        <span style={{ fontSize: 10, color: T.text3 }}>
                          +{u.modules_enabled.length - 4}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ações */}
                  <td style={{ padding: '12px 16px' }}>
                    {isAdmin ? (
                      <span style={{ fontSize: 11, color: T.text3 }}>—</span>
                    ) : isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: T.warn }}>Confirmar?</span>
                        <button
                          onClick={() => applyAction(u.user_id, confirmAction!)}
                          style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 5,
                            background: confirmAction === 'block' ? T.warnDim : T.critDim,
                            color: confirmAction === 'block' ? T.warn : T.crit,
                            border: `1px solid ${confirmAction === 'block' ? T.warn : T.crit}44`,
                            cursor: 'pointer',
                          }}
                        >Sim</button>
                        <button
                          onClick={() => { setConfirmId(null); setConfirmAction(null) }}
                          style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 5,
                            background: 'transparent', color: T.text2,
                            border: `1px solid ${T.border}`, cursor: 'pointer',
                          }}
                        >Não</button>
                      </div>
                    ) : st === 'active' ? (
                      <div className="flex items-center gap-1.5">
                        <ActionBtn
                          label="Suspender"
                          color={T.warn}
                          onClick={() => { setConfirmId(u.user_id); setConfirmAction('block') }}
                        />
                        <ActionBtn
                          label="Desativar"
                          color={T.crit}
                          onClick={() => { setConfirmId(u.user_id); setConfirmAction('deactivate') }}
                        />
                      </div>
                    ) : (
                      <ActionBtn
                        label="Reativar"
                        color={T.success}
                        onClick={() => reactivate(u.user_id)}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 11, color: T.text3, marginTop: 12 }}>
        Usuários desativados perdem acesso ao sistema. Suspensos têm acesso temporariamente bloqueado.
        Nenhuma remoção permanente de usuário é realizada.
      </p>
    </div>
  )
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 11, padding: '3px 9px', borderRadius: 5,
        background: hov ? `${color}20` : 'transparent',
        color: hov ? color : T.text2,
        border: `1px solid ${hov ? color + '55' : T.border}`,
        cursor: 'pointer', transition: 'all 0.12s',
      }}
    >{label}</button>
  )
}

// ─── Permissions Matrix tab ───────────────────────────────────────────────────

const ROLES_ORDER: RoleContext[] = [
  'Admin', 'PMO', 'ProjectManager', 'ProductManager', 'ProductOwner',
  'ScrumMaster', 'TechLead', 'Dev', 'QA', 'UX',
]


const CAP_GROUPS: { label: string; caps: Capability[] }[] = [
  {
    label: 'Estratégico',
    caps:  ['create:epic', 'create:feature', 'access:dashview', 'project:create',
            'users:manage', 'module:request', 'access:client-portal'],
  },
  {
    label: 'Planejamento',
    caps:  ['backlog:prioritize', 'sprint:manage', 'board:manage',
            'accept:functional', 'signoff:qa'],
  },
  {
    label: 'Criação de itens',
    caps:  ['create:story', 'create:task', 'create:bug', 'create:subtask'],
  },
  {
    label: 'Horas',
    caps:  ['approve:hours', 'log:hours'],
  },
]

function VisCell({ vis }: { vis: CapabilityVisibility }) {
  if (vis === 'on') return (
    <span title="Padrão" style={{ color: T.success, fontSize: 15 }}>●</span>
  )
  if (vis === 'opt-in') return (
    <span title="Opt-in (Admin habilita no convite)" style={{ color: T.warn, fontSize: 15 }}>○</span>
  )
  return (
    <span title="Não disponível para este papel" style={{ color: T.border, fontSize: 14 }}>—</span>
  )
}

function PermissionsTab() {
  return (
    <div>
      <p style={{ fontSize: 12, color: T.text2, marginBottom: 16 }}>
        <strong style={{ color: T.success }}>●</strong> Padrão &nbsp;·&nbsp;
        <strong style={{ color: T.warn }}>○</strong> Opt-in (habilitado pelo Admin no convite) &nbsp;·&nbsp;
        <strong style={{ color: T.text3 }}>—</strong> Não disponível
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{
                padding: '10px 16px', textAlign: 'left', fontSize: 11,
                fontWeight: 600, color: T.text3, letterSpacing: '0.06em',
                textTransform: 'uppercase', minWidth: 180, position: 'sticky', left: 0,
                background: T.bgSurface, borderRight: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
              }}>
                Permissão
              </th>
              {ROLES_ORDER.map(role => (
                <th key={role} style={{
                  padding: '10px 10px', textAlign: 'center', fontSize: 10,
                  fontWeight: 700, color: ROLE_COLORS[role],
                  letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  minWidth: 76, borderBottom: `1px solid ${T.border}`,
                }}>
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAP_GROUPS.map(group => (
              <>
                <tr key={`grp-${group.label}`}>
                  <td
                    colSpan={ROLES_ORDER.length + 1}
                    style={{
                      padding: '10px 16px 6px',
                      fontSize: 10, fontWeight: 700, color: T.text3,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: `${T.text3}08`,
                      borderTop: `1px solid ${T.border}`,
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    {group.label}
                  </td>
                </tr>
                {group.caps.map((cap, rowIdx) => (
                  <tr key={cap} style={{
                    background: rowIdx % 2 === 0 ? 'transparent' : `${T.text3}05`,
                  }}>
                    <td style={{
                      padding: '9px 16px',
                      fontSize: 12, color: T.text1, fontWeight: 500,
                      position: 'sticky', left: 0,
                      background: rowIdx % 2 === 0 ? T.bgSurface : `${T.bgSurface}EE`,
                      borderRight: `1px solid ${T.border}`,
                      borderBottom: `1px solid ${T.border}88`,
                    }}>
                      {CAP_LABELS[cap]}
                    </td>
                    {ROLES_ORDER.map(role => (
                      <td key={role} style={{
                        padding: '9px 10px', textAlign: 'center',
                        borderBottom: `1px solid ${T.border}88`,
                      }}>
                        <VisCell vis={capabilityVisibility(role, cap)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Dashboards tab ───────────────────────────────────────────────────────────

function DashboardsTab() {
  return (
    <div>
      <p style={{ fontSize: 12, color: T.text2, marginBottom: 16 }}>
        Dashboards atribuídos a cada membro. O dashboard padrão é aberto ao entrar no sistema.
        Dashboards secundários ficam disponíveis via seletor.
      </p>

      <div style={{
        background: T.bgSurface, borderRadius: 12,
        border: `1px solid ${T.border}`, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Membro', 'Função', 'Dashboard padrão', 'Dashboards secundários'].map(col => (
                <th key={col} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: T.text3, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((u, i) => {
              const defaultDash = u.assigned_dashboards.find(d => d.is_default)
              const secondary   = u.assigned_dashboards.filter(d => !d.is_default)
              const isLast = i === MOCK_USERS.length - 1

              return (
                <tr
                  key={u.user_id}
                  style={{ borderBottom: isLast ? 'none' : `1px solid ${T.border}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = `${T.text3}08` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-3">
                      <Av user={u} size={28} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.text1 }}>{u.name}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: ROLE_COLORS[u.role_context],
                    }}>
                      {ROLE_LABELS[u.role_context]}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    {defaultDash ? (
                      <div>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: T.accent,
                          background: T.accentDim, border: `1px solid ${T.accentBorder}`,
                          borderRadius: 5, padding: '2px 8px',
                        }}>
                          {DASHBOARD_CATALOG[defaultDash.dashboard_id as DashboardType]?.label ?? defaultDash.dashboard_id}
                        </span>
                        <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>
                          {DASHBOARD_CATALOG[defaultDash.dashboard_id as DashboardType]?.question}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: T.text3 }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    {secondary.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {secondary.map(d => (
                          <span
                            key={d.dashboard_id}
                            style={{
                              fontSize: 11, color: T.text2,
                              background: `${T.text3}12`,
                              border: `1px solid ${T.border}`,
                              borderRadius: 5, padding: '2px 8px',
                            }}
                          >
                            {DASHBOARD_CATALOG[d.dashboard_id as DashboardType]?.label ?? d.dashboard_id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: T.text3 }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: 0, lineHeight: 1.2 }}>
          Time &amp; Permissões
        </h1>
        <p style={{ fontSize: 13, color: T.text2, margin: '6px 0 0' }}>
          Gerencie membros, papéis e permissões do tenant <strong style={{ color: T.text1 }}>Altech Agency</strong>.
        </p>
      </div>

      {/* Tenant badge */}
      <div style={{
        padding: '8px 14px', borderRadius: 10,
        background: T.bgSurface2, border: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        <span style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tenant</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{MOCK_TENANT.name}</span>
        <span style={{ fontSize: 10, color: T.text3 }}>{MOCK_TENANT.tenant_id}</span>
      </div>
    </div>
  )
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

function KpiStrip() {
  const total    = MOCK_USERS.length
  const active   = MOCK_USERS.filter(u => !(u as UserWithStatus).status || (u as UserWithStatus).status === 'active').length
  const inactive = MOCK_USERS.filter(u => (u as UserWithStatus).status === 'inactive').length
  const blocked  = MOCK_USERS.filter(u => (u as UserWithStatus).status === 'blocked').length

  const cards = [
    { label: 'Total de membros', value: total,    color: T.accent  },
    { label: 'Ativos',           value: active,   color: T.success },
    { label: 'Inativos',         value: inactive, color: T.neutral },
    { label: 'Suspensos',        value: blocked,  color: T.warn    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div
          key={c.label}
          style={{
            padding: '14px 18px', borderRadius: 10,
            background: T.bgSurface, border: `1px solid ${T.border}`,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: 11, color: T.text2, marginTop: 4 }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function TeamPage({ onInvite }: { onInvite?: () => void }) {
  const [tab, setTab] = useState<Tab>('membros')

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <PageHeader />
      <KpiStrip />

      <div style={{
        background: T.bgSurface, borderRadius: 14,
        border: `1px solid ${T.border}`, padding: '0 24px 24px',
      }}>
        <div style={{ padding: '16px 0 0' }}>
          <TabBar active={tab} onChange={setTab} />
        </div>
        <div style={{ paddingTop: 20 }}>
          {tab === 'membros'    && <MembersTab onInvite={onInvite ?? (() => {})} />}
          {tab === 'permissoes' && <PermissionsTab />}
          {tab === 'dashboards' && <DashboardsTab />}
        </div>
      </div>
    </div>
  )
}
