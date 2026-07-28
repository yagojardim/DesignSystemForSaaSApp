import { useState, useEffect, useCallback } from 'react'
import { T } from './ds/tokens'
import { AddRelationModal } from './AddRelationModal'
import { useSession } from '../data/SessionContext'
import { can } from '../data/permissions'

// ─── Exported data interfaces ──────────────────────────────────────────────────
export interface WIComment  { author: string; authorName?: string; body: string; time: string }
export interface WILinkedIssue { relType: string; key: string; title: string; status: string; priority: string; assigneeInitials?: string }
export interface WIChild    { key: string; title: string; type: string; status: string; assigneeInitials?: string }
export interface WIAcItem   { id: string; text: string; done: boolean }

export interface WorkItemData {
  key:               string
  type:              string
  title:             string
  status:            string
  priority:          string
  labels:            string[]
  assigneeInitials:  string
  assigneeName?:     string
  reporterInitials?: string
  reporterName?:     string
  epicKey?:          string
  epicLabel?:        string
  epicColor?:        string
  sprintName?:       string
  blocked?:          boolean
  blockedReason?:    string
  delayed?:          boolean
  severity?:         string
  description?:      string
  dueDate?:          string
  points?:           number
  fixVersions?:      string[]
  acItems?:          WIAcItem[]
  children?:         WIChild[]
  linkedIssues?:     WILinkedIssue[]
  comments?:         WIComment[]
  createdAt?:        string
  updatedAt?:        string
  evidenceCount?:    number
  attachmentCount?:  number
  parentId?:         string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  backlog:'Backlog', todo:'A fazer', 'in-progress':'Em andamento', 'in-review':'Em revisão', done:'Concluído',
}
const STATUS_COLOR: Record<string, string> = {
  backlog:T.text3, todo:T.text2, 'in-progress':T.accent, 'in-review':T.warn, done:T.success,
}
const STATUS_BG: Record<string, string> = {
  backlog:T.neutralDim, todo:`${T.text3}18`, 'in-progress':T.accentDim, 'in-review':T.warnDim, done:T.successDim,
}
const PRIORITY_LABEL: Record<string, string> = {
  critical:'Crítica', high:'Alta', medium:'Média', low:'Baixa',
}
const PRIORITY_COLOR: Record<string, string> = {
  critical:T.crit, high:T.warn, medium:T.accent, low:T.text3,
}
const TYPE_CFG: Record<string, { icon: string; color: string; label: string }> = {
  bug:     { icon:'⬟', color:T.crit,    label:'Bug'       },
  story:   { icon:'◇', color:T.accent,  label:'História'  },
  task:    { icon:'☑', color:T.text2,   label:'Tarefa'    },
  subtask: { icon:'◻', color:T.text3,   label:'Sub-tarefa'},
  epic:    { icon:'⚡', color:T.warn,   label:'Épico'     },
  feature: { icon:'◈', color:T.purple,  label:'Feature'   },
}
const AV_COLORS: Record<string, string> = {
  AL:T.accent, NM:T.purple, JN:T.warn, CS:T.success, RM:T.crit, LF:'#f97316',
}
const STATUSES = ['backlog','todo','in-progress','in-review','done']
const PRIORITIES = ['critical','high','medium','low']

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Av({ i, size = 24 }: { i: string; size?: number }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:size, height:size, borderRadius:'50%', fontSize:size*0.38,
      fontWeight:700, color:'white', flexShrink:0, background:AV_COLORS[i] ?? T.text3,
    }}>{i}</span>
  )
}

function SecHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:8, marginBottom:10, borderBottom:`1px solid ${T.border}` }}>
      <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:T.text3 }}>{title}</span>
      {count != null && (
        <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:20, background:T.accentDim, color:T.accent }}>{count}</span>
      )}
      {action && <div style={{ marginLeft:'auto' }}>{action}</div>}
    </div>
  )
}

function StatusPill({ status, size='sm' }: { status: string; size?: 'sm' | 'xs' }) {
  const c = STATUS_COLOR[status] ?? T.text3
  const bg = STATUS_BG[status] ?? T.neutralDim
  const fs = size === 'xs' ? 9 : 11
  const px = size === 'xs' ? 6 : 10
  return (
    <span style={{ fontSize:fs, fontWeight:600, padding:`2px ${px}px`, borderRadius:20, background:bg, color:c, border:`1px solid ${c}30` }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ─── Done Transition Modal ─────────────────────────────────────────────────────
const RESOLUTIONS = ['Corrigido','Não vai corrigir','Duplicado','Não reproduzível','Inválido']

function DoneTransitionModal({ onConfirm, onClose }: {
  onConfirm: () => void
  onClose:   () => void
}) {
  const [resolution, setResolution] = useState(RESOLUTIONS[0])
  const [evidence,   setEvidence]   = useState('')
  const [comment,    setComment]    = useState('')
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(9,9,11,0.85)', backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width:480, background:T.bgSurface, border:`1px solid ${T.border2}`, borderRadius:18, overflow:'hidden', boxShadow:T.shadowModal }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:T.text1 }}>Mover para Concluído</p>
            <p style={{ margin:'2px 0 0', fontSize:11, color:T.text3 }}>Esta ação registra a resolução da issue</p>
          </div>
          <button onClick={onClose} style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:'none', background:'transparent', color:T.text3, cursor:'pointer', fontSize:16 }}>×</button>
        </div>
        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:600, color:T.text3 }}>Resolução <span style={{ color:T.crit }}>*</span></span>
            <select value={resolution} onChange={e=>setResolution(e.target.value)}
              style={{ height:36, padding:'0 12px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSurface2, color:T.text1, fontSize:13, colorScheme:'dark', fontFamily:'inherit' }}>
              {RESOLUTIONS.map(r=><option key={r} value={r} style={{ background:T.bgSurface2 }}>{r}</option>)}
            </select>
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:600, color:T.text3 }}>Evidência (link ou referência)</span>
            <input value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="https://... ou número de teste"
              style={{ height:36, padding:'0 12px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSurface2, color:T.text1, fontSize:13, fontFamily:'inherit' }}
              onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
              onBlur={e=>{e.currentTarget.style.borderColor=T.border}} />
          </label>
          <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:600, color:T.text3 }}>Comentário de fechamento</span>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3} placeholder="Descreva como foi resolvida..."
              style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSurface2, color:T.text1, fontSize:13, resize:'none', fontFamily:'inherit', colorScheme:'dark' }}
              onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
              onBlur={e=>{e.currentTarget.style.borderColor=T.border}} />
          </label>
        </div>
        <div style={{ padding:'12px 20px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ height:32, padding:'0 16px', borderRadius:8, border:'none', background:'transparent', color:T.text2, cursor:'pointer', fontSize:13 }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>Cancelar</button>
          <button onClick={onConfirm} style={{ height:32, padding:'0 16px', borderRadius:8, border:'none', background:T.success, color:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.filter='brightness(1.15)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.filter='none'}}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail row in right panel ────────────────────────────────────────────────
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
      <span style={{ fontSize:11, color:T.text3, width:90, flexShrink:0, paddingTop:1 }}>{label}</span>
      <div style={{ flex:1, fontSize:12, color:T.text1 }}>{children}</div>
    </div>
  )
}

// ─── Inline dropdown used in right panel ──────────────────────────────────────
function InlineSelect({ value, options, onChange, getLabel, getColor }: {
  value: string
  options: string[]
  onChange: (v: string) => void
  getLabel?: (v: string) => string
  getColor?: (v: string) => string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, padding:'2px 6px', borderRadius:6, border:'none', background:'transparent', color:getColor?.(value) ?? T.text1, cursor:'pointer' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>
        {getLabel?.(value) ?? value}
        <span style={{ opacity:0.5, fontSize:9 }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:200, minWidth:140, background:T.bgSurface, border:`1px solid ${T.border2}`, borderRadius:10, boxShadow:T.shadowModal, padding:'4px 0', overflow:'hidden' }}
          onClick={e=>e.stopPropagation()}>
          {options.map(o=>(
            <button key={o} onClick={()=>{onChange(o);setOpen(false)}}
              style={{ width:'100%', textAlign:'left', padding:'6px 12px', border:'none', background: o===value?T.bgSurface2:'transparent', color:getColor?.(o) ?? (o===value?T.accent:T.text1), fontSize:12, cursor:'pointer', fontWeight: o===value?700:400 }}
              onMouseEnter={e=>{if(o!==value)(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
              onMouseLeave={e=>{if(o!==value)(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>
              {getLabel?.(o) ?? o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function WorkItemDetail({ data, onUpdate, onClose, mode = 'drawer' }: {
  data:      WorkItemData
  onUpdate:  (updated: WorkItemData) => void
  onClose?:  () => void
  mode?:     'drawer' | 'page'
}) {
  const { activeUser } = useSession()
  const canEdit = can(activeUser.permissions, 'board:manage')

  // ── Local state (all mutable fields) ────────────────────────────────────────
  const [local,       setLocal]      = useState<WorkItemData>(data)
  const [editTitle,   setEditTitle]  = useState(false)
  const [statusOpen,  setStatusOpen] = useState(false)
  const [addRelOpen,  setAddRelOpen] = useState(false)
  const [showDone,    setShowDone]   = useState(false)
  const [acItems,     setAcItems]    = useState<WIAcItem[]>(data.acItems ?? [])
  const [newAc,       setNewAc]      = useState('')
  const [comments,    setComments]   = useState<WIComment[]>(data.comments ?? [])
  const [commentText, setCommentText]= useState('')
  const [children,    setChildren]   = useState<WIChild[]>(data.children ?? [])
  const [linkedIssues,setLinkedIssues]=useState<WILinkedIssue[]>(data.linkedIssues ?? [])
  const [loading,     setLoading]    = useState(mode === 'drawer')

  useEffect(() => {
    if (mode === 'drawer') {
      const t = setTimeout(() => setLoading(false), 260)
      return () => clearTimeout(t)
    }
  }, [mode])

  // ── Update helper ────────────────────────────────────────────────────────────
  const update = useCallback((patch: Partial<WorkItemData>) => {
    setLocal(prev => {
      const next = { ...prev, ...patch }
      onUpdate(next)
      return next
    })
  }, [onUpdate])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleStatusChange(s: string) {
    if (s === 'done') { setShowDone(true) }
    else { update({ status: s }); setStatusOpen(false) }
  }

  function handleDoneConfirm() {
    update({ status: 'done' })
    setShowDone(false)
    setStatusOpen(false)
  }

  function handleAddComment() {
    const t = commentText.trim()
    if (!t) return
    const initials = activeUser.name.split(' ').slice(0,2).map((p: string)=>p[0]).join('')
    const c: WIComment = { author: initials, authorName: activeUser.name, body: t, time: 'agora' }
    const next = [...comments, c]
    setComments(next)
    update({ comments: next })
    setCommentText('')
  }

  function toggleAc(id: string) {
    const next = acItems.map(a => a.id===id ? {...a,done:!a.done} : a)
    setAcItems(next); update({ acItems: next })
  }

  function addAcItem() {
    const t = newAc.trim(); if (!t) return
    const next = [...acItems, { id:`ac-${Date.now()}`, text:t, done:false }]
    setAcItems(next); update({ acItems: next }); setNewAc('')
  }

  function removeAcItem(id: string) {
    const next = acItems.filter(a => a.id !== id)
    setAcItems(next); update({ acItems: next })
  }

  function handleAddRelation({ type, targetKey }: { type: string; targetKey: string }) {
    const link: WILinkedIssue = { relType: type, key: targetKey, title: `Issue ${targetKey}`, status: 'todo', priority: 'medium' }
    const next = [...linkedIssues, link]
    setLinkedIssues(next); update({ linkedIssues: next }); setAddRelOpen(false)
  }

  function handleAssignToMe() {
    const initials = activeUser.name.split(' ').slice(0,2).map((p: string)=>p[0]).join('')
    update({ assigneeInitials: initials, assigneeName: activeUser.name })
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const acDone = acItems.filter(a=>a.done).length
  const childDone = children.filter(c=>c.status==='done').length
  const childPct = children.length > 0 ? Math.round(childDone/children.length*100) : 0

  const linkedByType: Record<string,WILinkedIssue[]> = {}
  for (const li of linkedIssues) {
    if (!linkedByType[li.relType]) linkedByType[li.relType] = []
    linkedByType[li.relType].push(li)
  }

  const typeCfg = TYPE_CFG[local.type] ?? TYPE_CFG.task

  // ── Shell variables ───────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = mode === 'drawer'
    ? { position:'fixed', top:0, right:0, bottom:0, width:560, background:T.bgSurface, borderLeft:`1px solid ${T.border}`, boxShadow:'-12px 0 48px rgba(0,0,0,0.55)', zIndex:301, display:'flex', flexDirection:'column', overflow:'hidden' }
    : { display:'flex', flexDirection:'column', flex:1, overflow:'hidden', background:T.bgSurface }

  return (
    <>
      {showDone && <DoneTransitionModal onConfirm={handleDoneConfirm} onClose={()=>setShowDone(false)} />}
      {addRelOpen && <AddRelationModal currentIssueKey={local.key} onClose={()=>setAddRelOpen(false)} onAdd={handleAddRelation} />}

      {mode === 'drawer' && (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300 }} />
      )}

      <div style={panelStyle}>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ flexShrink:0, borderBottom:`1px solid ${T.border}` }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px 0', fontSize:11, color:T.text3 }}>
            {local.epicLabel ? (
              <>
                <span style={{ color:local.epicColor ?? T.warn }}>{local.epicLabel}</span>
                <span>›</span>
              </>
            ) : null}
            <span style={{ fontFamily:'monospace', color:T.text2 }}>{local.key}</span>
          </div>

          {/* Type + key + status row */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px 10px', flexWrap:'wrap' }}>
            <span style={{ fontSize:14, color:typeCfg.color }}>{typeCfg.icon}</span>
            <span style={{ fontFamily:'monospace', fontSize:10, color:T.text3, background:T.bgSurface2, border:`1px solid ${T.border}`, borderRadius:4, padding:'1px 6px' }}>{local.key}</span>
            <span style={{ fontSize:11, color:T.text3 }}>{typeCfg.label}</span>

            {/* Status dropdown */}
            <div style={{ position:'relative' }}>
              <button
                onClick={()=>canEdit && setStatusOpen(o=>!o)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:STATUS_BG[local.status]??T.neutralDim, border:`1px solid ${STATUS_COLOR[local.status]??T.text3}40`, color:STATUS_COLOR[local.status]??T.text3, fontSize:11, fontWeight:600, cursor:canEdit?'pointer':'default' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_COLOR[local.status], flexShrink:0 }} />
                {STATUS_LABEL[local.status] ?? local.status}
                {canEdit && <span style={{ opacity:0.5, fontSize:9 }}>▾</span>}
              </button>
              {statusOpen && (
                <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', top:'110%', left:0, zIndex:200, minWidth:160, background:T.bgSurface, border:`1px solid ${T.border2}`, borderRadius:10, boxShadow:T.shadowModal, padding:'4px 0', overflow:'hidden' }}>
                  {STATUSES.map(s=>(
                    <button key={s} onClick={()=>handleStatusChange(s)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:'none', background: s===local.status?T.bgSurface2:'transparent', color: s===local.status?STATUS_COLOR[s]:T.text2, fontSize:12, fontWeight: s===local.status?700:400, cursor:'pointer', textAlign:'left' }}
                      onMouseEnter={e=>{if(s!==local.status)(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                      onMouseLeave={e=>{if(s!==local.status)(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_COLOR[s], flexShrink:0 }} />
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!canEdit && (
              <span style={{ fontSize:10, color:T.text3, background:T.bgSurface2, border:`1px solid ${T.border}`, borderRadius:6, padding:'2px 8px' }}>Somente leitura</span>
            )}

            {/* Right-side actions */}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              <ActionBtn title="Observar">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2C3.5 2 1 6.5 1 6.5S3.5 11 6.5 11 12 6.5 12 6.5 9.5 2 6.5 2z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
              </ActionBtn>
              <ActionBtn title="Compartilhar">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 4.5 10 3m0 0 1.5 1.5M10 3v4a3 3 0 0 1-3 3H3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </ActionBtn>
              {onClose && (
                <button onClick={onClose}
                  style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:'none', background:'transparent', color:T.text3, cursor:'pointer', fontSize:16 }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>✕</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Loading skeleton (drawer only) */}
          {loading && (
            <div style={{ flex:1, padding:'20px 22px', display:'flex', flexDirection:'column', gap:12 }}>
              {[72,40,100,55,80,60].map((w,i) => (
                <div key={i} style={{ height: i===2?90:14, width:`${w}%`, borderRadius:8, background:T.bgSurface2, animation:'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          )}

          {!loading && <>
            {/* ── Main left column ─────────────────────────────────────────── */}
            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px', minWidth:0 }}>

              {/* Editable title */}
              {editTitle ? (
                <input autoFocus value={local.title}
                  onChange={e=>setLocal(p=>({...p,title:e.target.value}))}
                  onBlur={()=>{ setEditTitle(false); update({ title: local.title }) }}
                  onKeyDown={e=>{ if(e.key==='Enter') { setEditTitle(false); update({ title: local.title }) } }}
                  style={{ width:'100%', fontSize:17, fontWeight:700, color:T.text1, background:T.bgSurface2, border:`1px solid ${T.accent}`, borderRadius:8, padding:'4px 8px', marginBottom:12, outline:'none', fontFamily:'inherit' }} />
              ) : (
                <h2
                  onClick={()=>canEdit && setEditTitle(true)}
                  style={{ margin:'0 0 12px', fontSize:17, fontWeight:700, color:T.text1, lineHeight:1.35, cursor:canEdit?'text':'default', padding:'4px 8px', borderRadius:8, marginLeft:-8, transition:'background 0.12s' }}
                  onMouseEnter={e=>{ if(canEdit)(e.currentTarget as HTMLHeadingElement).style.background=T.bgSurface2 }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLHeadingElement).style.background='transparent' }}
                >{local.title}</h2>
              )}

              {/* Action bar */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:18, flexWrap:'wrap' }}>
                {[
                  { label:'Anexar', icon:'📎' },
                  { label:'+ Child issue', icon:null },
                  { label:'Vincular issue', icon:null, onClick:()=>setAddRelOpen(true) },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick}
                    style={{ display:'flex', alignItems:'center', gap:4, height:28, padding:'0 10px', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', color:T.text2, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=T.accent;(e.currentTarget as HTMLButtonElement).style.color=T.accent}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=T.border;(e.currentTarget as HTMLButtonElement).style.color=T.text2}}>
                    {btn.icon && <span>{btn.icon}</span>}{btn.label}
                  </button>
                ))}
                <button style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:`1px solid ${T.border}`, background:'transparent', color:T.text3, cursor:'pointer', fontSize:14 }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=T.border2;(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=T.border;(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>···</button>
              </div>

              {/* Blocked banner */}
              {local.blocked && (
                <div style={{ marginBottom:16, padding:'10px 14px', background:T.critDim, border:`1px solid ${T.crit}30`, borderRadius:8, display:'flex', gap:8 }}>
                  <span style={{ color:T.crit, flexShrink:0 }}>⛔</span>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, color:T.crit }}>Bloqueado</p>
                    <p style={{ margin:0, fontSize:12, color:T.text2 }}>{local.blockedReason || 'Motivo não especificado.'}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              <section style={{ marginBottom:22 }}>
                <SecHeader title="Descrição" />
                {local.description?.trim() ? (
                  <p style={{ margin:0, fontSize:13, color:T.text2, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{local.description}</p>
                ) : (
                  <div style={{ fontSize:12, color:T.text3, fontStyle:'italic', padding:'10px 12px', background:T.bgSurface2, borderRadius:8, border:`1px dashed ${T.border}` }}>
                    Sem descrição.{canEdit ? ' Clique para adicionar...' : ''}
                  </div>
                )}
              </section>

              {/* Child issues */}
              {children.length > 0 && (
                <section style={{ marginBottom:22 }}>
                  <SecHeader title="Child Issues" count={children.length} />
                  {/* Progress bar */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, color:T.text3 }}>{childPct}% concluído</span>
                      <span style={{ fontSize:11, color:T.text3 }}>{childDone}/{children.length}</span>
                    </div>
                    <div style={{ height:4, borderRadius:2, background:T.bgSurface2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${childPct}%`, background:T.success, borderRadius:2, transition:'width 0.3s' }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {children.map(ch => {
                      const ct = TYPE_CFG[ch.type] ?? TYPE_CFG.task
                      return (
                        <div key={ch.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:8, cursor:'default' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=T.bgSurface2}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent'}}>
                          <span style={{ fontSize:12, color:ct.color, flexShrink:0 }}>{ct.icon}</span>
                          <span style={{ fontFamily:'monospace', fontSize:10, color:T.text3, flexShrink:0, minWidth:52 }}>{ch.key}</span>
                          <span style={{ flex:1, fontSize:12, color:T.text1, textDecoration:ch.status==='done'?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.title}</span>
                          {ch.assigneeInitials && <Av i={ch.assigneeInitials} size={18} />}
                          <StatusPill status={ch.status} size="xs" />
                        </div>
                      )
                    })}
                  </div>
                  <button style={{ marginTop:6, fontSize:11, border:'none', background:'transparent', color:T.text3, cursor:'pointer', padding:'2px 4px', borderRadius:4 }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.accent}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.text3}}>+ Adicionar child issue</button>
                </section>
              )}

              {/* Linked issues */}
              {(linkedIssues.length > 0 || canEdit) && (
                <section style={{ marginBottom:22 }}>
                  <SecHeader title="Relações" count={linkedIssues.length}
                    action={
                      <button onClick={()=>setAddRelOpen(true)}
                        style={{ fontSize:11, border:'none', background:'transparent', color:T.text3, cursor:'pointer', padding:'2px 8px', borderRadius:6 }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.accent;(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.text3;(e.currentTarget as HTMLButtonElement).style.background='transparent'}}>
                        + Vincular issue
                      </button>
                    }
                  />
                  {linkedIssues.length === 0 ? (
                    <div style={{ fontSize:12, color:T.text3, fontStyle:'italic' }}>Nenhuma relação. Clique em "+ Vincular issue" para adicionar.</div>
                  ) : (
                    Object.entries(linkedByType).map(([relType, items]) => (
                      <div key={relType} style={{ marginBottom:10 }}>
                        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:T.text3, display:'block', marginBottom:4 }}>{relType}</span>
                        {items.map(li => (
                          <div key={li.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:8 }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=T.bgSurface2}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent'}}>
                            <span style={{ fontFamily:'monospace', fontSize:10, color:T.accent, flexShrink:0, minWidth:52 }}>{li.key}</span>
                            <span style={{ flex:1, fontSize:12, color:T.text1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{li.title}</span>
                            {li.assigneeInitials && <Av i={li.assigneeInitials} size={18} />}
                            <span style={{ fontSize:10, color:PRIORITY_COLOR[li.priority], flexShrink:0 }}>●</span>
                            <StatusPill status={li.status} size="xs" />
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </section>
              )}

              {/* Acceptance criteria (story / task) */}
              {(local.type === 'story' || local.type === 'task' || acItems.length > 0) && (
                <section style={{ marginBottom:22 }}>
                  <SecHeader title="Critérios de aceite" count={acDone} />
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {acItems.map(item => (
                      <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'5px 8px', borderRadius:8, cursor:'default' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=T.bgSurface2}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='transparent'}}>
                        <button onClick={()=>toggleAc(item.id)}
                          style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${item.done?T.success:T.border2}`, background:item.done?T.success:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:1 }}>
                          {item.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>}
                        </button>
                        <span style={{ flex:1, fontSize:12, color:item.done?T.text3:T.text1, textDecoration:item.done?'line-through':'none', lineHeight:1.45 }}>{item.text}</span>
                        {canEdit && (
                          <button onClick={()=>removeAcItem(item.id)}
                            style={{ width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', border:'none', background:'transparent', color:T.text3, cursor:'pointer', fontSize:14, opacity:0, transition:'opacity 0.12s', borderRadius:4 }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent'}}
                            className="group-hover:opacity-100">×</button>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                        <input value={newAc} onChange={e=>setNewAc(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter') addAcItem() }}
                          placeholder="+ Adicionar critério..."
                          style={{ flex:1, height:28, padding:'0 10px', borderRadius:8, border:`1px dashed ${T.border}`, background:'transparent', color:T.text1, fontSize:12, fontFamily:'inherit', outline:'none' }}
                          onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
                          onBlur={e=>{e.currentTarget.style.borderColor=T.border}} />
                        {newAc && (
                          <button onClick={addAcItem} style={{ height:28, padding:'0 10px', borderRadius:8, border:'none', background:T.accent, color:'white', fontSize:11, fontWeight:600, cursor:'pointer' }}>OK</button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Comments */}
              <section style={{ marginBottom:22 }}>
                <SecHeader title="Atividade" />
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {comments.map((c,i) => (
                    <div key={i} style={{ display:'flex', gap:10 }}>
                      <Av i={c.author} size={28} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:T.text1 }}>{c.authorName ?? c.author}</span>
                          <span style={{ fontSize:10, color:T.text3 }}>{c.time}</span>
                        </div>
                        <p style={{ margin:0, fontSize:12, color:T.text2, lineHeight:1.6, padding:'8px 12px', background:T.bgSurface2, border:`1px solid ${T.border}`, borderRadius:10 }}>{c.body}</p>
                      </div>
                    </div>
                  ))}
                  {/* Compose */}
                  <div style={{ display:'flex', gap:10 }}>
                    <Av i={activeUser.name.split(' ').slice(0,2).map((p: string)=>p[0]).join('')} size={28} />
                    <div style={{ flex:1 }}>
                      <textarea value={commentText} onChange={e=>setCommentText(e.target.value)}
                        rows={2} placeholder="Adicionar comentário..."
                        style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:`1px solid ${T.border}`, background:T.bgSurface2, color:T.text1, fontSize:12, resize:'none', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                        onFocus={e=>{e.currentTarget.style.borderColor=T.accent}}
                        onBlur={e=>{e.currentTarget.style.borderColor=T.border}} />
                      {commentText && (
                        <button onClick={handleAddComment} style={{ marginTop:6, height:28, padding:'0 12px', borderRadius:8, border:'none', background:T.accent, color:'white', fontSize:12, fontWeight:600, cursor:'pointer' }}>Salvar</button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Right details panel ───────────────────────────────────────── */}
            <div style={{ width:220, flexShrink:0, borderLeft:`1px solid ${T.border}`, overflowY:'auto', padding:'14px 16px' }}>
              <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:T.text3 }}>Detalhes</p>

              {/* Assignee */}
              <DetailRow label="Responsável">
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {local.assigneeInitials ? <Av i={local.assigneeInitials} size={20} /> : null}
                  <span style={{ fontSize:12, color:T.text1 }}>{(local.assigneeName ?? local.assigneeInitials) || '—'}</span>
                </div>
                {canEdit && (
                  <button onClick={handleAssignToMe}
                    style={{ marginTop:4, fontSize:10, color:T.accent, border:'none', background:'transparent', cursor:'pointer', padding:0, fontFamily:'inherit' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.textDecoration='underline'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.textDecoration='none'}}>Atribuir a mim</button>
                )}
              </DetailRow>

              {/* Labels */}
              {local.labels.length > 0 && (
                <DetailRow label="Labels">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {local.labels.map(l => (
                      <span key={l} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:T.indigoDim, color:T.indigo, border:`1px solid ${T.indigo}30` }}>{l}</span>
                    ))}
                  </div>
                </DetailRow>
              )}

              {/* Priority */}
              <DetailRow label="Prioridade">
                {canEdit ? (
                  <InlineSelect
                    value={local.priority}
                    options={PRIORITIES}
                    onChange={v=>update({ priority: v })}
                    getLabel={v=>PRIORITY_LABEL[v]}
                    getColor={v=>PRIORITY_COLOR[v]}
                  />
                ) : (
                  <span style={{ color:PRIORITY_COLOR[local.priority], fontSize:12 }}>{PRIORITY_LABEL[local.priority]}</span>
                )}
              </DetailRow>

              {/* Fix versions */}
              <DetailRow label="Fix versions">
                {(local.fixVersions?.length ?? 0) > 0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {local.fixVersions!.map(v=>(
                      <span key={v} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:T.successDim, color:T.success, border:`1px solid ${T.success}30` }}>{v}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize:11, color:T.text3, fontStyle:'italic' }}>—</span>
                )}
              </DetailRow>

              {/* Reporter */}
              {(local.reporterInitials || local.reporterName) && (
                <DetailRow label="Relator">
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {local.reporterInitials && <Av i={local.reporterInitials} size={18} />}
                    <span style={{ fontSize:12 }}>{local.reporterName ?? local.reporterInitials}</span>
                  </div>
                </DetailRow>
              )}

              {/* Points */}
              {local.points != null && (
                <DetailRow label="Story pts">
                  <span style={{ fontSize:12 }}>{local.points > 0 ? `${local.points} pt` : '—'}</span>
                </DetailRow>
              )}

              {/* Due date */}
              {local.dueDate && (
                <DetailRow label="Prazo">
                  <span style={{ fontSize:12, color:local.delayed?T.warn:T.text1 }}>{local.dueDate}</span>
                </DetailRow>
              )}

              {/* Sprint */}
              {local.sprintName && (
                <DetailRow label="Sprint">
                  <span style={{ fontSize:12 }}>{local.sprintName}</span>
                </DetailRow>
              )}

              {/* Epic */}
              {local.epicLabel && (
                <DetailRow label="Épico">
                  <span style={{ fontSize:12, color:local.epicColor ?? T.warn }}>{local.epicLabel}</span>
                </DetailRow>
              )}

              {/* Bug severity */}
              {local.type === 'bug' && local.severity && (
                <DetailRow label="Severidade">
                  <span style={{ fontSize:12, fontWeight:600, color:local.severity==='critical'?T.crit:local.severity==='high'?T.warn:T.accent }}>
                    {local.severity.charAt(0).toUpperCase()+local.severity.slice(1)}
                  </span>
                </DetailRow>
              )}

              {/* Timestamps */}
              {local.createdAt && (
                <DetailRow label="Criado em">
                  <span style={{ fontSize:11, color:T.text3 }}>{local.createdAt}</span>
                </DetailRow>
              )}
              {local.updatedAt && (
                <DetailRow label="Atualizado">
                  <span style={{ fontSize:11, color:T.text3 }}>{local.updatedAt}</span>
                </DetailRow>
              )}
            </div>
          </>}
        </div>
      </div>
    </>
  )
}

function ActionBtn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button title={title}
      style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:'none', background:'transparent', color:T.text3, cursor:'pointer' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgSurface2;(e.currentTarget as HTMLButtonElement).style.color=T.text2}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.color=T.text3}}>
      {children}
    </button>
  )
}
