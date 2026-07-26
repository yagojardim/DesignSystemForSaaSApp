import { useState } from 'react'
import { T } from '../components/ds/tokens'
import { ISSUES, PRIORITY_CFG, type Issue } from '../data/issues'

type CalView = 'month' | 'week'

const DOW_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// April 2025: month=3 (0-indexed), year=2025
// April 1, 2025 = Tuesday => getDay()=2
const BASE_YEAR = 2025
const BASE_MONTH = 3 // April

function priorityColor(p: Issue['priority']) {
  return PRIORITY_CFG[p].color
}

function buildMonthGrid(year: number, month: number): (number|null)[][] {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number|null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (number|null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i+7))
  return rows
}

const HOURS = Array.from({length:11},(_,i)=>i+9) // 9..19

function IssueChip({ issue, compact=false }: { issue: Issue; compact?: boolean }) {
  const color = priorityColor(issue.priority)
  return (
    <div style={{
      background:`${color}18`, borderLeft:`2.5px solid ${color}`,
      borderRadius:3, padding: compact ? '1px 5px' : '2px 6px',
      fontSize:10, color:T.text1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      marginBottom:2, cursor:'pointer',
    }} title={`${issue.key} – ${issue.title}`}>
      <span style={{color, fontWeight:700, marginRight:3}}>{issue.key}</span>
      {compact && <span style={{color:T.text2}}>{issue.title.slice(0,16)}{issue.title.length>16?'…':''}</span>}
      {!compact && <span style={{color:T.text2}}>{issue.title.slice(0,22)}{issue.title.length>22?'…':''}</span>}
    </div>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<CalView>('month')
  const [monthOffset, setMonthOffset] = useState(0) // 0 = April 2025
  const [weekOffset, setWeekOffset] = useState(0)   // 0 = Apr 7-13 2025

  const year = BASE_YEAR
  const month = (BASE_MONTH + monthOffset + 12) % 12
  const rows = buildMonthGrid(year, month)

  const todayDay = 15

  const weekStartDay = 7 + weekOffset * 7
  const weekDays = Array.from({length:7},(_,i) => weekStartDay + i)
  const weekLabel = `${weekDays[0]} – ${weekDays[6]} de Abril 2025`

  function issuesForDay(day: number): Issue[] {
    return ISSUES.filter(i => i.dueDateDay === day)
  }

  return (
    <div style={{ background:T.bgPage, minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'inherit' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 20px', borderBottom:`1px solid ${T.border}`, background:T.bgSurface }}>
        <span style={{ color:T.text1, fontWeight:700, fontSize:15, marginRight:6 }}>Calendário</span>
        <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:`1px solid ${T.border}` }}>
          {(['month','week'] as CalView[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'5px 14px', fontSize:12, cursor:'pointer',
              background: view===v ? T.accentDim : 'transparent',
              color: view===v ? T.accent : T.text2,
              border:'none', fontWeight: view===v ? 700 : 400,
            }}>{v==='month'?'Mês':'Semana'}</button>
          ))}
        </div>
        <button onClick={() => { setMonthOffset(0); setWeekOffset(0) }} style={{
          padding:'5px 11px', borderRadius:5, fontSize:12, cursor:'pointer',
          background:T.bgSurface2, color:T.text2, border:`1px solid ${T.border}`,
        }}>Hoje</button>
        <button onClick={() => view==='month'?setMonthOffset(o=>o-1):setWeekOffset(o=>o-1)} style={{
          width:28, height:28, borderRadius:5, cursor:'pointer',
          background:T.bgSurface2, color:T.text2, border:`1px solid ${T.border}`, fontSize:14,
        }}>‹</button>
        <span style={{ color:T.text1, fontWeight:600, fontSize:14, minWidth:180, textAlign:'center' }}>
          {view==='month' ? `${MONTHS_PT[month]} ${year}` : weekLabel}
        </span>
        <button onClick={() => view==='month'?setMonthOffset(o=>o+1):setWeekOffset(o=>o+1)} style={{
          width:28, height:28, borderRadius:5, cursor:'pointer',
          background:T.bgSurface2, color:T.text2, border:`1px solid ${T.border}`, fontSize:14,
        }}>›</button>
      </div>

      {view === 'month' ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:1 }}>
            {DOW_PT.map(d => (
              <div key={d} style={{ textAlign:'center', padding:'6px 0', fontSize:11, fontWeight:700, color:T.text3, background:T.bgSurface }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'minmax(100px,1fr)', gap:1, flex:1 }}>
            {rows.flat().map((day, idx) => {
              const isToday = day === todayDay && month === BASE_MONTH
              const dayIssues = day ? issuesForDay(day) : []
              const visible = dayIssues.slice(0,3)
              const overflow = dayIssues.length - 3
              return (
                <div key={idx} style={{
                  background: day ? T.bgSurface : `${T.bgSurface}55`,
                  border: isToday ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                  borderRadius:4, padding:'6px 6px 4px',
                  position:'relative', minHeight:100,
                  boxShadow: isToday ? `0 0 0 1px ${T.accent}` : 'none',
                }}>
                  {day && (
                    <>
                      <div style={{ fontSize:12, fontWeight: isToday ? 800 : 500, marginBottom:4 }}>
                        <span style={{
                          ...(isToday ? {
                            background:T.accent, color:'#fff',
                            borderRadius:'50%', width:20, height:20,
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            fontSize:11,
                          } : { color: T.text2 }),
                        }}>{day}</span>
                      </div>
                      {visible.map(issue => <IssueChip key={issue.key} issue={issue} compact />)}
                      {overflow > 0 && (
                        <div style={{ fontSize:10, color:T.accent, marginTop:1, cursor:'pointer' }}>+{overflow} mais</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* All-day row */}
          <div style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)', borderBottom:`1px solid ${T.border}`, background:T.bgSurface }}>
            <div style={{ padding:'6px 8px', fontSize:11, color:T.text3, borderRight:`1px solid ${T.border}` }}>All-day</div>
            {weekDays.map(day => {
              const dayIssues = issuesForDay(day)
              return (
                <div key={day} style={{ padding:'4px 4px', borderRight:`1px solid ${T.border}`, minHeight:28 }}>
                  {dayIssues.filter(i=>i.points>=5).map(issue => (
                    <div key={issue.key} style={{
                      background:T.accentDim, borderRadius:3, padding:'1px 5px',
                      fontSize:10, color:T.accent, marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>{issue.key}</div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)', borderBottom:`1px solid ${T.border}`, background:T.bgSurface }}>
            <div style={{ borderRight:`1px solid ${T.border}` }} />
            {weekDays.map((day, i) => (
              <div key={day} style={{
                textAlign:'center', padding:'7px 0', fontSize:12, fontWeight:600,
                color: day===todayDay ? T.accent : T.text2,
                borderRight:`1px solid ${T.border}`,
              }}>
                {DOW_PT[(i+1)%7]} {day > 0 && day <= 30 ? day : ''}
              </div>
            ))}
          </div>

          {/* Hour grid */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {HOURS.map(hour => (
              <div key={hour} style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)', borderBottom:`1px solid ${T.border}` }}>
                <div style={{
                  padding:'6px 8px', fontSize:10, color:T.text3, textAlign:'right',
                  borderRight:`1px solid ${T.border}`, background:T.bgSurface,
                }}>{hour}:00</div>
                {weekDays.map((day, di) => {
                  const slot = hour === 9 ? issuesForDay(day).filter(i=>i.points<5) : []
                  return (
                    <div key={di} style={{
                      height:48, borderRight:`1px solid ${T.border}`,
                      background: day===todayDay ? `${T.accent}07` : 'transparent',
                      position:'relative', padding: slot.length ? '2px 3px' : 0,
                    }}>
                      {slot.map(issue => (
                        <div key={issue.key} style={{
                          background:`${priorityColor(issue.priority)}22`,
                          borderLeft:`3px solid ${priorityColor(issue.priority)}`,
                          borderRadius:3, padding:'2px 5px',
                          fontSize:10, color:T.text1,
                          marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          position:'absolute', left:3, right:3, top:2,
                          height: `${issue.points * 10 + 20}px`, minHeight:36,
                          zIndex:1,
                        }}>
                          <div style={{fontWeight:700,color:priorityColor(issue.priority),fontSize:9}}>{issue.key}</div>
                          <div style={{fontSize:9,color:T.text2,overflow:'hidden',textOverflow:'ellipsis'}}>{issue.title.slice(0,18)}</div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
