import { useState, type ReactNode } from 'react'
import { Sidebar, type Role } from './Sidebar'
import { Header } from './Header'

export type View =
  | 'home' | 'foundations' | 'dashboard' | 'project' | 'issue' | 'client' | 'task-drawer'
  | 'projects-list' | 'gantt' | 'calendar'
  | 'list' | 'timeline' | 'epics' | 'releases' | 'filters' | 'navigator'
  | 'reports' | 'automations' | 'config'
  | 'login' | 'role-dashboard' | 'client-access' | 'client-login'

interface ShellProps {
  children: ReactNode; currentView: View; onViewChange: (v:View)=>void
  role: Role; onRoleChange: (r:Role)=>void; onCreateIssue?: ()=>void
}

const VALID_VIEWS: View[] = [
  'home','dashboard','project','issue','client','task-drawer','projects-list','gantt','calendar',
  'list','timeline','epics','releases','filters','navigator',
  'reports','automations','config',
  'login','role-dashboard','client-access','client-login',
]

export function Shell({ children, currentView, onViewChange, role, onRoleChange, onCreateIssue }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState<string>(currentView)

  function handleNav(id: string) {
    setActiveNav(id)
    if (VALID_VIEWS.includes(id as View)) onViewChange(id as View)
  }

  return (
    <div className="flex h-screen overflow-hidden dark-shell">
      <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)} activeNav={activeNav} onNav={handleNav} role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header currentView={currentView} onViewChange={v=>{ onViewChange(v as View); setActiveNav(v) }}
          role={role} onRoleChange={onRoleChange} onCreateIssue={onCreateIssue} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}

export type { Role }
