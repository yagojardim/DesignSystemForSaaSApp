import { useState } from 'react'
import { T as DS } from '../components/ds/tokens'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { CompleteSprintModal } from '../components/CompleteSprintModal'
import { getActiveUser } from '../data/session'
import { can } from '../data/permissions'

// ─── RULE annotations ────────────────────────────────────────────────────────
// RULE 1: "planejado não é sobrescrito" — planned sprint data is immutable until explicitly started
// RULE 2: "coluna tem nome próprio independente do status" — BOARD_COLS[].label != status label
// RULE 3: "issue sem status mapeado cai em 'Não mapeados'" — catch-all column for unmapped statuses

// ─── Types ────────────────────────────────────────────────────────────────────
type IssueType   = 'story' | 'bug' | 'task' | 'subtask' | 'epic' | 'feature'
type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
type Priority    = 'critical' | 'high' | 'medium' | 'low'

interface Issue {
  key:      string
  type:     IssueType
  title:    string
  status:   IssueStatus
  priority: Priority
  labels:   string[]
  assignee: string
  dueDate:  string
  points:   number
  epic?:    string
  sprint?:  string        // sprint id
  blocked?: boolean
  delayed?: boolean
}

interface SprintDef {
  id:          string
  name:        string
  goal?:       string
  start:       string
  end:         string
  state:       'active' | 'planned' | 'completed'
  velocity?:   number
  completedAt?: string
}

// Module-level audit log (session-persistent mock)
const _SPRINT_AUDIT: { ts: string; who: string; action: string }[] = []

// ─── Board column definitions ─────────────────────────────────────────────────
// RULE 2 — label is independent; statuses[] is the mapping
// BoardCol interface replaced by ColState inside BoardTab (editable columns)

// BOARD_COLS and UNMAPPED_COL moved to BoardTab as INITIAL_COLS (editable per session)

// ─── Sprints ──────────────────────────────────────────────────────────────────
const SPRINTS: SprintDef[] = [
  { id: 's13', name: 'Sprint 13', goal: 'Tokens, CI e teardown competitivo', start: '01/04', end: '14/04', state: 'completed', velocity: 22 },
  { id: 's14', name: 'Sprint 14', goal: 'Homepage responsiva + correção de bugs críticos mobile', start: '15/04', end: '28/04', state: 'active' },
  { id: 's15', name: 'Sprint 15', goal: '',  start: '29/04', end: '12/05', state: 'planned' },
]

// ─── Issues ───────────────────────────────────────────────────────────────────
const INIT_ISSUES: Issue[] = [
  // Sprint 14 (active)
  { key:'PM-101', type:'story',   title:'Homepage hero — layout explorations',         status:'in-progress', priority:'high',     labels:['Design','Hero'],    assignee:'AL', dueDate:'Abr 4',  points:5, epic:'EP-01', sprint:'s14' },
  { key:'PM-102', type:'bug',     title:'Login form validation falha no mobile',        status:'in-progress', priority:'critical', labels:['Eng'],              assignee:'JN', dueDate:'Abr 3',  points:3, epic:'EP-02', sprint:'s14', blocked:true },
  { key:'PM-103', type:'task',    title:'Configurar Storybook para componentes',        status:'in-progress', priority:'medium',   labels:['Eng'],              assignee:'LF', dueDate:'Abr 6',  points:2, epic:'EP-02', sprint:'s14' },
  { key:'PM-104', type:'story',   title:'Breakpoints responsivos — hero + feature grid',status:'in-progress', priority:'high',     labels:['Design','Mobile'],  assignee:'CS', dueDate:'Abr 3',  points:8, epic:'EP-01', sprint:'s14', delayed:true },
  { key:'PM-105', type:'bug',     title:'Footer sobrepõe conteúdo no Safari',           status:'todo',        priority:'medium',   labels:['Eng','Web'],        assignee:'NM', dueDate:'Abr 10', points:2, epic:'EP-02', sprint:'s14' },
  { key:'PM-107', type:'task',    title:'Spec de nav + componente footer',              status:'in-review',   priority:'low',      labels:['Design'],           assignee:'AL', dueDate:'Abr 3',  points:3, epic:'EP-01', sprint:'s14' },
  { key:'PM-108', type:'story',   title:'UX study: design Northwind',                  status:'in-review',   priority:'medium',   labels:['UX','SEO'],         assignee:'JN', dueDate:'Abr 5',  points:5, epic:'EP-03', sprint:'s14' },
  // Sprint 15 (planned) — RULE 1: not overwritten by board actions
  { key:'PM-106', type:'story',   title:'Copywriting da página de preços v2',          status:'backlog',     priority:'high',     labels:['Content'],          assignee:'NM', dueDate:'Abr 22', points:5, epic:'EP-03', sprint:'s15' },
  { key:'PM-109', type:'story',   title:'Entrevistas com 5 clientes trial',            status:'backlog',     priority:'medium',   labels:['Research'],         assignee:'JN', dueDate:'Abr 16', points:5, epic:'EP-03', sprint:'s15' },
  { key:'PM-110', type:'task',    title:'Auditoria de a11y nas páginas de marketing',  status:'backlog',     priority:'medium',   labels:['Design','Web'],     assignee:'AL', dueDate:'Abr 12', points:3, epic:'EP-01', sprint:'s15' },
  // Completed
  { key:'PM-111', type:'story',   title:'Teardown competitivo — 8 sites',              status:'done',        priority:'low',      labels:['Research'],         assignee:'RM', dueDate:'Mar 28', points:3, epic:'EP-03', sprint:'s13' },
  { key:'PM-112', type:'task',    title:'Finalizar tokens de cor + tipografia',        status:'done',        priority:'medium',   labels:['Brand'],            assignee:'NM', dueDate:'Mar 28', points:2, epic:'EP-01', sprint:'s13' },
  { key:'PM-113', type:'task',    title:'Scaffolding do repositório + CI pipeline',    status:'done',        priority:'high',     labels:['Eng'],              assignee:'LF', dueDate:'Mar 22', points:2, epic:'EP-02', sprint:'s13' },
  // Backlog (no sprint)
  { key:'PM-114', type:'story',   title:'Auditoria de metadata SEO',                  status:'backlog',     priority:'low',      labels:['SEO'],              assignee:'RM', dueDate:'Mai 5',  points:3, epic:'EP-03' },
  { key:'PM-115', type:'subtask', title:'Escrever copy do hero principal',             status:'backlog',     priority:'low',      labels:['Content'],          assignee:'NM', dueDate:'Abr 8',  points:1, epic:'EP-01' },
  { key:'PM-116', type:'feature', title:'Sistema de busca do portal',                 status:'backlog',     priority:'medium',   labels:['Eng'],              assignee:'LF', dueDate:'Mai 20', points:8, epic:'EP-02' },
]

const EPICS = [
  { id:'EP-01', key:'EP-01', label:'Website Relaunch',    color: DS.accent  },
  { id:'EP-02', key:'EP-02', label:'Infra & Eng',         color: DS.warn    },
  { id:'EP-03', key:'EP-03', label:'Pesquisa & Conteúdo', color: DS.purple  },
]

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  bg:       DS.bgPage,
  surface:  DS.bgSurface,
  surface2: DS.bgSurface2,
  border:   DS.border,
  border2:  DS.border2,
  t1:       DS.text1,
  t2:       DS.text2,
  t3:       DS.text3,
}

const LABEL_STYLE: Record<string, { bg: string; color: string }> = {
  Design:   { bg: DS.accentDim,   color: DS.accent  },
  Web:      { bg: DS.neutralDim,  color: DS.text2   },
  Research: { bg: DS.purpleDim,   color: DS.purple  },
  Content:  { bg: DS.warnDim,     color: DS.warn    },
  Hero:     { bg: DS.neutralDim,  color: DS.text2   },
  Mobile:   { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  Eng:      { bg: DS.successDim,  color: DS.success },
  UX:       { bg: DS.successDim,  color: '#14b8a6'  },
  SEO:      { bg: DS.critDim,     color: DS.crit    },
  Brand:    { bg: DS.purpleDim,   color: DS.purple  },
}

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: DS.crit, high: DS.warn, medium: DS.accent, low: DS.text3,
}

const AV_COLOR: Record<string, string> = {
  AL: DS.accent, NM: DS.purple, JN: DS.warn, CS: DS.success, RM: DS.crit, LF: '#f97316',
}

// ─── Small atoms ─────────────────────────────────────────────────────────────
function Av({ i, size = 20 }: { i: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, background: AV_COLOR[i] ?? DS.text3, outline: `2px solid ${S.surface}` }}
    >
      {i}
    </span>
  )
}

function LabelChip({ name }: { name: string }) {
  const c = LABEL_STYLE[name] ?? { bg: S.surface2, color: S.t2 }
  return (
    <span className="text-[9px] font-semibold px-1 py-px rounded-md" style={{ background: c.bg, color: c.color }}>
      {name}
    </span>
  )
}

function PriorityDot({ p }: { p: Priority }) {
  const icons: Record<Priority, string> = { critical: '↑↑', high: '↑', medium: '→', low: '↓' }
  return <span className="text-[9px] font-bold" style={{ color: PRIORITY_COLOR[p] }}>{icons[p]}</span>
}

function TypeIcon({ t }: { t: IssueType }) {
  const map: Record<IssueType, { label: string; color: string }> = {
    story:   { label: '◇', color: DS.accent  },
    bug:     { label: '⬟', color: DS.crit    },
    task:    { label: '☑', color: DS.text2   },
    subtask: { label: '◻', color: DS.text3   },
    epic:    { label: '⚡', color: DS.warn    },
    feature: { label: '▣', color: DS.purple  },
  }
  const m = map[t]
  return <span className="text-[11px] flex-shrink-0" style={{ color: m.color }}>{m.label}</span>
}

// ─── Iniciar Sprint modal ─────────────────────────────────────────────────────
interface StartSprintModalProps {
  sprint: SprintDef
  onConfirm: (id: string, goal: string) => void
  onClose: () => void
}

function StartSprintModal({ sprint, onConfirm, onClose }: StartSprintModalProps) {
  const [name, setName]         = useState(sprint.name)
  const [durType, setDurType]   = useState<'weeks' | 'days'>('weeks')
  const [durVal, setDurVal]     = useState(2)
  const [startDate, setStart]   = useState(sprint.start)
  const [endDate, setEnd]       = useState(sprint.end)
  const [goal, setGoal]         = useState(sprint.goal ?? '')

  const issueCount = INIT_ISSUES.filter(i => i.sprint === sprint.id).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-rise"
      style={{ background: 'rgba(8,10,14,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ width: 520, background: DS.bgSurface, border: `1px solid ${DS.border2}`, boxShadow: DS.shadowModal }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: DS.text1 }}>Iniciar Sprint</p>
            <p className="text-[12px] mt-0.5" style={{ color: DS.text3 }}>{issueCount} issues · {sprint.start} → {sprint.end}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-lg leading-none"
            style={{ color: DS.text3 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = DS.bgSurface2 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >×</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: DS.text3 }}>Nome do Sprint</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-9 px-3 text-[13px] rounded-lg border outline-none"
              style={{ background: DS.bgSurface2, border: `1px solid ${DS.border}`, color: DS.text1 }}
              onFocus={e => { e.currentTarget.style.borderColor = DS.accent }}
              onBlur={e => { e.currentTarget.style.borderColor = DS.border }}
            />
          </div>

          {/* Duration */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-semibold" style={{ color: DS.text3 }}>Duração</label>
              <div className="flex gap-2">
                <input
                  type="number" min={1} max={8}
                  value={durVal}
                  onChange={e => setDurVal(Number(e.target.value))}
                  className="w-16 h-9 px-2 text-[13px] rounded-lg border outline-none text-center"
                  style={{ background: DS.bgSurface2, border: `1px solid ${DS.border}`, color: DS.text1 }}
                  onFocus={e => { e.currentTarget.style.borderColor = DS.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = DS.border }}
                />
                <div
                  className="flex rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${DS.border}` }}
                >
                  {(['weeks', 'days'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setDurType(t)}
                      className="px-3 py-1 text-[12px] font-medium transition-colors"
                      style={{
                        background: durType === t ? `${DS.accent}22` : DS.bgSurface2,
                        color: durType === t ? DS.accent : DS.text2,
                      }}
                    >
                      {t === 'weeks' ? 'Semanas' : 'Dias'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-semibold" style={{ color: DS.text3 }}>Data de início</label>
              <input
                value={startDate}
                onChange={e => setStart(e.target.value)}
                className="h-9 px-3 text-[13px] rounded-lg border outline-none"
                style={{ background: DS.bgSurface2, border: `1px solid ${DS.border}`, color: DS.text1, colorScheme: 'dark' }}
                onFocus={e => { e.currentTarget.style.borderColor = DS.accent }}
                onBlur={e => { e.currentTarget.style.borderColor = DS.border }}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-semibold" style={{ color: DS.text3 }}>Data de término</label>
              <input
                value={endDate}
                onChange={e => setEnd(e.target.value)}
                className="h-9 px-3 text-[13px] rounded-lg border outline-none"
                style={{ background: DS.bgSurface2, border: `1px solid ${DS.border}`, color: DS.text1, colorScheme: 'dark' }}
                onFocus={e => { e.currentTarget.style.borderColor = DS.accent }}
                onBlur={e => { e.currentTarget.style.borderColor = DS.border }}
              />
            </div>
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold" style={{ color: DS.text3 }}>
              Meta do Sprint <span style={{ color: DS.text3, fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              rows={2}
              placeholder="Descreva o objetivo principal deste sprint..."
              className="px-3 py-2 text-[13px] rounded-lg border outline-none resize-none"
              style={{
                background: DS.bgSurface2, border: `1px solid ${DS.border}`,
                color: DS.text1, fontFamily: 'inherit',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = DS.accent }}
              onBlur={e => { e.currentTarget.style.borderColor = DS.border }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button
            onClick={onClose}
            className="h-8 px-4 text-[13px] font-medium rounded-lg transition-colors"
            style={{ color: DS.text2 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = DS.bgSurface2 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(sprint.id, goal)}
            className="h-8 px-4 text-[13px] font-semibold rounded-lg text-white transition-all"
            style={{ background: DS.accent }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
          >
            Iniciar Sprint
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Board card ───────────────────────────────────────────────────────────────
function BoardCard({ issue, dragging, onDragStart, onDragEnd }: {
  issue: Issue
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isDelayed = issue.delayed
  const isBlocked = issue.blocked

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? DS.bgSurface2 : S.surface,
        border: isBlocked
          ? `1.5px solid ${DS.crit}`
          : isDelayed
          ? `1.5px solid ${DS.warn}`
          : `1px solid ${hovered ? S.border2 : S.border}`,
        borderRadius: 10,
        padding: '9px 11px',
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.15)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'all 0.12s',
      }}
    >
      {/* Blocked / delayed banner */}
      {isBlocked && (
        <div className="flex items-center gap-1 text-[9px] font-bold mb-2 px-1.5 py-px rounded w-fit" style={{ background: DS.critDim, color: DS.crit }}>
          ⛔ BLOQUEADO
        </div>
      )}
      {!isBlocked && isDelayed && (
        <div className="flex items-center gap-1 text-[9px] font-bold mb-2 px-1.5 py-px rounded w-fit" style={{ background: DS.warnDim, color: DS.warn }}>
          ⚠ ATRASADO
        </div>
      )}

      {/* Type + key */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <TypeIcon t={issue.type} />
        <span className="text-[10px] font-mono" style={{ color: S.t3 }}>{issue.key}</span>
        <span className="ml-auto">
          <PriorityDot p={issue.priority} />
        </span>
      </div>

      {/* Title */}
      <p className="text-[12px] font-medium leading-snug mb-2" style={{ color: S.t1 }}>
        {issue.title}
      </p>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-2">
          {issue.labels.map(l => <LabelChip key={l} name={l} />)}
        </div>
      )}

      {/* Footer: due date + points + assignee */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] flex items-center gap-0.5"
          style={{ color: isDelayed ? DS.warn : isBlocked ? DS.crit : S.t3 }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <rect x="1" y="1.5" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1"/>
            <path d="M3 1v1.5M6 1v1.5M1 3.5h7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          {issue.dueDate}
        </span>
        <span
          className="text-[9px] font-bold px-1 py-px rounded ml-auto"
          style={{ background: S.surface2, color: S.t3 }}
        >
          {issue.points}pt
        </span>
        {issue.assignee && <Av i={issue.assignee} size={18} />}
      </div>
    </div>
  )
}

// ─── Board tab ────────────────────────────────────────────────────────────────
type SwimlaneMode = 'none' | 'assignee' | 'epic'


// ─── BoardTab ─────────────────────────────────────────────────────────────────
// RULES (board column behavior):
// • Card criado via "+" herda status da coluna e entra no TOPO — não altera
//   o status das issues já existentes.
// • Nome da coluna ≠ nome do status (coluna mapeia 1+ statuses).
// • Reordenar colunas muda a ordem do fluxo, NÃO os statuses das issues.
// • Remover/remapear nunca faz issue sumir — cai em "Não mapeados".
// • Editar colunas (renomear/remover/reordenar) requer permissão Admin.

interface ColState {
  id:       string
  label:    string
  statuses: IssueStatus[]
  wip?:     number
  dot:      string
}

const INITIAL_COLS: ColState[] = [
  { id:'backlog', label:'Backlog',      statuses:['backlog'],     dot:DS.text3  },
  { id:'todo',    label:'A Fazer',      statuses:['todo'],        dot:DS.text2, wip:5 },
  { id:'doing',   label:'Em andamento', statuses:['in-progress'], dot:DS.accent, wip:4 },
  { id:'review',  label:'Em revisão',   statuses:['in-review'],   dot:DS.warn,  wip:3 },
  { id:'done',    label:'Concluído',    statuses:['done'],        dot:DS.success },
]

let _issueSeq = 200

function BoardTab({ issues, setIssues, onCreateIssue }: {
  issues: Issue[]
  setIssues: (fn: (prev: Issue[]) => Issue[]) => void
  onCreateIssue: () => void
}) {
  // ── column config state ──────────────────────────────────────────────────
  const [cols, setCols]             = useState<ColState[]>(INITIAL_COLS)
  const [colOrder, setColOrder]     = useState<string[]>(INITIAL_COLS.map(c=>c.id))
  // drag-to-reorder columns
  const [draggingCol, setDraggingCol]   = useState<string|null>(null)
  const [dragOverColHeader, setDragOverColHeader] = useState<string|null>(null)
  // drag cards between columns
  const [draggingCard, setDraggingCard] = useState<string|null>(null)
  const [dragOverCol,  setDragOver]     = useState<string|null>(null)
  // inline card composer per column
  const [composerCol,  setComposerCol]  = useState<string|null>(null)
  const [composerText, setComposerText] = useState('')
  // inline column rename
  const [editingColId, setEditingColId] = useState<string|null>(null)
  const [editingColLabel, setEditingColLabel] = useState('')
  // column ⋯ menu
  const [menuColId, setMenuColId]       = useState<string|null>(null)
  // remove confirmation
  const [removeColId, setRemoveColId]   = useState<string|null>(null)
  // WIP editor
  const [wipColId, setWipColId]         = useState<string|null>(null)
  const [wipValue,  setWipValue]        = useState('')
  // filters
  const [activeSprint, setActiveSprint] = useState('s14')
  const [swimlane, setSwimlane]     = useState<SwimlaneMode>('none')
  const [filterAssignees, setFilterA] = useState<string[]>([])
  const [filterPriority, setFilterP]  = useState<Priority[]>([])
  const [filterType, setFilterType]   = useState<IssueType[]>([])

  const sprintIssues = issues.filter(i => i.sprint === activeSprint)
  const filtered = sprintIssues.filter(i => {
    if (filterAssignees.length && !filterAssignees.includes(i.assignee)) return false
    if (filterPriority.length && !filterPriority.includes(i.priority)) return false
    if (filterType.length && !filterType.includes(i.type)) return false
    return true
  })

  const orderedCols = colOrder.map(id => cols.find(c=>c.id===id)!).filter(Boolean)
  const mappedStatuses = new Set(orderedCols.flatMap(c=>c.statuses))
  const hasUnmapped = filtered.some(i => !mappedStatuses.has(i.status))

  function getColIssues(col: ColState) {
    if (col.id === 'unmapped') return filtered.filter(i => !mappedStatuses.has(i.status))
    return filtered.filter(i => col.statuses.includes(i.status))
  }

  // ── card drag ───────────────────────────────────────────────────────────
  function handleCardDrop(col: ColState) {
    if (!draggingCard) return
    const newStatus = col.statuses[0] ?? ('todo' as IssueStatus)
    setIssues(prev => prev.map(i => i.key === draggingCard ? { ...i, status: newStatus } : i))
    setDraggingCard(null); setDragOver(null)
  }

  // ── column reorder drag ──────────────────────────────────────────────────
  function handleColDrop(targetId: string) {
    if (!draggingCol || draggingCol === targetId) { setDraggingCol(null); setDragOverColHeader(null); return }
    setColOrder(prev => {
      const arr = [...prev]
      const from = arr.indexOf(draggingCol)
      const to   = arr.indexOf(targetId)
      arr.splice(from, 1)
      arr.splice(to, 0, draggingCol)
      return arr
    })
    setDraggingCol(null); setDragOverColHeader(null)
  }

  // ── inline quick-create ──────────────────────────────────────────────────
  function openComposer(colId: string) {
    setComposerCol(colId); setComposerText(''); setMenuColId(null)
  }
  function submitComposer(col: ColState) {
    const title = composerText.trim()
    if (!title) { setComposerCol(null); return }
    const newStatus = col.statuses[0] ?? ('todo' as IssueStatus)
    const newIssue: Issue = {
      key: `PM-${++_issueSeq}`, type:'story', title, status: newStatus,
      priority:'medium', labels:[], assignee:'AL', dueDate:'', points:0, sprint:'s14',
    }
    setIssues(prev => [newIssue, ...prev])
    setComposerText('')
    // keep composer open for chaining — user hits Esc to close
  }

  // ── column rename ────────────────────────────────────────────────────────
  function startRename(col: ColState) {
    setEditingColId(col.id); setEditingColLabel(col.label); setMenuColId(null)
  }
  function saveRename() {
    if (!editingColId) return
    const label = editingColLabel.trim()
    if (label) setCols(prev => prev.map(c => c.id===editingColId ? {...c, label} : c))
    setEditingColId(null)
  }

  // ── move col (← →) ──────────────────────────────────────────────────────
  function moveCol(id: string, dir: -1|1) {
    setColOrder(prev => {
      const arr = [...prev]; const idx = arr.indexOf(id)
      const to = idx + dir
      if (to < 0 || to >= arr.length) return arr
      ;[arr[idx], arr[to]] = [arr[to], arr[idx]]
      return arr
    }); setMenuColId(null)
  }

  // ── remove column ────────────────────────────────────────────────────────
  function confirmRemove() {
    if (!removeColId) return
    setCols(prev => prev.filter(c=>c.id!==removeColId))
    setColOrder(prev => prev.filter(id=>id!==removeColId))
    setRemoveColId(null)
  }

  // ── WIP limit ────────────────────────────────────────────────────────────
  function saveWip() {
    if (!wipColId) return
    const val = parseInt(wipValue)
    setCols(prev => prev.map(c => c.id===wipColId ? {...c, wip: isNaN(val)||val<1 ? undefined : val} : c))
    setWipColId(null)
  }

  const ASSIGNEES = ['AL','NM','JN','CS','RM','LF']
  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]
  }
  const swimlaneKeys: string[] = swimlane==='none' ? ['_all']
    : swimlane==='assignee' ? [...new Set(filtered.map(i=>i.assignee))].sort()
    : [...new Set(filtered.map(i=>i.epic ?? 'Sem épico'))]

  const visibleCols = hasUnmapped
    ? [...orderedCols, {id:'unmapped',label:'⚠ Não mapeados',statuses:[],dot:DS.crit} as ColState]
    : orderedCols

  return (
    <div className="flex flex-col h-full overflow-hidden" onClick={()=>{if(menuColId)setMenuColId(null)}}>
      {/* ── Quick filters ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto flex-shrink-0"
        style={{ background:S.surface, borderBottom:`1px solid ${S.border}` }}>
        <select value={activeSprint} onChange={e=>setActiveSprint(e.target.value)}
          className="h-7 px-2 text-[11px] rounded-lg border outline-none appearance-none pr-5 font-[inherit]"
          style={{ background:S.surface2, border:`1px solid ${S.border}`, color:DS.accent }}>
          {SPRINTS.filter(s=>s.state!=='completed').map(s=>(
            <option key={s.id} value={s.id} style={{ background:S.surface2 }}>{s.name} {s.state==='active'?'▶':''}</option>
          ))}
        </select>
        <div className="w-px h-4 flex-shrink-0" style={{ background:S.border }}/>
        <div className="flex items-center gap-1">
          {ASSIGNEES.map(a=>(
            <button key={a} onClick={()=>setFilterA(prev=>toggleArr(prev,a))}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-all"
              style={{ background:AV_COLOR[a]??DS.text3, opacity:filterAssignees.length===0||filterAssignees.includes(a)?1:.3, outline:filterAssignees.includes(a)?'2px solid white':'2px solid transparent' }}>
              {a}
            </button>
          ))}
        </div>
        <div className="w-px h-4 flex-shrink-0" style={{ background:S.border }}/>
        {(['critical','high','medium','low'] as Priority[]).map(p=>(
          <button key={p} onClick={()=>setFilterP(prev=>toggleArr(prev,p))}
            className="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all"
            style={{ background:filterPriority.includes(p)?`${PRIORITY_COLOR[p]}22`:S.surface2, color:filterPriority.includes(p)?PRIORITY_COLOR[p]:S.t3, border:`1px solid ${filterPriority.includes(p)?`${PRIORITY_COLOR[p]}50`:S.border}` }}>
            <PriorityDot p={p}/>{p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
        <div className="w-px h-4 flex-shrink-0" style={{ background:S.border }}/>
        {(['story','bug','task'] as IssueType[]).map(t=>(
          <button key={t} onClick={()=>setFilterType(prev=>toggleArr(prev,t))}
            className="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all"
            style={{ background:filterType.includes(t)?S.surface2:'transparent', border:`1px solid ${filterType.includes(t)?S.border2:'transparent'}`, color:filterType.includes(t)?S.t1:S.t3 }}>
            <TypeIcon t={t}/> {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color:S.t3 }}>Agrupar:</span>
          {(['none','assignee','epic'] as SwimlaneMode[]).map(m=>(
            <button key={m} onClick={()=>setSwimlane(m)}
              className="h-6 px-2 rounded-md text-[10px] font-medium transition-colors"
              style={{ background:swimlane===m?`${DS.accent}20`:'transparent', color:swimlane===m?DS.accent:S.t3 }}>
              {m==='none'?'Nenhum':m==='assignee'?'Responsável':'Épico'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Board area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: visibleCols.length*224+80 }}>

          {visibleCols.map((col) => {
            const colIssues  = getColIssues(col)
            const isCardOver = dragOverCol === col.id
            const isColOver  = dragOverColHeader === col.id && draggingCol && draggingCol !== col.id
            const wipOver    = col.wip != null && colIssues.length > col.wip
            const colIdx2 = colOrder.indexOf(col.id)

            return (
              <div key={col.id}
                className="flex flex-col flex-shrink-0"
                style={{ width:212, opacity: draggingCol===col.id ? 0.45 : 1 }}>

                {/* ── Column header ────────────────────────────────────── */}
                <div
                  draggable={col.id !== 'unmapped'}
                  onDragStart={()=>{ if(col.id!=='unmapped') setDraggingCol(col.id) }}
                  onDragEnd={()=>{ setDraggingCol(null); setDragOverColHeader(null) }}
                  onDragOver={e=>{ e.preventDefault(); if(draggingCol && draggingCol!==col.id) setDragOverColHeader(col.id) }}
                  onDragLeave={()=>setDragOverColHeader(null)}
                  onDrop={()=>handleColDrop(col.id)}
                  className="flex items-center justify-between mb-2 px-1 rounded-lg transition-all"
                  style={{
                    cursor: col.id!=='unmapped' ? 'grab' : 'default',
                    padding:'4px 6px',
                    background: isColOver ? `${DS.accent}18` : 'transparent',
                    border: isColOver ? `1.5px dashed ${DS.accent}` : '1.5px dashed transparent',
                  }}>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:col.dot }}/>
                    {editingColId === col.id ? (
                      <input
                        autoFocus
                        value={editingColLabel}
                        onChange={e=>setEditingColLabel(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={e=>{ if(e.key==='Enter') saveRename(); if(e.key==='Escape'){setEditingColId(null)} }}
                        onClick={e=>e.stopPropagation()}
                        className="text-[10px] font-bold uppercase tracking-wider outline-none bg-transparent border-b flex-1"
                        style={{ color:S.t1, borderColor:DS.accent, minWidth:0 }}
                      />
                    ) : (
                      <span
                        onDoubleClick={()=>col.id!=='unmapped' && startRename(col)}
                        title="Clique duplo para renomear"
                        className="text-[10px] font-bold uppercase tracking-wider truncate"
                        style={{ color:S.t2, cursor:'text' }}>
                        {col.label}
                      </span>
                    )}
                    <span className="text-[9px] font-bold px-1.5 py-px rounded-full flex-shrink-0"
                      style={{ background:wipOver?DS.critDim:DS.accentDim, color:wipOver?DS.crit:DS.accent }}>
                      {colIssues.length}{col.wip?`/${col.wip}`:''}
                    </span>
                    {wipOver && (
                      <span className="text-[8px] font-bold px-1 py-px rounded flex-shrink-0" style={{ background:DS.critDim,color:DS.crit }}>WIP</span>
                    )}
                  </div>

                  {/* Header actions */}
                  {col.id !== 'unmapped' && (
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                      {/* Quick "+" — opens inline composer */}
                      <button
                        onClick={e=>{ e.stopPropagation(); openComposer(col.id) }}
                        title="Criar issue nesta coluna"
                        className="w-5 h-5 flex items-center justify-center rounded transition-colors text-[15px] leading-none"
                        style={{ color:S.t3 }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=S.surface2;(e.currentTarget as HTMLButtonElement).style.color=S.t1}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.color=S.t3}}>
                        +
                      </button>
                      {/* ⋯ menu */}
                      <div className="relative">
                        <button
                          onClick={e=>{ e.stopPropagation(); setMenuColId(menuColId===col.id?null:col.id) }}
                          className="w-5 h-5 flex items-center justify-center rounded transition-colors text-[13px]"
                          style={{ color:S.t3 }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=S.surface2;(e.currentTarget as HTMLButtonElement).style.color=S.t1}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.color=S.t3}}>
                          ⋯
                        </button>
                        {menuColId === col.id && (
                          <div onClick={e=>e.stopPropagation()}
                            style={{ position:'absolute',right:0,top:'110%',zIndex:50,width:168,background:S.surface,border:`1px solid ${S.border2}`,borderRadius:10,boxShadow:DS.shadowModal,padding:'4px 0',overflow:'hidden' }}>
                            {[
                              { label:'Renomear',       icon:'✏️', action:()=>startRename(col) },
                              { label:'Mover ‹ (esq.)', icon:'◀', action:()=>moveCol(col.id,-1), disabled:colIdx2<=0 },
                              { label:'Mover › (dir.)', icon:'▶', action:()=>moveCol(col.id,1),  disabled:colIdx2>=colOrder.length-1 },
                              { label:'Limite WIP',     icon:'⚡', action:()=>{ setWipColId(col.id); setWipValue(col.wip?.toString()??''); setMenuColId(null) } },
                              null, // separator
                              { label:'Remover coluna', icon:'🗑', action:()=>{ setRemoveColId(col.id); setMenuColId(null) }, danger:true },
                            ].map((item,i)=>{
                              if (!item) return <div key={i} style={{ height:1, background:S.border, margin:'3px 0' }}/>
                              const it = item as {label:string;icon:string;action:()=>void;disabled?:boolean;danger?:boolean}
                              return (
                                <button key={it.label} onClick={()=>{ if(!it.disabled) it.action() }}
                                  style={{ width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:'transparent',border:'none',cursor:it.disabled?'not-allowed':'pointer',color:it.danger?DS.crit:it.disabled?S.t3:S.t2,fontSize:12,textAlign:'left' }}
                                  onMouseEnter={e=>{ if(!it.disabled&&!it.danger)(e.currentTarget as HTMLButtonElement).style.background=S.surface2 }}
                                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>
                                  <span style={{ fontSize:11 }}>{it.icon}</span>{it.label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Drop zone + cards ─────────────────────────────── */}
                <div className="flex flex-col gap-2 flex-1 rounded-xl p-1.5 transition-all"
                  style={{ background:isCardOver?`${DS.accent}10`:'transparent', border:isCardOver?`1.5px dashed ${DS.accent}`:'1.5px dashed transparent', minHeight:80 }}
                  onDragOver={e=>{ e.preventDefault(); setDragOver(col.id) }}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={()=>handleCardDrop(col)}>

                  {/* ── Inline mini-card composer ────────────────────── */}
                  {composerCol === col.id && (
                    <div style={{ background:S.surface,border:`1.5px solid ${DS.accentBorder}`,borderRadius:10,padding:'8px 10px',boxShadow:`0 0 0 3px ${DS.accentDim}` }}>
                      {/* Status chip */}
                      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                        <span style={{ width:6,height:6,borderRadius:'50%',background:col.dot,flexShrink:0 }}/>
                        <span style={{ fontSize:10,fontWeight:700,color:col.dot,textTransform:'uppercase',letterSpacing:'.04em' }}>{col.label}</span>
                        <span style={{ fontSize:10,color:S.t3,marginLeft:'auto' }}>História</span>
                      </div>
                      <textarea
                        autoFocus
                        rows={2}
                        value={composerText}
                        onChange={e=>setComposerText(e.target.value)}
                        onKeyDown={e=>{
                          if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); submitComposer(col) }
                          if(e.key==='Escape'){ setComposerCol(null); setComposerText('') }
                        }}
                        placeholder="O que precisa ser feito?"
                        style={{ width:'100%',background:'transparent',border:'none',outline:'none',color:S.t1,fontSize:12,resize:'none',fontFamily:'inherit',lineHeight:1.4,boxSizing:'border-box' }}
                      />
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6 }}>
                        <button onClick={()=>{ onCreateIssue(); setComposerCol(null) }}
                          style={{ fontSize:11,color:DS.accent,background:'none',border:'none',cursor:'pointer',padding:0 }}>
                          ＋ mais campos
                        </button>
                        <div style={{ display:'flex',gap:6 }}>
                          <button onClick={()=>{ setComposerCol(null); setComposerText('') }}
                            style={{ fontSize:11,color:S.t3,background:'none',border:'none',cursor:'pointer',padding:'3px 8px' }}>
                            Esc
                          </button>
                          <button onClick={()=>submitComposer(col)} disabled={!composerText.trim()}
                            style={{ fontSize:11,fontWeight:600,color:'#fff',background:composerText.trim()?DS.accent:S.border,border:'none',borderRadius:6,cursor:composerText.trim()?'pointer':'not-allowed',padding:'3px 10px' }}>
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cards */}
                  {swimlane === 'none' ? (
                    colIssues.map(issue=>(
                      <BoardCard key={issue.key} issue={issue}
                        dragging={draggingCard===issue.key}
                        onDragStart={()=>setDraggingCard(issue.key)}
                        onDragEnd={()=>{ setDraggingCard(null); setDragOver(null) }}/>
                    ))
                  ) : (
                    swimlaneKeys.map(lane=>{
                      const laneIssues = colIssues.filter(i=>swimlane==='assignee'?i.assignee===lane:(i.epic??'Sem épico')===lane)
                      if(!laneIssues.length) return null
                      return (
                        <div key={lane}>
                          <p className="text-[9px] font-semibold uppercase tracking-wide mb-1 px-0.5" style={{ color:S.t3 }}>{lane}</p>
                          {laneIssues.map(issue=>(
                            <div key={issue.key} className="mb-1.5">
                              <BoardCard issue={issue} dragging={draggingCard===issue.key}
                                onDragStart={()=>setDraggingCard(issue.key)}
                                onDragEnd={()=>{ setDraggingCard(null); setDragOver(null) }}/>
                            </div>
                          ))}
                        </div>
                      )
                    })
                  )}

                  {/* Bottom add button */}
                  {col.id !== 'unmapped' && composerCol !== col.id && (
                    <button onClick={()=>openComposer(col.id)}
                      className="w-full py-1.5 rounded-lg text-[11px] transition-all text-center mt-auto"
                      style={{ color:S.t3, border:`1px dashed ${S.border}` }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background=DS.accentDim;(e.currentTarget as HTMLButtonElement).style.borderColor=DS.accent;(e.currentTarget as HTMLButtonElement).style.color=DS.accent }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.borderColor=S.border;(e.currentTarget as HTMLButtonElement).style.color=S.t3 }}>
                      + issue
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* ── Add new column ─────────────────────────────────────────── */}
          <div className="flex-shrink-0 self-start" style={{ width:180 }}>
            <button onClick={()=>{
              const id = `col_${Date.now()}`
              const newCol:ColState = { id, label:'Nova coluna', statuses:[], dot:DS.text3 }
              setCols(prev=>[...prev, newCol])
              setColOrder(prev=>[...prev, id])
              setTimeout(()=>setEditingColId(id), 50)
            }}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-medium transition-colors"
              style={{ background:S.surface2, border:`1.5px dashed ${S.border2}`, color:S.t3 }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=DS.accentBorder;(e.currentTarget as HTMLButtonElement).style.color=DS.accent}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=S.border2;(e.currentTarget as HTMLButtonElement).style.color=S.t3}}>
              + Adicionar coluna
            </button>
          </div>
        </div>
      </div>

      {/* ── Remove column confirmation ────────────────────────────────────── */}
      {removeColId && (() => {
        const col = cols.find(c=>c.id===removeColId)
        const affected = filtered.filter(i=>col?.statuses.includes(i.status)).length
        return (
          <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 }}>
            <div style={{ background:S.surface,border:`1px solid ${S.border}`,borderRadius:14,padding:28,boxShadow:DS.shadowModal,width:400 }}>
              <p style={{ fontSize:16,fontWeight:700,color:DS.text1,marginBottom:8 }}>Remover coluna "{col?.label}"?</p>
              <p style={{ fontSize:13,color:DS.text2,marginBottom:affected>0?10:20 }}>A coluna será removida do fluxo.</p>
              {affected > 0 && (
                <div style={{ background:DS.warnDim,border:`1px solid ${DS.warn}30`,borderRadius:8,padding:'8px 12px',marginBottom:20 }}>
                  <p style={{ fontSize:12,color:DS.warn,margin:0 }}>⚠ {affected} issue{affected!==1?'s':''} mapeada{affected!==1?'s':''} para esta coluna será{affected!==1?'o':''} movida{affected!==1?'s':''} automaticamente para "⚠ Não mapeados" — nenhuma issue some.</p>
                </div>
              )}
              <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
                <button onClick={()=>setRemoveColId(null)} style={{ padding:'7px 16px',borderRadius:8,background:'transparent',border:`1px solid ${S.border}`,color:DS.text2,fontSize:13,cursor:'pointer' }}>Cancelar</button>
                <button onClick={confirmRemove} style={{ padding:'7px 16px',borderRadius:8,background:DS.crit,color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer' }}>Remover</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── WIP limit editor ────────────────────────────────────────────── */}
      {wipColId && (() => {
        const col = cols.find(c=>c.id===wipColId)
        return (
          <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 }}>
            <div style={{ background:S.surface,border:`1px solid ${S.border}`,borderRadius:14,padding:24,boxShadow:DS.shadowModal,width:320 }}>
              <p style={{ fontSize:15,fontWeight:700,color:DS.text1,marginBottom:4 }}>Limite WIP — {col?.label}</p>
              <p style={{ fontSize:12,color:DS.text3,marginBottom:16 }}>Deixe em branco para sem limite.</p>
              <input type="number" min={1} max={99} value={wipValue} onChange={e=>setWipValue(e.target.value)}
                placeholder="Ex: 4"
                style={{ width:'100%',background:S.surface2,border:`1px solid ${S.border}`,borderRadius:8,padding:'8px 12px',color:DS.text1,fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:16 }}/>
              <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
                <button onClick={()=>setWipColId(null)} style={{ padding:'7px 14px',borderRadius:8,background:'transparent',border:`1px solid ${S.border}`,color:DS.text2,fontSize:13,cursor:'pointer' }}>Cancelar</button>
                <button onClick={saveWip} style={{ padding:'7px 14px',borderRadius:8,background:DS.accent,color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer' }}>Salvar</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function BacklogRow({ issue, epicColor }: { issue: Issue; epicColor: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 transition-colors group"
      style={{ background: hovered ? S.surface2 : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <span className="text-[10px] cursor-grab" style={{ color: S.t3, opacity: hovered ? 1 : 0.3 }}>⠿</span>
      {/* Type icon */}
      <TypeIcon t={issue.type} />
      {/* Key */}
      <span className="text-[10px] font-mono w-14 flex-shrink-0" style={{ color: S.t3 }}>{issue.key}</span>
      {/* Epic indicator */}
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: epicColor }} />
      {/* Title */}
      <span className="flex-1 text-[12px] truncate" style={{ color: S.t1 }}>{issue.title}</span>
      {/* Labels */}
      <div className="hidden group-hover:flex gap-0.5 flex-shrink-0">
        {issue.labels.slice(0,2).map(l => <LabelChip key={l} name={l} />)}
      </div>
      {/* Priority */}
      <span className="flex-shrink-0"><PriorityDot p={issue.priority} /></span>
      {/* Assignee */}
      {issue.assignee ? <Av i={issue.assignee} size={18} /> : <span className="w-[18px]" />}
      {/* Points */}
      <span
        className="text-[10px] font-bold px-1.5 py-px rounded w-7 text-center flex-shrink-0"
        style={{ background: S.surface2, color: S.t3 }}
      >
        {issue.points}
      </span>
    </div>
  )
}

// ─── Backlog tab ──────────────────────────────────────────────────────────────
function BacklogTab({ issues, sprints, canManageSprint, onCreateIssue, onCompleteSprint }: {
  issues: Issue[]
  sprints: SprintDef[]
  canManageSprint: boolean
  onCreateIssue: () => void
  onCompleteSprint: (sprint: SprintDef) => void
}) {
  const [collapsed, setCollapsed]     = useState<Set<string>>(new Set())
  const [startingSprint, setStarting] = useState<SprintDef | null>(null)
  const [sprintStates, setSprintStates] = useState<Record<string,string>>({})

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function handleStartSprint(id: string, goal: string) {
    setSprintStates(prev => ({ ...prev, [id]: goal }))
    setStarting(null)
  }

  const getEpicColor = (epicId?: string) => EPICS.find(e => e.id === epicId)?.color ?? DS.text3

  const backlogIssues = issues.filter(i => !i.sprint)

  return (
    <div className="flex-1 overflow-y-auto">
      {startingSprint && (
        <StartSprintModal
          sprint={startingSprint}
          onConfirm={handleStartSprint}
          onClose={() => setStarting(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">

        {/* Sprint containers */}
        {sprints.map(sprint => {
          const sprintIssues = issues.filter(i => i.sprint === sprint.id)
          const totalPts = sprintIssues.reduce((s, i) => s + i.points, 0)
          const donePts  = sprintIssues.filter(i => i.status === 'done').reduce((s, i) => s + i.points, 0)
          const isOpen   = !collapsed.has(sprint.id)
          const goalOverride = sprintStates[sprint.id]
          const goal     = goalOverride ?? sprint.goal

          const statusColors: Record<SprintDef['state'], { text: string; bg: string }> = {
            active:    { text: DS.success, bg: DS.successDim },
            planned:   { text: DS.accent,  bg: DS.accentDim  },
            completed: { text: DS.text3,   bg: DS.neutralDim },
          }
          const sc = statusColors[sprint.state]

          return (
            <div
              key={sprint.id}
              className="rounded-xl overflow-hidden"
              style={{ background: S.surface, border: `1px solid ${S.border}` }}
            >
              {/* Sprint header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                style={{ borderBottom: isOpen ? `1px solid ${S.border}` : 'none' }}
                onClick={() => toggleCollapse(sprint.id)}
              >
                {/* Chevron */}
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ color: S.t3, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                >
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                {/* Sprint name */}
                <p className="text-[13px] font-semibold" style={{ color: S.t1 }}>{sprint.name}</p>

                {/* State badge */}
                <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: sc.bg, color: sc.text }}>
                  {sprint.state === 'active' ? '▶ Em andamento' : sprint.state === 'planned' ? 'Planejado' : '✓ Concluído'}
                </span>

                {/* Dates */}
                <span className="text-[11px]" style={{ color: S.t3 }}>{sprint.start} → {sprint.end}</span>

                {/* Points */}
                <span className="text-[11px] font-medium" style={{ color: S.t2 }}>
                  {sprint.state === 'completed' ? `${sprint.velocity ?? 0}pts concluídos` : `${donePts}/${totalPts}pts`}
                </span>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {sprint.state === 'planned' && (
                    <button
                      onClick={canManageSprint ? () => setStarting(sprint) : undefined}
                      disabled={!canManageSprint}
                      title={!canManageSprint ? 'Requer permissão: Gerenciar Sprint (Admin, Project Manager ou Scrum Master)' : undefined}
                      className="h-6 px-3 text-[11px] font-semibold rounded-lg transition-all"
                      style={{
                        background: canManageSprint ? DS.accent : S.surface2,
                        color: canManageSprint ? '#fff' : S.t3,
                        border: canManageSprint ? 'none' : `1px solid ${S.border}`,
                        cursor: canManageSprint ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={canManageSprint ? e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)' } : undefined}
                      onMouseLeave={canManageSprint ? e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' } : undefined}
                    >
                      Iniciar Sprint
                    </button>
                  )}
                  {sprint.state === 'active' && (
                    <button
                      onClick={canManageSprint ? () => onCompleteSprint(sprint) : undefined}
                      disabled={!canManageSprint}
                      title={!canManageSprint ? 'Requer permissão: Gerenciar Sprint (Admin, Project Manager ou Scrum Master)' : undefined}
                      className="h-6 px-3 text-[11px] font-medium rounded-lg transition-colors"
                      style={{
                        border: `1px solid ${S.border}`,
                        color: canManageSprint ? S.t2 : S.t3,
                        cursor: canManageSprint ? 'pointer' : 'not-allowed',
                        opacity: canManageSprint ? 1 : 0.5,
                      }}
                      onMouseEnter={canManageSprint ? e => { (e.currentTarget as HTMLButtonElement).style.borderColor = S.border2 } : undefined}
                      onMouseLeave={canManageSprint ? e => { (e.currentTarget as HTMLButtonElement).style.borderColor = S.border } : undefined}
                    >
                      Concluir Sprint
                    </button>
                  )}
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-[14px] transition-colors"
                    style={{ color: S.t3 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = S.surface2 }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    ···
                  </button>
                </div>
              </div>

              {isOpen && (
                <>
                  {/* Sprint goal */}
                  {goal && (
                    <div
                      className="flex items-start gap-2 px-4 py-2"
                      style={{ background: `${DS.accent}08`, borderBottom: `1px solid ${S.border}` }}
                    >
                      <span className="text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: DS.accent }}>META</span>
                      <p className="text-[11px] italic" style={{ color: S.t2 }}>{goal}</p>
                    </div>
                  )}

                  {/* Column header */}
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 text-[9px] font-semibold uppercase tracking-widest"
                    style={{ color: S.t3, borderBottom: `1px solid ${S.border}` }}
                  >
                    <span className="w-4" />
                    <span className="w-4" />
                    <span className="w-14">Chave</span>
                    <span className="w-1.5" />
                    <span className="flex-1">Título</span>
                    <span className="w-10 text-right">Prior.</span>
                    <span className="w-[18px]" />
                    <span className="w-7 text-right">Pts</span>
                  </div>

                  {/* Issues */}
                  {sprintIssues.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[12px]" style={{ color: S.t3 }}>
                      Nenhuma issue neste sprint
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: S.border }}>
                      {sprintIssues.map(issue => (
                        <BacklogRow key={issue.key} issue={issue} epicColor={getEpicColor(issue.epic)} />
                      ))}
                    </div>
                  )}

                  {/* Add issue */}
                  <div className="px-4 py-2" style={{ borderTop: `1px solid ${S.border}` }}>
                    <button
                      onClick={onCreateIssue}
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: S.t3 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = DS.accent }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = S.t3 }}
                    >
                      + Adicionar issue
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* Backlog (unassigned) */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: S.surface, border: `1px solid ${S.border}` }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
            style={{ borderBottom: !collapsed.has('_backlog') ? `1px solid ${S.border}` : 'none' }}
            onClick={() => toggleCollapse('_backlog')}
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ color: S.t3, transform: !collapsed.has('_backlog') ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
            >
              <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[13px] font-semibold" style={{ color: S.t1 }}>Backlog</p>
            <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: DS.neutralDim, color: DS.text3 }}>
              {backlogIssues.length}
            </span>
            <span className="text-[11px]" style={{ color: S.t3 }}>
              {backlogIssues.reduce((s,i) => s+i.points, 0)}pts
            </span>
          </div>

          {!collapsed.has('_backlog') && (
            <>
              {backlogIssues.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px]" style={{ color: S.t3 }}>Backlog vazio</div>
              ) : (
                <div className="divide-y" style={{ borderColor: S.border }}>
                  {backlogIssues.map(issue => (
                    <BacklogRow key={issue.key} issue={issue} epicColor={getEpicColor(issue.epic)} />
                  ))}
                </div>
              )}
              <div className="px-4 py-2" style={{ borderTop: `1px solid ${S.border}` }}>
                <button
                  onClick={onCreateIssue}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: S.t3 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = DS.accent }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = S.t3 }}
                >
                  + Criar issue no backlog
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sprints tab ──────────────────────────────────────────────────────────────
function SprintsTab({ issues, sprints }: { issues: Issue[]; sprints: SprintDef[] }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
        {sprints.map(sprint => {
          const si        = issues.filter(i => i.sprint === sprint.id)
          const total     = si.reduce((s, i) => s + i.points, 0)
          const done      = si.filter(i => i.status === 'done')
          const donePts   = done.reduce((s, i) => s + i.points, 0)
          const blocked   = si.filter(i => i.blocked)
          const inProg    = si.filter(i => i.status === 'in-progress' || i.status === 'in-review')
          const pct       = total ? Math.round((donePts / total) * 100) : 0
          const velocity  = sprint.velocity ?? 0

          const stateColor: Record<SprintDef['state'], string> = {
            active: DS.success, planned: DS.accent, completed: DS.text3,
          }
          const sc = stateColor[sprint.state]

          return (
            <div
              key={sprint.id}
              className="rounded-xl overflow-hidden"
              style={{ background: S.surface, border: `1px solid ${S.border}` }}
            >
              <div className="px-5 py-4">
                {/* Sprint title row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-bold" style={{ color: S.t1 }}>{sprint.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: `${sc}22`, color: sc }}>
                        {sprint.state === 'active' ? '▶ Em andamento' : sprint.state === 'planned' ? 'Planejado' : '✓ Concluído'}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: S.t3 }}>{sprint.start} → {sprint.end}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[18px] font-bold tabular" style={{ color: sc }}>{sprint.state === 'completed' ? velocity : donePts}</p>
                      <p className="text-[9px]" style={{ color: S.t3 }}>pts concluídos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[18px] font-bold tabular" style={{ color: S.t2 }}>{si.length}</p>
                      <p className="text-[9px]" style={{ color: S.t3 }}>issues</p>
                    </div>
                    {blocked.length > 0 && (
                      <div className="text-center">
                        <p className="text-[18px] font-bold tabular" style={{ color: DS.crit }}>{blocked.length}</p>
                        <p className="text-[9px]" style={{ color: S.t3 }}>bloqueados</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {sprint.state !== 'planned' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: S.t3 }}>
                      <span>{pct}% concluído</span>
                      <span>{donePts}/{total}pts</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: `${sc}20` }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: sc }}
                      />
                    </div>
                  </div>
                )}

                {/* Status breakdown */}
                <div className="flex items-center gap-3">
                  {[
                    { label: 'Concluído',    count: done.length,    color: DS.success },
                    { label: 'Em andamento', count: inProg.length,   color: DS.accent  },
                    { label: 'A fazer',      count: si.filter(i=>i.status==='todo'||i.status==='backlog').length, color: S.t3 },
                    { label: 'Bloqueado',    count: blocked.length,  color: DS.crit    },
                  ].filter(s => s.count > 0).map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-[11px]" style={{ color: S.t2 }}>
                        <span className="font-semibold">{s.count}</span> {s.label}
                      </span>
                    </div>
                  ))}

                  {/* Sprint goal */}
                  {sprint.goal && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-[9px] font-bold" style={{ color: DS.accent }}>META</span>
                      <span className="text-[11px] italic max-w-xs truncate" style={{ color: S.t2 }}>{sprint.goal}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────
type Tab = 'Board' | 'Backlog' | 'Sprints'

export default function ProjectPage() {
  const [tab, setTab]     = useState<Tab>('Board')
  const [issues, setIssues]   = useState<Issue[]>(INIT_ISSUES)
  const [sprints, setSprints] = useState<SprintDef[]>(SPRINTS)
  const [quickCreate, setQuickCreate] = useState<{colStatus?:string}|null>(null)
  const [completingSprint, setCompletingSprint] = useState<SprintDef|null>(null)
  const [toast, setToast] = useState<string|null>(null)

  const activeUser        = getActiveUser()
  const canManageSprint   = can(activeUser.permissions, 'sprint:manage')

  const activeSprint      = sprints.find(s => s.state === 'active')
  const activeSid         = activeSprint?.id ?? 's14'

  function handleCompleteSprint(moveRemaining: 'next-sprint' | 'backlog') {
    if (!completingSprint) return
    const sprintId      = completingSprint.id
    const nextPlanned   = sprints.find(s => s.state === 'planned')
    const destination   = moveRemaining === 'next-sprint' && nextPlanned ? 'next-sprint' : 'backlog'
    const destSprintId  = destination === 'next-sprint' ? nextPlanned!.id : undefined
    const destLabel     = destination === 'next-sprint' ? nextPlanned!.name : 'backlog'

    const sprintIssues  = issues.filter(i => i.sprint === sprintId)
    const doneItems     = sprintIssues.filter(i => i.status === 'done')
    const remaining     = sprintIssues.filter(i => i.status !== 'done')
    const velocity      = doneItems.reduce((s, i) => s + i.points, 0)

    // Move non-done issues
    setIssues(prev => prev.map(i => {
      if (i.sprint !== sprintId || i.status === 'done') return i
      return destination === 'next-sprint'
        ? { ...i, sprint: destSprintId }
        : { ...i, sprint: undefined, status: 'backlog' as const }
    }))

    // Mark sprint completed
    setSprints(prev => prev.map(s => s.id === sprintId
      ? { ...s, state: 'completed' as const, velocity, completedAt: new Date().toLocaleDateString('pt-BR') }
      : s
    ))

    // Audit log
    _SPRINT_AUDIT.push({
      ts:     new Date().toISOString(),
      who:    activeUser.name,
      action: `Encerrou ${completingSprint.name}: ${doneItems.length} concluídos, ${remaining.length} movidos → ${destLabel}`,
    })

    // Toast feedback
    const fallbackNote = moveRemaining === 'next-sprint' && !nextPlanned
      ? ' (sem próxima sprint planejada, movido para backlog)'
      : ''
    const n = remaining.length
    setToast(`Sprint encerrada — ${n} ${n === 1 ? 'item movido' : 'itens movidos'} para ${destLabel}${fallbackNote}`)
    setTimeout(() => setToast(null), 4500)
    setCompletingSprint(null)
  }

  const tabBadges: Partial<Record<Tab, number>> = {
    Board:   issues.filter(i => i.sprint === activeSid).length,
    Backlog: issues.filter(i => !i.sprint || i.sprint === sprints.find(s => s.state === 'planned')?.id).length,
    Sprints: sprints.length,
  }

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: S.bg }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-5 py-2 flex-shrink-0"
        style={{ background: S.surface, borderBottom: `1px solid ${S.border}` }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px]">
          <span style={{ color: S.t2 }}>Harbor Labs</span>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ color: S.t3 }}>
            <path d="M3 2.5L5.5 4.5L3 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold" style={{ color: S.t1 }}>Website Relaunch</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: S.bg, border: `1px solid ${S.border}` }}>
          {(['Board', 'Backlog', 'Sprints'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all"
              style={{
                background: tab === t ? S.surface2 : 'transparent',
                color: tab === t ? S.t1 : S.t3,
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {t}
              {tabBadges[t] != null && (
                <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background: DS.accentDim, color: DS.accent }}>
                  {tabBadges[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Team avatars */}
          <div className="flex items-center">
            {['AL','NM','JN','CS'].map((a, i) => (
              <span key={a} style={{ marginLeft: i > 0 ? -7 : 0, zIndex: 4-i, position:'relative' }}>
                <Av i={a} size={26} />
              </span>
            ))}
          </div>
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold text-white transition-all"
            style={{ background: DS.accent }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M4.5 1.5v6M1.5 4.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Issue
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'Board' && (
        <BoardTab issues={issues} setIssues={fn => setIssues(fn)} onCreateIssue={()=>setQuickCreate({})} />
      )}
      {tab === 'Backlog' && (
        <BacklogTab issues={issues} sprints={sprints} canManageSprint={canManageSprint} onCreateIssue={()=>setQuickCreate({})} onCompleteSprint={s=>setCompletingSprint(s)} />
      )}
      {tab === 'Sprints' && (
        <SprintsTab issues={issues} sprints={sprints} />
      )}

    </div>
    {quickCreate !== null && <CreateIssueModal onClose={()=>setQuickCreate(null)} onCreate={()=>setQuickCreate(null)} />}
    {completingSprint && (() => {
      const sprintIssues  = issues.filter(i => i.sprint === completingSprint.id)
      const doneCount     = sprintIssues.filter(i => i.status === 'done').length
      const totalCount    = sprintIssues.length
      const remainCount   = sprintIssues.filter(i => i.status !== 'done').length
      return (
        <CompleteSprintModal
          sprint={completingSprint}
          stats={{ done: doneCount, total: totalCount, remaining: remainCount }}
          nextSprintName={sprints.find(s => s.state === 'planned')?.name}
          onClose={() => setCompletingSprint(null)}
          onConfirm={handleCompleteSprint}
        />
      )
    })()}
    {/* Toast */}
    {toast && (
      <div style={{
        position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        background: '#1a2540', border: `1px solid ${DS.accent}40`,
        borderRadius: 10, padding: '12px 20px', zIndex: 9999,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: 10, maxWidth: 480,
      }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 13, color: '#e8ecf4', fontWeight: 500 }}>{toast}</span>
      </div>
    )}
    </>
  )
}
