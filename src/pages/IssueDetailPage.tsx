import { useState } from 'react'
import { T } from '../components/ds/tokens'
import { LogWorkModal } from '../components/LogWorkModal'
import { AddRelationModal } from '../components/AddRelationModal'
import { AddSubtaskModal } from '../components/AddSubtaskModal'

// ─── RULE: mover para Done abre tela de transição (resolução, evidência, comentário)

// ─── Types ────────────────────────────────────────────────────────────────────
type Status   = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
type Priority = 'critical' | 'high' | 'medium' | 'low'
type IssueType = 'story' | 'bug' | 'task' | 'subtask' | 'epic'

interface AcItem { id: string; text: string; done: boolean }
interface Subtask { key: string; title: string; status: Status }
interface Relation { type: string; key: string; title: string; status: Status }
interface Comment { author: string; time: string; body: string }
interface LogEntry { actor: string; action: string; time: string }
interface WorklogEntry { author: string; time: string; spent: string }
interface TestStep { id: string; step: string; result: 'PASS' | 'FAIL' | 'BLOCKED' | null }

const AV_COLOR: Record<string, string> = {
  AL: T.accent, NM: T.purple, JN: T.warn, CS: T.success, RM: T.crit, LF: '#f97316',
}
const STATUS_CFG: Record<Status, { label: string; color: string; bg: string }> = {
  'backlog':     { label: 'Backlog',       color: T.text3,   bg: T.neutralDim  },
  'todo':        { label: 'A Fazer',        color: T.text2,   bg: `${T.text3}18` },
  'in-progress': { label: 'Em andamento',   color: T.accent,  bg: T.accentDim   },
  'in-review':   { label: 'Em revisão',     color: T.warn,    bg: T.warnDim     },
  'done':        { label: 'Concluído',      color: T.success, bg: T.successDim  },
}
const PRIORITY_CFG: Record<Priority, { label: string; color: string; icon: string }> = {
  critical: { label: 'Crítica', color: T.crit,   icon: '↑↑' },
  high:     { label: 'Alta',    color: T.warn,   icon: '↑'  },
  medium:   { label: 'Média',   color: T.accent, icon: '→'  },
  low:      { label: 'Baixa',   color: T.text3,  icon: '↓'  },
}
const TYPE_CFG: Record<IssueType, { icon: string; color: string; label: string }> = {
  bug:     { icon: '⬟', color: T.crit,    label: 'Bug'    },
  story:   { icon: '◇', color: T.accent,  label: 'Story'  },
  task:    { icon: '☑', color: T.text2,   label: 'Task'   },
  subtask: { icon: '◻', color: T.text3,   label: 'Subtask'},
  epic:    { icon: '⚡', color: T.warn,   label: 'Epic'   },
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Av({ i, size=24 }: { i: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white select-none flex-shrink-0"
      style={{ width:size, height:size, fontSize:size*0.38, background:AV_COLOR[i]??T.text3 }}
    >{i}</span>
  )
}

function StatusBadge({ status, onClick }: { status: Status; onClick?: () => void }) {
  const c = STATUS_CFG[status]
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}
      onMouseEnter={e => { if(onClick) (e.currentTarget as HTMLButtonElement).style.filter='brightness(1.2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter='none' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:c.color }} />
      {c.label}
      {onClick && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
    </button>
  )
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 py-2 mb-3" style={{ borderBottom:`1px solid ${T.border}` }}>
      <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color:T.text2 }}>{title}</span>
      {count != null && (
        <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ background:T.accentDim, color:T.accent }}>{count}</span>
      )}
    </div>
  )
}

// ─── Done Transition Modal ─────────────────────────────────────────────────────
// RULE: mover para Done abre tela de transição
const RESOLUTIONS = ['Corrigido','Não vai corrigir','Duplicado','Não reproduzível','Inválido']

function DoneTransitionModal({ onConfirm, onClose }: {
  onConfirm: (data: { resolution: string; evidence: string; comment: string }) => void
  onClose:   () => void
}) {
  const [resolution, setResolution] = useState(RESOLUTIONS[0])
  const [evidence, setEvidence]     = useState('')
  const [comment, setComment]       = useState('')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center fade-rise"
      style={{ background:'rgba(8,10,14,0.8)', backdropFilter:'blur(6px)' }}
      onClick={e => { if(e.target===e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ width:500, background:T.bgSurface, border:`1px solid ${T.border2}`, boxShadow:T.shadowModal }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:`1px solid ${T.border}` }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color:T.text1 }}>Mover para Concluído</p>
            <p className="text-[12px] mt-0.5" style={{ color:T.text3 }}>Esta ação registra a resolução da issue</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none" style={{ color:T.text3 }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
          >×</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Resolução */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold" style={{ color:T.text3 }}>Resolução <span style={{ color:T.crit }}>*</span></label>
            <select
              value={resolution} onChange={e=>setResolution(e.target.value)}
              className="h-9 px-3 text-[13px] rounded-lg border outline-none appearance-none font-[inherit]"
              style={{ background:T.bgSurface2, border:`1px solid ${T.border}`, color:T.text1, colorScheme:'dark' }}
            >
              {RESOLUTIONS.map(r=><option key={r} value={r} style={{ background:T.bgSurface2 }}>{r}</option>)}
            </select>
          </div>
          {/* Evidência */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold" style={{ color:T.text3 }}>Evidência (link ou referência)</label>
            <input
              value={evidence} onChange={e=>setEvidence(e.target.value)}
              placeholder="https://... ou número de teste"
              className="h-9 px-3 text-[13px] rounded-lg border outline-none"
              style={{ background:T.bgSurface2, border:`1px solid ${T.border}`, color:T.text1 }}
              onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
              onBlur={e=>{e.currentTarget.style.borderColor=T.border}}
            />
          </div>
          {/* Comentário */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold" style={{ color:T.text3 }}>Comentário de fechamento</label>
            <textarea
              value={comment} onChange={e=>setComment(e.target.value)}
              rows={3} placeholder="Descreva como foi resolvida..."
              className="px-3 py-2 text-[13px] rounded-lg border outline-none resize-none font-[inherit]"
              style={{ background:T.bgSurface2, border:`1px solid ${T.border}`, color:T.text1 }}
              onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
              onBlur={e=>{e.currentTarget.style.borderColor=T.border}}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop:`1px solid ${T.border}` }}>
          <button onClick={onClose} className="h-8 px-4 text-[13px] font-medium rounded-lg" style={{ color:T.text2 }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
          >Cancelar</button>
          <button
            onClick={()=>onConfirm({resolution,evidence,comment})}
            className="h-8 px-4 text-[13px] font-semibold rounded-lg text-white"
            style={{ background:T.success }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.filter='brightness(1.15)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.filter='none'}}
          >Confirmar transição</button>
        </div>
      </div>
    </div>
  )
}

// ─── Right panel field row ─────────────────────────────────────────────────────
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom:`1px solid ${T.border}` }}>
      <span className="text-[11px] w-28 flex-shrink-0 pt-0.5" style={{ color:T.text3 }}>{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function MetaSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={()=>setOpen(o=>!o)}
        className="flex items-center gap-1.5 text-[12px] px-2 py-1 rounded-lg transition-colors -mx-2"
        style={{ color:T.text1 }}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
      >
        {value}
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ color:T.text3 }}>
          <path d="M2 3.5L4.5 6L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 py-1 rounded-xl fade-rise overflow-hidden"
          style={{ minWidth:160, background:T.bgSurface, border:`1px solid ${T.border2}`, boxShadow:T.shadowModal }}
        >
          {options.map(o=>(
            <button key={o} onClick={()=>{onChange(o);setOpen(false)}}
              className="w-full text-left px-3 py-2 text-[12px] transition-colors"
              style={{ color: o===value?T.accent:T.text1, background: o===value?T.accentDim:'transparent' }}
              onMouseEnter={e=>{if(o!==value)(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
              onMouseLeave={e=>{if(o!==value)(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
            >{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Test step result toggle ───────────────────────────────────────────────────
const RESULTS: Array<TestStep['result']> = ['PASS', 'FAIL', 'BLOCKED', null]
const RESULT_CFG: Record<string, { color: string; bg: string }> = {
  PASS:    { color:T.success, bg:T.successDim },
  FAIL:    { color:T.crit,    bg:T.critDim    },
  BLOCKED: { color:T.warn,    bg:T.warnDim    },
}

// ─── Main page ─────────────────────────────────────────────────────────────────
type ActivityTab = 'Comentários' | 'DevOps' | 'Testes' | 'Histórico' | 'Worklog' | 'Anexos' | 'Design'

export default function IssueDetailPage() {
  // ── Issue state ──────────────────────────────────────────────────────────────
  const [status,   setStatus]   = useState<Status>('in-progress')
  const [priority, setPriority] = useState<Priority>('critical')
  const [assignee, setAssignee] = useState('JN')
  const [labels] = useState(['Eng', 'Mobile'])
  const [remaining, setRemaining] = useState(2)
  const [actTab,   setActTab]   = useState<ActivityTab>('Comentários')
  const [showDoneModal, setShowDone] = useState(false)
  const [logWorkOpen, setLogWorkOpen] = useState(false)
  const [addRelOpen, setAddRelOpen] = useState(false)
  const [addSubOpen, setAddSubOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('Login form validation falha em dispositivos iOS')

  // AC
  const [acItems, setAcItems] = useState<AcItem[]>([
    { id:'a1', text:'Validação disparada ao submeter com campo vazio', done:false },
    { id:'a2', text:'Mensagem de erro exibida corretamente', done:true },
    { id:'a3', text:'Comportamento consistente em iOS 16+ e Android 13+', done:false },
    { id:'a4', text:'Testes unitários adicionados para o componente', done:false },
  ])
  const [newAc, setNewAc] = useState('')

  // Subtasks
  const [subtasks] = useState<Subtask[]>([
    { key:'PM-102a', title:'Investigar comportamento do onBlur no Safari', status:'done'        },
    { key:'PM-102b', title:'Criar test case automatizado',                  status:'in-progress' },
    { key:'PM-102c', title:'Validar fix no TestFlight',                     status:'todo'        },
  ])

  // Comments
  const [comments, setComments] = useState<Comment[]>([
    { author:'JN', time:'2h', body:'Investiguei e o problema está no handler onBlur do React no Safari. Quando o teclado fecha, o blur não é disparado corretamente.' },
    { author:'AL', time:'1h', body:'Consegui reproduzir também no Chrome iOS. Parece ser um problema mais amplo do que o Safari.' },
  ])
  const [newComment, setNewComment] = useState('')

  // Test steps
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    { id:'t1', step:'Abrir app no iOS 16+',                                            result:'PASS'    },
    { id:'t2', step:'Navegar para tela de login',                                      result:'PASS'    },
    { id:'t3', step:'Submeter formulário com campos name e password vazios',           result:'FAIL'    },
    { id:'t4', step:'Verificar exibição da mensagem de erro de validação',             result:'BLOCKED' },
    { id:'t5', step:'Reproduzir no Android 13 — comportamento deve ser consistente',  result:null      },
  ])

  // History
  const history: LogEntry[] = [
    { actor:'AL', action:'Criou a issue',                                    time:'10 abr · 09:12' },
    { actor:'AL', action:'Atribuiu a JN',                                    time:'11 abr · 10:30' },
    { actor:'AL', action:'Alterou prioridade para Crítica',                  time:'12 abr · 14:05' },
    { actor:'JN', action:'Moveu para Em andamento',                          time:'13 abr · 09:00' },
    { actor:'JN', action:'Adicionou flag Bloqueado',                         time:'14 abr · 11:22' },
  ]

  // Worklog
  const worklog: WorklogEntry[] = [
    { author:'JN', time:'13 abr', spent:'2h' },
    { author:'JN', time:'14 abr', spent:'1h' },
  ]

  const relations: Relation[] = [
    { type:'Bloqueia',     key:'PM-107', title:'Spec de nav + componente footer', status:'in-review'   },
    { type:'Relacionado a',key:'PM-108', title:'UX study: design Northwind',      status:'in-review'   },
  ]

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleStatusChange(newS: string) {
    const s = newS as Status
    if (s === 'done') { setShowDone(true) }
    else              { setStatus(s)      }
  }

  function handleDoneConfirm() {
    setStatus('done')
    setShowDone(false)
  }

  function toggleAc(id: string) {
    setAcItems(prev => prev.map(a => a.id===id ? {...a, done:!a.done} : a))
  }

  function addAc() {
    if (!newAc.trim()) return
    setAcItems(prev => [...prev, { id:`a${Date.now()}`, text:newAc.trim(), done:false }])
    setNewAc('')
  }

  function removeAc(id: string) {
    setAcItems(prev => prev.filter(a => a.id!==id))
  }

  function cycleTestResult(id: string) {
    setTestSteps(prev => prev.map(s => {
      if (s.id !== id) return s
      const idx = RESULTS.indexOf(s.result)
      return { ...s, result: RESULTS[(idx+1) % RESULTS.length] }
    }))
  }

  const acDone = acItems.filter(a=>a.done).length

  return (
    <div className="flex h-full overflow-hidden" style={{ background:T.bgPage }}>
      {showDoneModal && (
        <DoneTransitionModal
          onConfirm={handleDoneConfirm}
          onClose={()=>setShowDone(false)}
        />
      )}

      {/* ── Left column ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto" style={{ maxWidth:'65%' }}>

        {/* Breadcrumb + header */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom:`1px solid ${T.border}` }}>
          <div className="flex items-center gap-1.5 text-[11px] mb-3" style={{ color:T.text3 }}>
            <span>Harbor Labs</span>
            <span>/</span>
            <span>Website Relaunch</span>
            <span>/</span>
            <span className="font-mono" style={{ color:T.accent }}>PM-102</span>
          </div>

          {/* Type + key + status */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-bold" style={{ color:TYPE_CFG.bug.color }}>{TYPE_CFG.bug.icon}</span>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded" style={{ background:T.bgSurface, border:`1px solid ${T.border}`, color:T.text2 }}>PM-102</span>
            <StatusBadge status={status} />
          </div>

          {/* Editable title */}
          {editingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={e=>setTitle(e.target.value)}
              onBlur={()=>setEditingTitle(false)}
              onKeyDown={e=>{ if(e.key==='Enter') setEditingTitle(false) }}
              className="w-full text-[18px] font-bold outline-none rounded-lg px-2 py-1 -mx-2"
              style={{ background:T.bgSurface2, color:T.text1, border:`1px solid ${T.accent}` }}
            />
          ) : (
            <h1
              className="text-[18px] font-bold leading-snug cursor-text rounded-lg px-2 py-1 -mx-2 transition-colors"
              style={{ color:T.text1 }}
              onClick={()=>setEditingTitle(true)}
              onMouseEnter={e=>{(e.currentTarget as HTMLHeadingElement).style.background=T.bgSurface}}
              onMouseLeave={e=>{(e.currentTarget as HTMLHeadingElement).style.background='transparent'}}
            >{title}</h1>
          )}
        </div>

        <div className="px-6 py-5 space-y-6 flex-1">

          {/* Description */}
          <section>
            <SectionHeader title="Descrição" />
            <div className="text-[13px] leading-relaxed" style={{ color:T.text2 }}>
              <p>Ao tentar submeter o formulário de login em dispositivos iOS, a validação de campos não é disparada corretamente, permitindo tentativas com campos vazios.</p>
              <p className="mt-2">O evento <code className="px-1 py-0.5 rounded text-[12px] font-mono" style={{ background:T.bgSurface2, color:T.accent }}>onBlur</code> do React não é acionado quando o teclado virtual fecha no Safari iOS, o que impede a validação em tempo real de funcionar como esperado.</p>
            </div>
          </section>

          {/* Acceptance criteria */}
          <section>
            <SectionHeader title={`Critérios de aceite`} count={acDone} />
            <div className="space-y-1.5">
              {acItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-2.5 group rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=T.bgSurface}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent'}}
                >
                  <button
                    onClick={()=>toggleAc(item.id)}
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{ background:item.done?T.success:'transparent', borderColor:item.done?T.success:T.border2 }}
                  >
                    {item.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>}
                  </button>
                  <span
                    className="flex-1 text-[12px] leading-snug"
                    style={{ color:item.done?T.text3:T.text1, textDecoration:item.done?'line-through':'none' }}
                  >{item.text}</span>
                  <button
                    onClick={()=>removeAc(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-[14px] leading-none transition-opacity w-5 h-5 flex items-center justify-center rounded"
                    style={{ color:T.text3 }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
                  >×</button>
                </div>
              ))}
              {/* Add criterion */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={newAc}
                  onChange={e=>setNewAc(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') addAc() }}
                  placeholder="+ Adicionar critério..."
                  className="flex-1 h-7 px-2 text-[12px] rounded-lg border outline-none"
                  style={{ background:'transparent', border:`1px dashed ${T.border}`, color:T.text1 }}
                  onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
                  onBlur={e=>{e.currentTarget.style.borderColor=T.border}}
                />
                {newAc && (
                  <button onClick={addAc} className="h-7 px-2.5 text-[11px] font-semibold rounded-lg text-white" style={{ background:T.accent }}>OK</button>
                )}
              </div>
            </div>
          </section>

          {/* Subtasks */}
          <section>
            <SectionHeader title="Subtasks" count={subtasks.length} />
            <div className="space-y-1">
              {subtasks.map(sub => {
                const sc = STATUS_CFG[sub.status]
                return (
                  <div key={sub.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors"
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=T.bgSurface}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent'}}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:sc.color }} />
                    <span className="text-[10px] font-mono w-16 flex-shrink-0" style={{ color:T.text3 }}>{sub.key}</span>
                    <span className="flex-1 text-[12px]" style={{ color:T.text1, textDecoration:sub.status==='done'?'line-through':'none' }}>{sub.title}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-px rounded-full" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                  </div>
                )
              })}
              <button className="text-[11px] mt-1 transition-colors" style={{ color:T.text3 }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.accent}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.text3}}
               onClick={()=>setAddSubOpen(true)}>+ Criar subtask</button>
            </div>
          </section>

          {/* Relations */}
          <section>
            <SectionHeader title="Relações" count={relations.length} />
            <div className="space-y-1">
              {relations.map(rel => {
                const sc = STATUS_CFG[rel.status]
                return (
                  <div key={rel.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors"
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=T.bgSurface}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent'}}
                  >
                    <span className="text-[9px] font-bold w-20 flex-shrink-0" style={{ color:T.text3 }}>{rel.type}</span>
                    <span className="text-[10px] font-mono w-14 flex-shrink-0" style={{ color:T.accent }}>{rel.key}</span>
                    <span className="flex-1 text-[12px]" style={{ color:T.text1 }}>{rel.title}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-px rounded-full" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                  </div>
                )
              })}
              <button className="text-[11px] mt-1" style={{ color:T.text3 }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.accent}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.text3}}
               onClick={()=>setAddRelOpen(true)}>+ Adicionar relação</button>
            </div>
          </section>

          {/* Activity tabs */}
          <section>
            <div className="flex items-center gap-0.5 mb-4 overflow-x-auto" style={{ borderBottom:`1px solid ${T.border}` }}>
              {(['Comentários','DevOps','Testes','Histórico','Worklog','Anexos','Design'] as ActivityTab[]).map(t => (
                <button key={t} onClick={()=>setActTab(t)}
                  className="px-3 py-2 text-[11px] font-medium flex-shrink-0 transition-all"
                  style={{
                    color: actTab===t?T.accent:T.text3,
                    borderBottom: actTab===t?`2px solid ${T.accent}`:'2px solid transparent',
                    marginBottom:-1,
                  }}
                >{t}</button>
              ))}
            </div>

            {/* Comentários */}
            {actTab==='Comentários' && (
              <div className="space-y-4">
                {comments.map((c,i) => (
                  <div key={i} className="flex gap-3">
                    <Av i={c.author} size={28} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px] font-semibold" style={{ color:T.text1 }}>{c.author==='JN'?'João Nunes':'Ana Lima'}</span>
                        <span className="text-[10px]" style={{ color:T.text3 }}>{c.time} atrás</span>
                      </div>
                      <p className="text-[12px] leading-relaxed px-3 py-2 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}`, color:T.text2 }}>{c.body}</p>
                    </div>
                  </div>
                ))}
                {/* Compose */}
                <div className="flex gap-3">
                  <Av i="AL" size={28} />
                  <div className="flex-1">
                    <textarea
                      value={newComment} onChange={e=>setNewComment(e.target.value)}
                      rows={2} placeholder="Adicionar comentário..."
                      className="w-full px-3 py-2 text-[12px] rounded-xl border outline-none resize-none font-[inherit]"
                      style={{ background:T.bgSurface, border:`1px solid ${T.border}`, color:T.text1 }}
                      onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
                      onBlur={e=>{e.currentTarget.style.borderColor=T.border}}
                    />
                    {newComment && (
                      <button
                        onClick={()=>{ setComments(prev=>[...prev,{author:'AL',time:'agora',body:newComment}]); setNewComment('') }}
                        className="mt-1.5 h-7 px-3 text-[11px] font-semibold rounded-lg text-white"
                        style={{ background:T.accent }}
                      >Enviar</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DevOps */}
            {actTab==='DevOps' && (
              <div className="space-y-3">
                {/* Branch */}
                <div className="p-3 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color:T.text3 }}>Branch</p>
                  <code className="text-[12px] font-mono px-2 py-1 rounded" style={{ background:T.bgSurface2, color:T.accent }}>feature/fix-mobile-validation</code>
                </div>
                {/* Commits */}
                <div className="p-3 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color:T.text3 }}>Commits (2)</p>
                  {[
                    { hash:'a3f7c2b', msg:'fix: handle onBlur on iOS Safari keyboard dismiss', author:'JN', time:'13 abr' },
                    { hash:'9d1e4a0', msg:'test: add unit tests for mobile validation edge cases', author:'JN', time:'14 abr' },
                  ].map(c=>(
                    <div key={c.hash} className="flex items-start gap-2 py-1.5">
                      <code className="text-[10px] font-mono px-1.5 py-px rounded flex-shrink-0" style={{ background:T.bgSurface2, color:T.text3 }}>{c.hash.slice(0,7)}</code>
                      <p className="text-[11px] flex-1" style={{ color:T.text1 }}>{c.msg}</p>
                      <span className="text-[10px] flex-shrink-0" style={{ color:T.text3 }}>{c.time}</span>
                    </div>
                  ))}
                </div>
                {/* PR */}
                <div className="p-3 rounded-xl flex items-center gap-3" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color:T.text3 }}>Pull Request</p>
                    <p className="text-[12px] font-medium" style={{ color:T.text1 }}>#341 — Fix: mobile form validation</p>
                    <p className="text-[10px] mt-0.5" style={{ color:T.text3 }}>JN → main · 14 abr</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background:T.successDim, color:T.success }}>OPEN</span>
                </div>
                {/* Pipeline */}
                <div className="p-3 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color:T.text3 }}>Pipeline</p>
                  <div className="flex items-center gap-2">
                    {[
                      { name:'Build',   pass:true  },
                      { name:'Unit',    pass:true  },
                      { name:'E2E',     pass:false },
                      { name:'Deploy',  pass:null  },
                    ].map((stage,i) => (
                      <div key={stage.name} className="flex items-center gap-1.5">
                        {i>0 && <div className="w-4 h-px" style={{ background:T.border }} />}
                        <div className="flex items-center gap-1">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{
                              background: stage.pass===true?T.successDim:stage.pass===false?T.critDim:T.neutralDim,
                              color: stage.pass===true?T.success:stage.pass===false?T.crit:T.text3,
                            }}
                          >{stage.pass===true?'✓':stage.pass===false?'✗':'○'}</span>
                          <span className="text-[10px]" style={{ color:T.text2 }}>{stage.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Testes */}
            {actTab==='Testes' && (
              <div>
                <div className="divide-y" style={{ borderColor:T.border }}>
                  {testSteps.map((step,i) => {
                    const rc = step.result ? RESULT_CFG[step.result] : null
                    return (
                      <div key={step.id} className="flex items-center gap-3 py-2.5">
                        <span className="text-[10px] font-bold w-4 text-center flex-shrink-0" style={{ color:T.text3 }}>{i+1}</span>
                        <span className="flex-1 text-[12px]" style={{ color:T.text1 }}>{step.step}</span>
                        <button
                          onClick={()=>cycleTestResult(step.id)}
                          className="text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0 transition-all"
                          style={{
                            background: rc?rc.bg:T.neutralDim,
                            color: rc?rc.color:T.text3,
                            border:`1px solid ${rc?`${rc.color}30`:T.border}`,
                          }}
                        >
                          {step.result ?? 'N/T'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] mt-3" style={{ color:T.text3 }}>Clique no resultado para alternar: PASS → FAIL → BLOCKED → N/T</p>
              </div>
            )}

            {/* Histórico */}
            {actTab==='Histórico' && (
              <div className="space-y-0">
                {history.map((h,i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5 relative">
                    {i < history.length-1 && (
                      <div className="absolute left-[13px] top-8 bottom-0 w-px" style={{ background:T.border }} />
                    )}
                    <Av i={h.actor} size={26} />
                    <div>
                      <span className="text-[12px]" style={{ color:T.text2 }}>
                        <span className="font-medium" style={{ color:T.text1 }}>{h.actor==='AL'?'Ana Lima':'João Nunes'}</span>{' '}{h.action}
                      </span>
                      <p className="text-[10px] mt-0.5" style={{ color:T.text3 }}>{h.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Worklog */}
            {actTab==='Worklog' && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                  <div>
                    <p className="text-[18px] font-bold tabular" style={{ color:T.text1 }}>3h</p>
                    <p className="text-[10px]" style={{ color:T.text3 }}>Registrado</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold tabular" style={{ color:T.warn }}>5h</p>
                    <p className="text-[10px]" style={{ color:T.text3 }}>Restante</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold tabular" style={{ color:T.text2 }}>8h</p>
                    <p className="text-[10px]" style={{ color:T.text3 }}>Estimado</p>
                  </div>
                </div>
                {worklog.map((w,i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom:`1px solid ${T.border}` }}>
                    <Av i={w.author} size={24} />
                    <span className="flex-1 text-[12px]" style={{ color:T.text2 }}>
                      <span className="font-medium" style={{ color:T.text1 }}>João Nunes</span> registrou trabalho
                    </span>
                    <span className="text-[11px] font-semibold tabular" style={{ color:T.accent }}>{w.spent}</span>
                    <span className="text-[10px]" style={{ color:T.text3 }}>{w.time}</span>
                  </div>
                ))}
                <button className="text-[11px] font-medium transition-colors" style={{ color:T.accent }} onClick={() => setLogWorkOpen(true)}>+ Registrar tempo</button>
              </div>
            )}

            {/* Anexos */}
            {actTab==='Anexos' && (
              <div className="space-y-2">
                {[
                  { name:'screenshot-ios.png', size:'248 KB', type:'image' },
                  { name:'error-log.txt',      size:'12 KB',  type:'text'  },
                ].map(f => (
                  <div key={f.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:T.bgSurface2 }}>
                      {f.type==='image'
                        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="2" stroke={T.accent} strokeWidth="1.2"/><circle cx="4.5" cy="5.5" r="1" fill={T.accent}/><path d="M1 10l3-3 2 2 3-4 4 5" stroke={T.accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="8" height="12" rx="1.5" stroke={T.text2} strokeWidth="1.2"/><path d="M4 5h4M4 7h4M4 9h2" stroke={T.text2} strokeWidth="1" strokeLinecap="round"/></svg>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium" style={{ color:T.text1 }}>{f.name}</p>
                      <p className="text-[10px]" style={{ color:T.text3 }}>{f.size}</p>
                    </div>
                    <button className="text-[11px] transition-colors" style={{ color:T.text3 }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.accent}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.text3}}
                    >↓</button>
                  </div>
                ))}
                <button className="text-[11px] font-medium transition-colors" style={{ color:T.accent }}>+ Adicionar arquivo</button>
              </div>
            )}

            {/* Design */}
            {actTab==='Design' && (
              <div className="p-4 rounded-xl" style={{ background:T.bgSurface, border:`1px solid ${T.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:T.bgSurface2 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill={T.crit}/><rect x="9" y="2" width="5" height="5" rx="1" fill={T.warn}/><circle cx="4.5" cy="11.5" r="2.5" fill={T.success}/><rect x="9" y="9" width="5" height="5" rx="1" fill={T.accent}/></svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color:T.text1 }}>Login Form — Mobile v2</p>
                    <p className="text-[10px]" style={{ color:T.text3 }}>Figma · Atualizado 13 abr</p>
                  </div>
                  <button className="ml-auto text-[11px] font-medium h-7 px-3 rounded-lg" style={{ border:`1px solid ${T.border}`, color:T.text2 }}>Abrir</button>
                </div>
                <div className="h-24 rounded-lg flex items-center justify-center" style={{ background:T.bgSurface2, border:`1px dashed ${T.border}` }}>
                  <span className="text-[11px]" style={{ color:T.text3 }}>Preview do componente</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Right column (metadata sidebar) ─────────────────────────────── */}
      <div
        className="flex-shrink-0 overflow-y-auto px-4 py-5 space-y-0"
        style={{ width:300, borderLeft:`1px solid ${T.border}`, background:T.bgSurface }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color:T.text3 }}>Detalhes</p>

        {/* Type */}
        <MetaRow label="Tipo">
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color:TYPE_CFG.bug.color }}>
            <span>{TYPE_CFG.bug.icon}</span>
            <span>{TYPE_CFG.bug.label}</span>
          </div>
        </MetaRow>

        {/* Status — triggers done transition */}
        <MetaRow label="Status">
          <StatusBadge status={status} onClick={()=>{}} />
          <div className="mt-1.5">
            <MetaSelect
              value={STATUS_CFG[status].label}
              options={Object.values(STATUS_CFG).map(s=>s.label)}
              onChange={v => {
                const entry = Object.entries(STATUS_CFG).find(([_k,cfg])=>cfg.label===v)
                if (entry) handleStatusChange(entry[0])
              }}
            />
          </div>
        </MetaRow>

        {/* Assignee */}
        <MetaRow label="Responsável">
          <div className="flex items-center gap-2">
            <Av i={assignee} size={22} />
            <MetaSelect value={assignee==='JN'?'João Nunes':'Ana Lima'} options={['João Nunes','Ana Lima','Clara Silva']} onChange={v=>{
              setAssignee(v==='João Nunes'?'JN':v==='Ana Lima'?'AL':'CS')
            }} />
          </div>
        </MetaRow>

        {/* Reporter */}
        <MetaRow label="Reporter">
          <div className="flex items-center gap-2">
            <Av i="AL" size={22} />
            <span className="text-[12px]" style={{ color:T.text1 }}>Ana Lima</span>
          </div>
        </MetaRow>

        {/* Priority */}
        <MetaRow label="Prioridade">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold" style={{ color:PRIORITY_CFG[priority].color }}>{PRIORITY_CFG[priority].icon}</span>
            <MetaSelect
              value={PRIORITY_CFG[priority].label}
              options={Object.values(PRIORITY_CFG).map(p=>p.label)}
              onChange={v => {
                const entry = Object.entries(PRIORITY_CFG).find(([_k,cfg])=>cfg.label===v)
                if (entry) setPriority(entry[0] as Priority)
              }}
            />
          </div>
        </MetaRow>

        {/* Epic */}
        <MetaRow label="Épico">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg" style={{ background:`${T.warn}18`, color:T.warn }}>⚡ EP-02 Infra & Eng</span>
        </MetaRow>

        {/* Labels */}
        <MetaRow label="Labels">
          <div className="flex flex-wrap gap-1">
            {labels.map(l=>(
              <span key={l} className="text-[10px] font-semibold px-1.5 py-px rounded-md" style={{ background:T.successDim, color:T.success }}>{l}</span>
            ))}
            <button className="text-[10px] px-1.5 py-px rounded-md" style={{ background:T.bgSurface2, color:T.text3 }}>+</button>
          </div>
        </MetaRow>

        {/* Sprint */}
        <MetaRow label="Sprint">
          <span className="text-[12px]" style={{ color:T.text1 }}>Sprint 14 ▶</span>
        </MetaRow>

        {/* Estimate */}
        <MetaRow label="Estimativa">
          <div className="flex gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color:T.text3 }}>Original</p>
              <p className="text-[13px] font-bold tabular" style={{ color:T.text1 }}>8h</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color:T.text3 }}>Restante</p>
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-bold tabular" style={{ color: remaining>5?T.crit:T.warn }}>{remaining}h</p>
                <div className="flex gap-1">
                  <button onClick={()=>setRemaining(r=>Math.max(0,r-1))} className="w-4 h-4 rounded text-[10px] flex items-center justify-center" style={{ background:T.bgSurface2, color:T.text2 }}>−</button>
                  <button onClick={()=>setRemaining(r=>r+1)} className="w-4 h-4 rounded text-[10px] flex items-center justify-center" style={{ background:T.bgSurface2, color:T.text2 }}>+</button>
                </div>
              </div>
            </div>
          </div>
        </MetaRow>

        {/* Story Points */}
        <MetaRow label="Story Points">
          <span className="text-[13px] font-bold tabular" style={{ color:T.text1 }}>3</span>
        </MetaRow>

        {/* Due date */}
        <MetaRow label="Prazo">
          <span className="text-[12px] font-medium" style={{ color:T.crit }}>Abr 3</span>
        </MetaRow>

        {/* Created / Updated */}
        <MetaRow label="Criado">
          <span className="text-[11px]" style={{ color:T.text2 }}>10 abr 2025</span>
        </MetaRow>
        <MetaRow label="Atualizado">
          <span className="text-[11px]" style={{ color:T.text2 }}>15 abr 2025</span>
        </MetaRow>
      </div>
      {addRelOpen && <AddRelationModal currentIssueKey="PM-101" onClose={()=>setAddRelOpen(false)} onAdd={()=>setAddRelOpen(false)} />}
      {addSubOpen && <AddSubtaskModal parentKey="PM-101" parentTitle="Homepage hero — layout explorations" onClose={()=>setAddSubOpen(false)} onCreate={()=>setAddSubOpen(false)} />}
      {logWorkOpen && (
        <LogWorkModal
          issueKey="PM-101"
          issueTitle="Homepage hero — layout explorations"
          originalEstimate={5}
          remaining={remaining}
          onClose={() => setLogWorkOpen(false)}
          onSave={() => setLogWorkOpen(false)}
        />
      )}
    </div>
  )
}
