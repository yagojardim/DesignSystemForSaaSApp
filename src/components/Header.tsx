import { useState } from 'react'
import { Avatar } from './ds/Avatar'
import { T } from './ds/tokens'
import type { Role } from './Sidebar'

type View = 'home' | 'foundations' | 'dashboard' | 'project' | 'issue' | 'client' | 'task-drawer' | 'projects-list' | 'gantt' | 'calendar' | 'list' | 'timeline' | 'epics' | 'releases' | 'filters' | 'navigator' | 'reports' | 'automations' | 'config' | 'login' | 'role-dashboard' | 'client-access' | 'client-login'

interface HeaderProps {
  onCreateIssue?: () => void
  currentView:  View
  onViewChange: (v: string) => void
  role:         Role
  onRoleChange: (r: Role) => void
}

const viewLabels: Record<View, string> = {
  'home':          'Início',
  'foundations':   'Design System',
  'projects-list': 'Projetos & Tarefas',
  'gantt':         'Gráfico Gantt',
  'calendar':      'Calendário',
  'dashboard':     'Dashboard',
  'project':       'Kanban Board',
  'list':          'Lista de Issues',
  'timeline':      'Timeline / Roadmap',
  'epics':         'Épicos',
  'releases':      'Releases',
  'filters':       'Filtros & Busca',
  'navigator':     'Issue Navigator',
  'reports':       'Relatórios & Insights',
  'automations':   'Automações',
  'config':        'Configurações',
  'login':          'Login — Gestão',
  'role-dashboard': 'Dashboard por Papel',
  'client-access':  'Criar Acesso de Cliente',
  'client-login':   'Login — Portal do Cliente',
  'client':        'Portal do Cliente',
  'task-drawer':   'Detalhe da Tarefa',
  'issue':         'Issue Detail',
}

const ROLE_STYLE: Record<Role, { color: string; bg: string }> = {
  Admin:  { color: T.accent,  bg: T.accentDim  },
  Member: { color: T.success, bg: T.successDim },
  Viewer: { color: T.text3,   bg: T.neutralDim },
}

function today() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Notification dropdown
const NOTIFICATIONS = [
  { icon: '🔴', text: 'PM-142 bloqueado — aguardando você', time: '2h' },
  { icon: '💬', text: 'João comentou em PM-158',             time: '3h' },
  { icon: '✅', text: 'PM-164 foi aprovado pelo cliente',    time: '5h' },
  { icon: '⚡', text: 'Sprint 14 termina em 3 dias',         time: '1d' },
]

export function Header({ currentView, onViewChange, role, onRoleChange, onCreateIssue }: HeaderProps) {
  const [cmdOpen,  setCmdOpen]  = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [readAll, setReadAll] = useState(false)
  const rs = ROLE_STYLE[role]

  return (
    <>
      {/* Main header bar */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 48, background: T.bgSurface, borderBottom: `1px solid ${T.border}` }}
      >
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: T.text3 }}>Altech Agency</span>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ color: T.text3 }}>
            <path d="M3 2.5L5.5 4.5L3 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="text-[13px] font-semibold" style={{ color: T.text1 }}>
            {viewLabels[currentView]}
          </span>
        </div>

        {/* Center: global search */}
        <button
          onClick={() => setCmdOpen(true)}
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] transition-colors"
          style={{
            minWidth: 240,
            background: T.bgSurface2,
            border: `1px solid ${T.border}`,
            color: T.text3,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border2 }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Busca global...
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${T.text3}20`, color: T.text3 }}>⌘K</span>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-1">

          {/* Create Issue */}
          {onCreateIssue && (
            <button
              onClick={onCreateIssue}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold text-white transition-all mr-2"
              style={{ background:T.accent }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.filter='brightness(1.15)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.filter='none'}}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Issue
            </button>
          )}

          {/* [PROTOTYPE] Role switcher */}
          <div className="relative mr-2">
            <button
              onClick={() => setRoleOpen(o => !o)}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{ background: rs.bg, color: rs.color }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 9c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {role}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            {roleOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 py-1 rounded-xl overflow-hidden fade-rise"
                style={{
                  width: 140,
                  background: T.bgSurface,
                  border: `1px solid ${T.border2}`,
                  boxShadow: T.shadowModal,
                }}
              >
                <p className="px-3 pb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: T.text3 }}>Papel · protótipo</p>
                {(['Admin', 'Member', 'Viewer'] as Role[]).map(r => {
                  const s = ROLE_STYLE[r]
                  return (
                    <button
                      key={r}
                      onClick={() => { onRoleChange(r); setRoleOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors"
                      style={{ background: r === role ? `${s.color}12` : 'transparent', color: r === role ? s.color : T.text2 }}
                      onMouseEnter={e => { if (r !== role) (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2 }}
                      onMouseLeave={e => { if (r !== role) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      {r}
                      {r === role && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto">
                          <path d="M2 5l2.5 2.5L8 2.5" stroke={s.color} strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="w-px h-4" style={{ background: T.border }} />

          {/* Date */}
          <span className="hidden sm:block text-[11px] px-2" style={{ color: T.text3 }}>{today()}</span>

          <div className="w-px h-4" style={{ background: T.border }} />

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: notifOpen ? T.text1 : T.text2, background: notifOpen ? T.bgSurface2 : 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2 }}
              onMouseLeave={e => { if (!notifOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6v3l-1 1.5h11L12.5 9V6A4.5 4.5 0 0 0 8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              {/* Unread dot */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: T.crit }} />
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 py-1.5 fade-rise"
                style={{
                  width: 300,
                  background: T.bgSurface,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 12,
                  boxShadow: T.shadowModal,
                }}
              >
                <div className="flex items-center justify-between px-3 pb-1.5" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <p className="text-[12px] font-semibold" style={{ color: T.text1 }}>Notificações</p>
                  <button className="text-[10px]" style={{ color: T.accent }} onClick={()=>setReadAll(true)}>{readAll?'✓ Lidas':'Marcar tudo como lido'}</button>
                </div>
                {NOTIFICATIONS.map((n, i) => (
                  <button
                    key={i}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors"
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2 }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <span className="text-sm leading-none mt-0.5 flex-shrink-0">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-snug" style={{ color: T.text1 }}>{n.text}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: T.text3 }}>{n.time} atrás</p>
                    </div>
                    {!readAll && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: T.accent }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar + dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setUserOpen(o => !o)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors"
              style={{ background: userOpen ? T.bgSurface2 : 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2 }}
              onMouseLeave={e => { if (!userOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Avatar name="Ana Lima" size="sm" presence="online" />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: T.text3 }}>
                <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {userOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 py-1 rounded-xl fade-rise"
                style={{ width: 180, background: T.bgSurface, border: `1px solid ${T.border2}`, boxShadow: T.shadowModal }}
                onMouseLeave={() => setUserOpen(false)}
              >
                <div className="px-3 py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <p className="text-[13px] font-semibold" style={{ color: T.text1 }}>Ana Lima</p>
                  <p className="text-[11px]" style={{ color: T.text3 }}>ana@altech.io</p>
                </div>
                {[{icon:'👤',label:'Perfil'},{icon:'⚙️',label:'Preferências'},{icon:'🔑',label:'Segurança'},{icon:'🚪',label:'Sair'}].map(item => (
                  <button key={item.label} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors text-left"
                    style={{ color: item.label==='Sair' ? T.crit : T.text2 }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
                    onClick={()=>setUserOpen(false)}>
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Prototype nav strip */}
      <div
        className="flex items-center gap-0.5 px-3 py-1 overflow-x-auto flex-shrink-0"
        style={{ background: `${T.bgPage}99`, borderBottom: `1px solid ${T.border}` }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wider mr-2 flex-shrink-0" style={{ color: T.text3 }}>
          Protótipo:
        </span>
        {(Object.entries(viewLabels) as [View, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className="flex-shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150"
            style={{
              background: currentView === v ? `${T.accent}25` : 'transparent',
              color: currentView === v ? T.accent : T.text3,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cmd+K palette */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 fade-rise"
          style={{ background: 'rgba(8,10,14,0.72)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setCmdOpen(false) }}
        >
          <div
            className="rounded-xl shadow-2xl w-[540px] max-w-[90vw] overflow-hidden"
            style={{ background: T.bgSurface, border: `1px solid ${T.border2}`, boxShadow: T.shadowModal }}
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: T.text3 }}>
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M10.5 10.5L9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                className="flex-1 text-[13px] outline-none bg-transparent"
                style={{ color: T.text1 }}
                placeholder="Buscar projetos, tarefas, membros..."
              />
              <button
                onClick={() => setCmdOpen(false)}
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{ color: T.text3, border: `1px solid ${T.border}` }}
              >
                Esc
              </button>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { label: 'Galpão Industrial — 18% concluído',     sub: 'Projeto' },
                { label: 'ERP Corporativo — Sprint em andamento',  sub: 'Projeto' },
                { label: 'PM-142 · Autenticação OAuth2',           sub: 'Tarefa · Bloqueado' },
                { label: 'Ana Lima — Tech Lead',                   sub: 'Membro' },
                { label: 'Dashboard executivo',                    sub: 'Visão' },
              ].map(r => (
                <button
                  key={r.label}
                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-[13px] transition-colors"
                  style={{ color: T.text2 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSurface2; (e.currentTarget as HTMLButtonElement).style.color = T.text1 }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.text2 }}
                >
                  {r.label}
                  <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: T.text3 }}>{r.sub}</span>
                </button>
              ))}
            </div>
            <div
              className="px-4 py-2 flex items-center gap-3 text-[10px]"
              style={{ borderTop: `1px solid ${T.border}`, color: T.text3 }}
            >
              <span><kbd className="font-mono px-1 rounded" style={{ border: `1px solid ${T.border}` }}>↑↓</kbd> navegar</span>
              <span><kbd className="font-mono px-1 rounded" style={{ border: `1px solid ${T.border}` }}>↵</kbd> selecionar</span>
              <span><kbd className="font-mono px-1 rounded" style={{ border: `1px solid ${T.border}` }}>Esc</kbd> fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
