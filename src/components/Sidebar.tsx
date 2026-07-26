import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Avatar } from './ds/Avatar'
import { Tooltip } from './ds/Tooltip'
import { T } from './ds/tokens'
import { getActiveUser } from '../data/session'
import { can, type Capability } from '../data/permissions'

// ─── Role type (legacy coarse gate, kept for Shell compat) ───────────────────
export type Role = 'Admin' | 'Member' | 'Viewer'

interface SidebarProps {
  collapsed:  boolean
  onToggle:   () => void
  activeNav:  string
  onNav:      (id: string) => void
  role:       Role
}

// ─── Nav definition ───────────────────────────────────────────────────────────
interface NavItem {
  id:       string
  label:    string
  icon:     () => React.ReactElement
  badge?:   string
  // cap: if set, item shown only if user has this capability
  cap?:     Capability
  // minRole: coarse gate (Admin > Member > Viewer)
  minRole?: 'Admin' | 'Member'
}

interface NavGroup {
  label:    string
  minRole?: 'Admin' | 'Member'
  items:    NavItem[]
}

const ALL_GROUPS: NavGroup[] = [
  {
    label: 'Comece aqui',
    items: [
      { id: 'home', label: 'Início', icon: HomeIcon },
    ],
  },
  {
    label: 'Meu dia a dia',
    items: [
      { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
    ],
  },
  {
    label: 'Gestão',
    minRole: 'Member',
    items: [
      { id: 'projects-list', label: 'Projetos & Tarefas', icon: ProjectIcon },
      { id: 'project',       label: 'Kanban Board',       icon: BoardIcon   },
      { id: 'list',          label: 'Lista',              icon: ListIcon    },
      { id: 'gantt',         label: 'Gráfico Gantt',      icon: GanttIcon   },
      { id: 'timeline',      label: 'Timeline',           icon: TimelineIcon},
      // Dashview — gated by access:dashview capability
      { id: 'dashboard', label: 'Dashview', icon: ChartIcon, cap: 'access:dashview' },
    ],
  },
  {
    label: 'Planejamento',
    minRole: 'Member',
    items: [
      // Épicos — gated by create:epic capability
      { id: 'epics',     label: 'Épicos',         icon: EpicNavIcon, cap: 'create:epic'    },
      { id: 'releases',  label: 'Releases',        icon: ReleaseIcon                       },
      { id: 'filters',   label: 'Filtros & Busca', icon: FilterIcon                        },
      { id: 'navigator', label: 'Issue Navigator', icon: NavIcon                           },
    ],
  },
  {
    label: 'Configuração',
    minRole: 'Admin',
    items: [
      { id: 'config',        label: 'Configurações',        icon: ConfigIcon, cap: 'users:manage' },
      { id: 'automations',   label: 'Automações',           icon: AutomIcon,  cap: 'users:manage' },
      { id: 'client-access', label: 'Criar acesso cliente', icon: AccessIcon, cap: 'users:manage' },
      { id: 'client',        label: 'Portal do Cliente',    icon: ClientIcon                      },
    ],
  },
  {
    label: 'Mais',
    minRole: 'Admin',
    items: [
      { id: 'team',         label: 'Time & Permissões', icon: TeamIcon,    cap: 'users:manage' },
      { id: 'reports',      label: 'Relatórios',        icon: ReportsIcon                     },
      { id: 'login',        label: 'Login Gestão',      icon: LoginIcon,   cap: 'users:manage' },
      { id: 'client-login', label: 'Login Portal',      icon: PortalIcon,  cap: 'users:manage' },
    ],
  },
]

const ROLE_RANK: Record<Role, number> = { Viewer: 0, Member: 1, Admin: 2 }

function ClockIcon()   { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function getGroups(role: Role, permissions: string[]): NavGroup[] {
  const perms = permissions ?? []
  return ALL_GROUPS
    .filter(g => !g.minRole || ROLE_RANK[role] >= ROLE_RANK[g.minRole])
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (item.minRole && ROLE_RANK[role] < ROLE_RANK[item.minRole]) return false
        if (item.cap && !can(perms, item.cap)) return false
        return true
      }),
    }))
    .filter(g => g.items.length > 0)
    .map(g => ({
      ...g,
      items: g.items.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx),
    }))
}

const recentProjects = [
  { name: 'Galpão Industrial', color: T.accent,   pct: 18 },
  { name: 'ERP Corporativo',   color: T.purple,   pct: 48 },
  { name: 'Reforma da Sede',   color: T.success,  pct: 5  },
]

const workspaces = [
  { id: 'w1', name: 'Altech Agency',      initial: 'A', color: T.accent  },
  { id: 'w2', name: 'Harbor Labs',        initial: 'H', color: T.warn    },
  { id: 'w3', name: 'Internal Projects',  initial: 'I', color: T.success },
]

// ─── Pill nav button ───────────────────────────────────────────────────────────
function NavBtn({ item, active, onClick, collapsed }: {
  item: NavItem; active: boolean; onClick: () => void; collapsed: boolean
}) {
  const btn = (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 h-8 rounded-lg text-[13px] transition-all duration-150 flex-shrink-0 ${collapsed ? 'w-8 justify-center px-0' : 'w-full px-2.5'}`}
      style={{
        background: active ? `${T.accent}22` : 'transparent',
        color: active ? T.accent : T.text2,
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {/* Active pill indicator on the icon side */}
      <span
        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md transition-all"
        style={{ background: active ? `${T.accent}28` : 'transparent' }}
      >
        <item.icon />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${T.accent}20`, color: T.accent }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
          style={{ background: T.accent, position: 'absolute' }}
        >
          {item.badge}
        </span>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip label={item.label} side="right">
        <span className="relative block">{btn}</span>
      </Tooltip>
    )
  }
  return btn
}

// ─── Workspace selector dropdown ──────────────────────────────────────────────
function WorkspaceSelector({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('w1')
  const ref = useRef<HTMLDivElement>(null)
  const ws = workspaces.find(w => w.id === active) ?? workspaces[0]

  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl transition-colors ${collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2.5'}`}
        style={{ background: open ? `${T.accent}14` : 'transparent' }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        {/* Workspace mark */}
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: ws.color }}
        >
          {ws.initial}
        </span>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: T.text1 }}>{ws.name}</p>
              <p className="text-[10px]" style={{ color: T.text3 }}>Workspace</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: T.text3, flexShrink: 0 }}>
              <path d="M2.5 5L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 z-50 py-1.5 fade-rise overflow-hidden"
          style={{
            left: collapsed ? '100%' : 0,
            marginLeft: collapsed ? 8 : 0,
            width: 220,
            background: T.bgSurface,
            border: `1px solid ${T.border2}`,
            borderRadius: 12,
            boxShadow: T.shadowModal,
          }}
        >
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.text3 }}>Workspaces</p>
          {workspaces.map(w => (
            <button
              key={w.id}
              onClick={() => { setActive(w.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
              style={{ background: w.id === active ? `${T.accent}12` : 'transparent' }}
              onMouseEnter={e => { if (w.id !== active) (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2 }}
              onMouseLeave={e => { if (w.id !== active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0" style={{ background: w.color }}>{w.initial}</span>
              <span className="flex-1 text-[13px] truncate" style={{ color: w.id === active ? T.accent : T.text1 }}>{w.name}</span>
              {w.id === active && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5L4.5 8L9 3" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
          <div className="mx-3 my-1.5 h-px" style={{ background: T.border }} />
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
            style={{ color: T.text2 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2; (e.currentTarget as HTMLButtonElement).style.color = T.text1 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.text2 }}
          >
            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.bgSurface2, border: `1px dashed ${T.border2}`, color: T.text3 }}>+</span>
            Criar workspace
          </button>
        </div>
      )}
    </div>
  )
}

// ─── User block ───────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<Role, { color: string; bg: string }> = {
  Admin:  { color: T.accent,  bg: T.accentDim  },
  Member: { color: T.success, bg: T.successDim },
  Viewer: { color: T.text3,   bg: T.neutralDim },
}

function UserBlock({ collapsed, role }: { collapsed: boolean; role: Role }) {
  const rs = ROLE_STYLE[role]
  const activeUser = getActiveUser()
  const name  = activeUser?.name  ?? 'Usuário'
  const email = activeUser?.email ?? ''
  const roleLabel = activeUser?.role_context ?? role
  const btn = (
    <button
      className={`flex items-center gap-2.5 rounded-xl transition-colors ${collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2.5'}`}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      <Avatar name={name} size="sm" presence="online" />
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-medium truncate leading-tight" style={{ color: T.text1 }}>{name}</p>
              <span className="text-[9px] font-bold px-1.5 py-px rounded-full flex-shrink-0" style={{ color: rs.color, background: rs.bg }}>
                {roleLabel}
              </span>
            </div>
            <p className="text-[10px] truncate mt-0.5" style={{ color: T.text3 }}>{email}</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: T.text3, flexShrink: 0 }}>
            <circle cx="6" cy="3" r="0.8" fill="currentColor" />
            <circle cx="6" cy="6" r="0.8" fill="currentColor" />
            <circle cx="6" cy="9" r="0.8" fill="currentColor" />
          </svg>
        </>
      )}
    </button>
  )
  return collapsed ? (
    <Tooltip label={`${name} — ${roleLabel}`} side="right">{btn}</Tooltip>
  ) : btn
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle, activeNav, onNav, role }: SidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const activeUser = getActiveUser()
  const permissions = activeUser?.permissions ?? []
  const groups = getGroups(role, permissions)
  const canLogHours = can(permissions, 'log:hours')

  const sidebarStyle: React.CSSProperties = {
    width: collapsed ? 56 : 240,
    background: T.bgSurface,
    borderRight: `1px solid ${T.border}`,
    transition: 'width 0.2s ease',
  }

  return (
    <aside className="flex flex-col flex-shrink-0 overflow-hidden" style={sidebarStyle}>

      {/* Workspace selector */}
      <div className="px-1.5 pt-2 pb-1 flex-shrink-0">
        <WorkspaceSelector collapsed={collapsed} />
      </div>

      {/* Collapse toggle + search */}
      {!collapsed && (
        <div className="px-2 pb-2 flex items-center gap-1 flex-shrink-0">
          <button
            className="flex items-center gap-2 flex-1 h-7 px-2.5 rounded-lg border text-[12px] transition-colors"
            style={{ border: `1px solid ${T.border}`, background: `${T.text3}10`, color: T.text3 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border2 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border }}
          >
            <SearchIcon />
            Buscar...
            <span className="ml-auto text-[9px] px-1.5 rounded font-mono" style={{ background: `${T.text3}20`, color: T.text3 }}>⌘K</span>
          </button>
          <button
            onClick={onToggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
            style={{ color: T.text3 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14`; (e.currentTarget as HTMLButtonElement).style.color = T.text1 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.text3 }}
            title="Colapsar sidebar"
          >
            <CollapseIcon />
          </button>
        </div>
      )}

      {/* Collapsed: expand button */}
      {collapsed && (
        <div className="px-1.5 pb-2 flex justify-center flex-shrink-0">
          <Tooltip label="Expandir sidebar" side="right">
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: T.text3 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <ExpandIcon />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto pb-2 ${collapsed ? 'px-1.5 space-y-1' : 'px-2 space-y-4'}`}>
        {collapsed ? (
          // Collapsed: flat list of all visible items
          groups.flatMap(g => g.items)
            .filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx)
            .map(item => (
              <NavBtn key={item.id} item={item} active={activeNav === item.id} onClick={() => onNav(item.id)} collapsed />
            ))
        ) : (
          // Expanded: grouped
          groups.map(group => (
            <div key={group.label}>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.text3 }}>
                {group.label}
              </p>
              {group.items.map(item => (
                <NavBtn
                  key={`${item.id}-${item.label}`}
                  item={item}
                  active={activeNav === item.id}
                  collapsed={false}
                  onClick={() => {
                    onNav(item.id)
                    if (item.id === 'projects-list') setProjectsExpanded(e => !e)
                  }}
                />
              ))}
              {/* Recent projects sub-list under Gestão */}
              {group.label === 'Gestão' && projectsExpanded && (
                <div className="ml-7 mt-0.5 space-y-0.5 pl-2.5" style={{ borderLeft: `1px solid ${T.border}` }}>
                  {recentProjects.map(p => (
                    <button
                      key={p.name}
                      className="w-full flex items-center gap-2 h-7 px-2 rounded-lg text-[12px] transition-colors"
                      style={{ color: T.text2 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="flex-1 text-left truncate">{p.name}</span>
                      <span className="text-[10px] tabular" style={{ color: T.text3 }}>{p.pct}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </nav>

      {/* Lançar horas — only for roles with log:hours */}
      {canLogHours && (
        <div className="flex-shrink-0 px-2 py-1.5" style={{ borderTop: `1px solid ${T.border}` }}>
          {collapsed ? (
            <Tooltip label="Lançar horas" side="right">
              <button
                onClick={() => {}}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: T.text2 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <ClockIcon />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => {}}
              className="flex items-center gap-2 w-full h-8 px-2.5 rounded-lg text-[13px] transition-colors"
              style={{ color: T.text2 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.text3}14` }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-md">
                <ClockIcon />
              </span>
              <span>Lançar horas</span>
            </button>
          )}
        </div>
      )}

      {/* User block (pinned bottom) */}
      <div className="flex-shrink-0 px-1.5 py-2" style={{ borderTop: `1px solid ${T.border}` }}>
        <UserBlock collapsed={collapsed} role={role} />
      </div>
    </aside>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 6.5L7 2L12.5 6.5V12.5H9V9H5V12.5H1.5V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }

function CalendarIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2v2M9 2v2M2 6h10M5 9h1M7 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ProjectIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function GanttIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="5" height="2" rx="1" fill="currentColor" opacity=".7"/><rect x="5" y="7" width="7" height="2" rx="1" fill="currentColor" opacity=".7"/><rect x="3" y="10" width="4" height="2" rx="1" fill="currentColor" opacity=".7"/></svg> }
function ChartIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10.5L5 7l2.5 2L10 5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BoardIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="3" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="10" y="3" width="2" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> }
function ClientIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function TeamIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 9c1.6.4 3 1.7 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function SearchIcon()  { return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8.5 8.5L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ListIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function TimelineIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="4" height="2" rx="1" fill="currentColor" opacity=".6"/><rect x="5" y="7" width="6" height="2" rx="1" fill="currentColor" opacity=".6"/><rect x="3" y="10" width="5" height="2" rx="1" fill="currentColor" opacity=".6"/><path d="M1 2v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function EpicNavIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L9.5 5.5H12L8.5 9H10.5L7 12.5L3.5 9H5.5L2 5.5H4.5L7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> }
function ReleaseIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FilterIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M4 7h6M6 10.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function NavIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M7.5 7.5l3 1-1 3-1-4Z" fill="currentColor"/></svg> }
function AccessIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 7a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function LoginIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 2H11C11.6 2 12 2.4 12 3V11C12 11.6 11.6 12 11 12H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 4.5L8 7L5 9.5M8 7H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PortalIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h4M7 5l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ReportsIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11V7M5 11V5M8 11V3M11 11V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function AutomIcon()      { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l-5 7h5l-1 4 5-7H6l1-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> }
function ConfigIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M9.7 4.3L11.1 2.9M2.9 11.1l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function CollapseIcon(){ return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2.5L5 6.5L8.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ExpandIcon()  { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 2.5L8 6.5L4.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
