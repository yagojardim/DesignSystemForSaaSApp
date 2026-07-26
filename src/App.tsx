import { useState } from 'react'
import { Shell, type View } from './components/Shell'
import FoundationsPage from './pages/FoundationsPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import IssueDetailPage from './pages/IssueDetailPage'
import ClientPortalPage from './pages/ClientPortalPage'
import TaskDrawerPage from './pages/TaskDrawerPage'
import ProjectsListPage from './pages/ProjectsListPage'
import GanttPage from './pages/GanttPage'
import CalendarPage from './pages/CalendarPage'
import ListPage from './pages/ListPage'
import TimelinePage from './pages/TimelinePage'
import EpicsPage from './pages/EpicsPage'
import ReleasesPage from './pages/ReleasesPage'
import FiltersPage from './pages/FiltersPage'
import IssueNavigatorPage from './pages/IssueNavigatorPage'
import ReportsPage from './pages/ReportsPage'
import AutomationsPage from './pages/AutomationsPage'
import ConfigPage from './pages/ConfigPage'
import { CreateIssueModal } from './components/CreateIssueModal'
import { CatalogProvider } from './data/CatalogContext'
import type { Role } from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import RoleDashboard from './pages/RoleDashboard'
import ClientAccessPage from './pages/ClientAccessPage'
import ClientLoginPage from './pages/ClientLoginPage'

const ALL_VIEWS: View[] = [
  'home','foundations','projects-list','gantt','calendar','dashboard','project',
  'list','timeline','epics','releases','filters','navigator',
  'reports','automations','config',
  'issue','client','task-drawer',
  'login','role-dashboard','client-access','client-login',
]

export const VIEW_LABELS: Record<View, string> = {
  home:'Início', foundations:'Design System', 'projects-list':'Projetos',
  gantt:'Gantt', calendar:'Calendário', dashboard:'Dashboard', project:'Kanban',
  list:'Lista', timeline:'Timeline', epics:'Épicos', releases:'Releases',
  filters:'Filtros', navigator:'Issue Navigator',
  reports:'Relatórios', automations:'Automações', config:'Configurações',
  issue:'Issue Detail', client:'Portal Cliente', 'task-drawer':'Task Drawer',
  login:'Login — Gestão', 'role-dashboard':'Dashboard por Papel',
  'client-access':'Criar Acesso de Cliente', 'client-login':'Login — Portal',
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [dashRole, setDashRole] = useState<string>('PMO')

  if (view === 'login') {
    return (
      <LoginPage
        onSuccess={(role) => { setDashRole(role); setView('role-dashboard') }}
      />
    )
  }

  if (view === 'role-dashboard') {
    return (
      <RoleDashboard
        role={dashRole}
        onBack={() => setView('login')}
      />
    )
  }

  if (view === 'client-login') {
    return (
      <ClientLoginPage
        onSuccess={(_permission) => setView('client')}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'client-access') {
    return (
      <ClientAccessPage
        onBack={() => setView('home')}
        onGoToPortal={() => setView('client')}
      />
    )
  }

  if (view === 'foundations') {
    return (
      <div className="h-screen overflow-hidden flex flex-col" style={{ background:'var(--bg-page)' }}>
        <div className="flex items-center gap-0.5 px-4 py-1.5 overflow-x-auto flex-shrink-0" style={{ background:'#F0F4FF', borderBottom:'1px solid #E6EBF2' }}>
          <span className="text-[9px] font-semibold text-[#2F6BFF] uppercase tracking-wider mr-2 flex-shrink-0">Protótipo:</span>
          {ALL_VIEWS.map(v => (
            <button key={v} onClick={()=>setView(v)} className="flex-shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-all"
              style={{ background:view===v?'#2F6BFF':'transparent', color:view===v?'#fff':'#2F6BFF' }}>
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto"><FoundationsPage /></div>
      </div>
    )
  }

  if (view === 'client') {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ background:'#0e1016' }}>
        <div className="flex items-center gap-1 px-4 py-1.5 flex-shrink-0 overflow-x-auto" style={{ background:'#0a0d12', borderBottom:'1px solid #1c2434' }}>
          {ALL_VIEWS.map(v => (
            <button key={v} onClick={()=>setView(v)} className="px-2.5 py-1 rounded text-[10px] font-medium transition-all flex-shrink-0"
              style={{ background:view===v?'#7d92ff':'transparent', color:view===v?'#fff':'#6a7390' }}>
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden"><ClientPortalPage /></div>
      </div>
    )
  }

  return (
    <CatalogProvider>
      <ShellWithRole view={view} setView={setView} />
    </CatalogProvider>
  )
}

function ShellWithRole({ view, setView }: { view:View; setView:(v:View)=>void }) {
  const [role, setRole]           = useState<Role>('Admin')
  const [createOpen, setCreate]   = useState(false)

  return (
    <>
      {createOpen && (
        <CreateIssueModal onClose={()=>setCreate(false)} onCreate={()=>setCreate(false)} />
      )}
      <Shell currentView={view} onViewChange={setView} role={role} onRoleChange={setRole} onCreateIssue={()=>setCreate(true)}>
        {view==='home'          && <div className="h-full overflow-hidden"><HomePage role={role}/></div>}
        {view==='projects-list' && <div className="h-full overflow-y-auto dark-shell"><ProjectsListPage/></div>}
        {view==='gantt'         && <div className="h-full overflow-hidden"><GanttPage/></div>}
        {view==='calendar'      && <div className="h-full overflow-hidden"><CalendarPage/></div>}
        {view==='list'          && <div className="h-full overflow-hidden dark-shell"><ListPage/></div>}
        {view==='timeline'      && <div className="h-full overflow-hidden dark-shell"><TimelinePage/></div>}
        {view==='epics'         && <div className="h-full overflow-y-auto dark-shell"><EpicsPage/></div>}
        {view==='releases'      && <div className="h-full overflow-y-auto dark-shell"><ReleasesPage/></div>}
        {view==='filters'       && <div className="h-full overflow-hidden dark-shell"><FiltersPage/></div>}
        {view==='navigator'     && <div className="h-full overflow-hidden dark-shell"><IssueNavigatorPage/></div>}
        {view==='reports'       && <div className="h-full overflow-y-auto dark-shell"><ReportsPage/></div>}
        {view==='automations'   && <div className="h-full overflow-hidden dark-shell"><AutomationsPage/></div>}
        {view==='config'        && <div className="h-full overflow-hidden dark-shell"><ConfigPage/></div>}
        {view==='dashboard'     && <div className="h-full overflow-y-auto dark-shell" style={{ background:'var(--bg-page,#0d1321)' }}><DashboardPage/></div>}
        {view==='project'       && <div className="h-full overflow-hidden dark-shell"><ProjectPage/></div>}
        {view==='issue'         && <div className="h-full overflow-hidden dark-shell"><IssueDetailPage/></div>}
        {view==='task-drawer'   && <div className="h-full overflow-hidden dark-shell"><TaskDrawerPage/></div>}
      </Shell>
    </>
  )
}
