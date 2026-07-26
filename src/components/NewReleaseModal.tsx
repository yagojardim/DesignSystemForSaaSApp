import { useState } from 'react'
import { T } from './ds/tokens'

const LINKABLE = [
  { key:'PM-106', title:'Copywriting da página de preços v2' },
  { key:'PM-109', title:'Entrevistas com 5 clientes trial' },
  { key:'PM-110', title:'Auditoria de a11y nas páginas' },
  { key:'PM-114', title:'Auditoria de metadata SEO' },
  { key:'PM-116', title:'Sistema de busca do portal' },
]

const inputStyle: React.CSSProperties = {
  width:'100%', background:'#1e222c', border:'1px solid #262b37',
  borderRadius:8, padding:'8px 12px', color:'#e7eaf2', fontSize:13, outline:'none', boxSizing:'border-box',
}

interface Props { onClose:()=>void; onSave:(r:{version:string;name:string;date:string;notes:string})=>void }

export function NewReleaseModal({ onClose, onSave }: Props) {
  const [version,  setVersion]  = useState('')
  const [name,     setName]     = useState('')
  const [date,     setDate]     = useState('')
  const [status,   setStatus]   = useState('planned')
  const [notes,    setNotes]    = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [success,  setSuccess]  = useState(false)
  const canSubmit = version.trim().length > 0 && name.trim().length > 0

  function toggle(key: string) { setSelected(s => s.includes(key) ? s.filter(k=>k!==key) : [...s,key]) }

  if (success) return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
      <div style={{ background:T.bgSurface,border:`1px solid ${T.border}`,borderRadius:16,padding:40,boxShadow:T.shadowModal,width:400,textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
        <p style={{ fontSize:16,fontWeight:700,color:T.text1,marginBottom:6 }}>Release criada!</p>
        <p style={{ fontSize:22,fontWeight:800,color:T.accent,marginBottom:20 }}>{version} — {name}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
          <button onClick={()=>{onSave({version,name,date,notes});onClose()}} style={{ padding:'8px 20px',borderRadius:8,background:T.accent,color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer' }}>Ver releases →</button>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,background:'transparent',color:T.text2,border:`1px solid ${T.border}`,fontSize:13,cursor:'pointer' }}>Fechar</button>
        </div>
      </div>
    </div>
  )

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
      <div style={{ background:T.bgSurface,border:`1px solid ${T.border}`,borderRadius:16,padding:28,boxShadow:T.shadowModal,width:520,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700,color:T.text1 }}>Nova Release</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',color:T.text3,fontSize:20,cursor:'pointer',lineHeight:1 }}>×</button>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:T.text3,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'.04em' }}>Versão *</label>
            <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="v1.3.0" style={inputStyle} />
            <p style={{ fontSize:11,color:T.text3,marginTop:4,marginBottom:0 }}>Próxima sugerida: <span style={{ color:T.accent }}>v1.2.0</span></p>
          </div>

          <div>
            <label style={{ fontSize:11,fontWeight:600,color:T.text3,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'.04em' }}>Nome da release *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Pesquisa & SEO" style={inputStyle} />
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:600,color:T.text3,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'.04em' }}>Data planejada</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:600,color:T.text3,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'.04em' }}>Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} style={inputStyle}>
                <option value="planned">Planejada</option>
                <option value="in-progress">Em andamento</option>
                <option value="released">Lançada</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize:11,fontWeight:600,color:T.text3,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'.04em' }}>
              Issues vinculadas {selected.length > 0 && <span style={{ color:T.accent }}> · {selected.length} selecionadas</span>}
            </label>
            <div style={{ border:`1px solid ${T.border}`,borderRadius:8,overflow:'hidden' }}>
              {LINKABLE.map((issue, i) => (
                <label key={issue.key} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',cursor:'pointer',background:selected.includes(issue.key)?T.accentDim:'transparent',borderTop:i>0?`1px solid ${T.border}`:'none' }}>
                  <input type="checkbox" checked={selected.includes(issue.key)} onChange={()=>toggle(issue.key)} style={{ accentColor:T.accent }} />
                  <span style={{ fontSize:11,fontWeight:700,color:T.accent,flexShrink:0 }}>{issue.key}</span>
                  <span style={{ fontSize:12,color:T.text2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{issue.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize:11,fontWeight:600,color:T.text3,marginBottom:5,display:'block',textTransform:'uppercase',letterSpacing:'.04em' }}>Notas de release</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="O que muda nesta release…" style={{ ...inputStyle,resize:'vertical',fontFamily:'inherit' }} />
          </div>
        </div>

        <div style={{ display:'flex',justifyContent:'flex-end',gap:10,marginTop:24,paddingTop:20,borderTop:`1px solid ${T.border}` }}>
          <button onClick={onClose} style={{ padding:'8px 18px',borderRadius:8,background:'transparent',color:T.text2,border:`1px solid ${T.border}`,fontSize:13,cursor:'pointer' }}>Cancelar</button>
          <button onClick={()=>canSubmit&&setSuccess(true)} disabled={!canSubmit} style={{ padding:'8px 20px',borderRadius:8,background:canSubmit?T.accent:T.border,color:canSubmit?'#fff':T.text3,border:'none',fontSize:13,fontWeight:600,cursor:canSubmit?'pointer':'not-allowed',opacity:canSubmit?1:.55 }}>
            Criar release
          </button>
        </div>
      </div>
    </div>
  )
}
