import { useState } from 'react'
import { Avatar } from '../components/ds/Avatar'
import { NewProjectModal } from '../components/NewProjectModal'

// ─── Data matching screenshot b8246b12 ─────────────────────────────────────
type TaskStatus = 'em progresso' | 'concluído' | 'pendente' | 'planejamento'

interface SubTask {
  name: string
  period: string
  pct: number
  status: TaskStatus
  responsible: string
}

interface Project {
  id: string
  name: string
  client: string
  color: string
  period: string
  pct: number
  status: TaskStatus
  responsible: string
  tasks: SubTask[]
}

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Construção do Galpão Industrial',
    client: 'Construtora Horizonte Ltda',
    color: '#4d82ff',
    period: '06/01 – 31/10/25',
    pct: 18,
    status: 'em progresso',
    responsible: 'Carlos Mendes',
    tasks: [
      { name: 'Fundação e Estrutura',    period: '06/01 – 31/03/25', pct: 90, status: 'em progresso', responsible: 'Carlos Mendes' },
      { name: 'Instalações Elétricas',   period: '04/02 – 30/06/25', pct: 0,  status: 'pendente',     responsible: 'Roberto Lima' },
      { name: 'Cobertura e Vedação',     period: '01/05 – 31/08/25', pct: 0,  status: 'pendente',     responsible: 'Construtora Ho.' },
      { name: 'Instalações Hidráulicas', period: '01/07 – 30/09/25', pct: 0,  status: 'pendente',     responsible: 'Paulo Nascimento' },
      { name: 'Acabamentos e Entrega',   period: '01/09 – 31/10/25', pct: 0,  status: 'pendente',     responsible: 'Carlos Mendes' },
    ],
  },
  {
    id: 'p2',
    name: 'Sistema ERP Corporativo',
    client: 'TechSoft Soluções',
    color: '#7C3AED',
    period: '01/02 – 30/11/25',
    pct: 48,
    status: 'em progresso',
    responsible: 'Ana Beatriz',
    tasks: [
      { name: 'Levantamento de Requisitos', period: '01/02 – 31/03/25', pct: 100, status: 'concluído',    responsible: 'Ana Beatriz' },
      { name: 'Desenvolvimento do Sistema', period: '17/03 – 30/07/25', pct: 45,  status: 'em progresso', responsible: 'Equipe Dev' },
      { name: 'Testes e Homologação',       period: '01/09 – 30/11/25', pct: 0,   status: 'pendente',     responsible: 'QA TechSoft' },
    ],
  },
  {
    id: 'p3',
    name: 'Reforma da Sede Corporativa',
    client: 'Arquitetura & Design SL',
    color: '#06C18A',
    period: '01/06 – 31/12/25',
    pct: 5,
    status: 'planejamento',
    responsible: 'Marcos Oliveira',
    tasks: [
      { name: 'Projeto Arquitetônico',    period: '01/06 – 31/12/25', pct: 7, status: 'em progresso', responsible: 'Marcos Oliveira' },
      { name: 'Obras Civis',              period: '01/08 – 31/10/25', pct: 0, status: 'pendente',     responsible: 'Construtora Hil.' },
      { name: 'Mobiliário e Acabamentos', period: '01/11 – 31/12/25', pct: 0, status: 'pendente',     responsible: 'Fornecedor Móv.' },
    ],
  },
]

// ─── Status badge ────────────────────────────────────────────────────────────
const statusCfg: Record<TaskStatus, { color: string; bg: string; border: string; label: string }> = {
  'em progresso': { color: '#4d82ff', bg: '#0e1d3a', border: '#1e3a7a', label: 'em progresso' },
  'concluído':    { color: '#06C18A', bg: '#0a2520', border: '#0f4030', label: 'concluído' },
  'pendente':     { color: '#8a9ab8', bg: '#151f30', border: '#1c2c45', label: 'pendente' },
  'planejamento': { color: '#a78bfa', bg: '#1a1040', border: '#2d1a6b', label: 'planejamento' },
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const c = statusCfg[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1c2c45' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: pct === 100 ? '#06C18A' : color }}
        />
      </div>
      <span className="text-[11px] w-6 text-right flex-shrink-0" style={{ color: '#8a9ab8' }}>{pct}%</span>
    </div>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <>
      {/* Project header row */}
      <tr
        className="cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
        style={{ borderBottom: '1px solid #1c2c45' }}
        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
      >
        <td className="pl-4 pr-2 py-3" style={{ width: 32 }}>
          <input type="checkbox" className="w-3.5 h-3.5 cursor-pointer accent-[#4d82ff]" onClick={e => e.stopPropagation()} readOnly />
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2.5">
            {/* Expand caret */}
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className="transition-transform flex-shrink-0"
              style={{ color: '#546278', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* Color dot */}
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: project.color }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#e8ecf4' }}>{project.name}</p>
              <p className="text-[11px] truncate" style={{ color: '#546278' }}>{project.client}</p>
            </div>
          </div>
        </td>
        <td className="py-3 pr-6 text-[11px] whitespace-nowrap" style={{ color: '#546278' }}>{project.period}</td>
        <td className="py-3 pr-6" style={{ minWidth: 120 }}>
          <ProgressBar pct={project.pct} color={project.color} />
        </td>
        <td className="py-3 pr-6">
          <StatusBadge status={project.status} />
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <Avatar name={project.responsible} size="xs" />
            <span className="text-xs" style={{ color: '#8a9ab8' }}>{project.responsible}</span>
          </div>
        </td>
      </tr>

      {/* Sub-tasks */}
      {expanded && project.tasks.map((task, i) => (
        <tr
          key={i}
          className="transition-colors"
          style={{ borderBottom: '1px solid #162032' }}
          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.015)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
        >
          <td className="pl-4 pr-2 py-2">
            <input type="checkbox" className="w-3.5 h-3.5 cursor-pointer accent-[#4d82ff]" readOnly />
          </td>
          <td className="py-2 pr-4">
            <div className="flex items-center gap-2.5 pl-8">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: project.color, opacity: 0.5 }} />
              <span className="text-xs truncate" style={{ color: '#8a9ab8' }}>{task.name}</span>
            </div>
          </td>
          <td className="py-2 pr-6 text-[11px] whitespace-nowrap" style={{ color: '#3a4d65' }}>{task.period}</td>
          <td className="py-2 pr-6" style={{ minWidth: 120 }}>
            <ProgressBar pct={task.pct} color={project.color} />
          </td>
          <td className="py-2 pr-6">
            <StatusBadge status={task.status} />
          </td>
          <td className="py-2 pr-4">
            <div className="flex items-center gap-2">
              <Avatar name={task.responsible} size="xs" />
              <span className="text-[11px] truncate max-w-[90px]" style={{ color: '#546278' }}>{task.responsible}</span>
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectsListPage() {
  const [newProjOpen, setNewProjOpen] = useState(false)
  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0)
  const inProgress = projects.filter(p => p.status === 'em progresso').length
  const done = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === 'concluído').length, 0)

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-page, #0d1321)' }}>
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1c2c45' }}>
        <div>
          <h1 className="text-base font-bold" style={{ color: '#e8ecf4' }}>Projetos & Tarefas</h1>
          <p className="text-xs mt-0.5" style={{ color: '#546278' }}>
            {projects.length} projetos &nbsp;·&nbsp; {inProgress} em progresso &nbsp;·&nbsp; {totalTasks} tarefas &nbsp;·&nbsp; {done} concluída{done !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setNewProjOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:brightness-110"
          style={{ background: '#4d82ff' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1c2c45', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ width: 32 }} />
              {['Nome', 'Período', 'Progresso', 'Status', 'Responsável'].map(h => (
                <th
                  key={h}
                  className="py-2.5 pr-6 text-left text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#546278' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => <ProjectRow key={p.id} project={p} />)}
          </tbody>
        </table>
      </div>
    </div>
    {newProjOpen && <NewProjectModal onClose={()=>setNewProjOpen(false)} onSuccess={()=>setNewProjOpen(false)} />}
    </>
  )
}
