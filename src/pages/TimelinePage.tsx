import { useState, useRef, useCallback } from 'react'
import { T } from '../components/ds/tokens'
import { ISSUES, EPICS, STATUS_CFG, AV_COLOR, DEPENDENCIES, type Issue } from '../data/issues'

const DAY_PX = 28
const ROW_H = 52
const SIDEBAR_W = 160
const TOTAL_DAYS = 30
const TODAY_DAY = 15

// Sprint boundaries in April (day numbers)
const SPRINT_MARKERS = [
  { day: 1,  label: 'Sprint 13' },
  { day: 14, label: 'Sprint 14' },
  { day: 28, label: 'Sprint 15' },
]

// Week markers (approx W14=Apr1, W15=Apr7, W16=Apr14, W17=Apr21, W18=Apr28)
const WEEK_MARKERS = [
  { day: 1,  label: 'W14' },
  { day: 7,  label: 'W15' },
  { day: 14, label: 'W16' },
  { day: 21, label: 'W17' },
  { day: 28, label: 'W18' },
]

interface BarState {
  startDay: number
  endDay: number
}

function initBarStates(): Record<string, BarState> {
  const result: Record<string, BarState> = {}
  ISSUES.forEach(issue => {
    const pts = Math.max(1, issue.points)
    const endDay = Math.min(TOTAL_DAYS, Math.max(1, issue.dueDateDay))
    const startDay = Math.max(1, endDay - pts)
    result[issue.key] = { startDay, endDay }
  })
  return result
}

function issueBarColor(issue: Issue): string {
  if (issue.blocked) return T.crit
  return STATUS_CFG[issue.status].color
}

function getEpicGroups(): { epicId: string | null; label: string; color: string; issues: Issue[] }[] {
  const groups: { epicId: string | null; label: string; color: string; issues: Issue[] }[] = []

  EPICS.forEach(epic => {
    const issues = ISSUES.filter(i => i.epic === epic.id)
    groups.push({ epicId: epic.id, label: epic.label, color: epic.color, issues })
  })

  const noEpic = ISSUES.filter(i => !i.epic)
  if (noEpic.length > 0) {
    groups.push({ epicId: null, label: 'Sem épico', color: T.text3, issues: noEpic })
  }

  return groups
}

export default function TimelinePage() {
  const [bars, setBars] = useState<Record<string, BarState>>(initBarStates)
  const [dragging, setDragging] = useState<{ key: string; startX: number; origStart: number; origEnd: number } | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const groups = getEpicGroups()
  // Compute bar pixel positions
  function barLeft(startDay: number) { return (startDay - 1) * DAY_PX }
  function barWidth(startDay: number, endDay: number) { return Math.max(DAY_PX, (endDay - startDay) * DAY_PX) }

  const onMouseDown = useCallback((e: React.MouseEvent, issueKey: string) => {
    e.preventDefault()
    const bar = bars[issueKey]
    if (!bar) return
    setDragging({ key: issueKey, startX: e.clientX, origStart: bar.startDay, origEnd: bar.endDay })
  }, [bars])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragging.startX
    const dayDelta = Math.round(dx / DAY_PX)
    if (dayDelta === 0) return
    const duration = dragging.origEnd - dragging.origStart
    let newStart = dragging.origStart + dayDelta
    let newEnd = dragging.origEnd + dayDelta
    newStart = Math.max(1, Math.min(TOTAL_DAYS - duration, newStart))
    newEnd = newStart + duration
    setBars(prev => ({ ...prev, [dragging.key]: { startDay: newStart, endDay: newEnd } }))
  }, [dragging])

  const onMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  // Compute SVG dependency curves
  // Build absolute row map (group header rows + issue rows)
  function buildRowMap(): Record<string, number> {
    const map: Record<string, number> = {}
    let absoluteRow = 0
    groups.forEach(group => {
      absoluteRow++ // group header
      group.issues.forEach(issue => {
        map[issue.key] = absoluteRow
        absoluteRow++
      })
    })
    return map
  }

  const rowMap = buildRowMap()
  const totalAbsRows = groups.reduce((s, g) => s + g.issues.length + 1, 0)

  function getDependencyCurves() {
    return DEPENDENCIES.map(dep => {
      const fromBar = bars[dep.from]
      const toBar = bars[dep.to]
      const fromAbsRow = rowMap[dep.from]
      const toAbsRow = rowMap[dep.to]
      if (!fromBar || !toBar || fromAbsRow == null || toAbsRow == null) return null

      const x1 = barLeft(fromBar.endDay) + barWidth(fromBar.startDay, fromBar.endDay)
      const x2 = barLeft(toBar.startDay)
      const y1 = fromAbsRow * ROW_H + ROW_H / 2
      const y2 = toAbsRow * ROW_H + ROW_H / 2
      const cx = (x1 + x2) / 2

      return { key: `${dep.from}-${dep.to}`, x1, y1, x2, y2, cx }
    }).filter(Boolean)
  }
  const svgH = totalAbsRows * ROW_H

  const curves = getDependencyCurves()

  return (
    <div style={{ background:T.bgPage, minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'inherit' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 20px', borderBottom:`1px solid ${T.border}`, background:T.bgSurface }}>
        <span style={{ color:T.text1, fontWeight:700, fontSize:15 }}>Roadmap — Abril 2025</span>
        <span style={{ color:T.text3, fontSize:12, marginLeft:8 }}>Arraste as barras para reposicionar</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ width:10, height:10, borderRadius:2, background:T.accent, display:'inline-block' }} />
          <span style={{ color:T.text3, fontSize:11 }}>Em andamento</span>
          <span style={{ width:10, height:10, borderRadius:2, background:T.success, display:'inline-block', marginLeft:6 }} />
          <span style={{ color:T.text3, fontSize:11 }}>Concluído</span>
          <span style={{ width:10, height:10, borderRadius:2, background:T.crit, display:'inline-block', marginLeft:6 }} />
          <span style={{ color:T.text3, fontSize:11 }}>Bloqueado</span>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <div style={{ width:SIDEBAR_W, flexShrink:0, borderRight:`1px solid ${T.border}`, background:T.bgSurface, overflowY:'auto' }}>
          {/* Sidebar header */}
          <div style={{ height:48, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', padding:'0 12px' }}>
            <span style={{ color:T.text3, fontSize:11, fontWeight:700 }}>ÉPICO / ISSUE</span>
          </div>
          {groups.map(group => (
            <div key={group.epicId ?? 'none'}>
              {/* Group header */}
              <div style={{
                height:ROW_H, display:'flex', alignItems:'center', padding:'0 12px',
                borderBottom:`1px solid ${T.border}`, background:T.bgSurface2,
              }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:group.color, flexShrink:0, marginRight:7 }} />
                <span style={{ color:group.color, fontWeight:700, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{group.label}</span>
              </div>
              {/* Issue rows */}
              {group.issues.map(issue => (
                <div key={issue.key} style={{
                  height:ROW_H, display:'flex', alignItems:'center', padding:'0 12px',
                  borderBottom:`1px solid ${T.border}`,
                  background: hovered === issue.key ? T.bgSurface2 : T.bgSurface,
                }} onMouseEnter={() => setHovered(issue.key)} onMouseLeave={() => setHovered(null)}>
                  <span style={{ color:T.accent, fontSize:10, fontWeight:700, marginRight:5, flexShrink:0 }}>{issue.key}</span>
                  <span style={{ color:T.text2, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={issue.title}>{issue.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <div style={{ flex:1, overflowX:'auto', overflowY:'auto', position:'relative' }}>
          <div
            ref={gridRef}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ width: TOTAL_DAYS * DAY_PX, minWidth: TOTAL_DAYS * DAY_PX, position:'relative', userSelect:'none' }}
          >
            {/* Time axis header */}
            <div style={{ height:48, borderBottom:`1px solid ${T.border}`, position:'relative', background:T.bgSurface }}>
              {/* Day numbers */}
              {Array.from({length:TOTAL_DAYS},(_,i)=>i+1).map(day => (
                <div key={day} style={{
                  position:'absolute', left:(day-1)*DAY_PX, top:0, width:DAY_PX, height:48,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end',
                  paddingBottom:4,
                }}>
                  <span style={{ fontSize:9, color: day===TODAY_DAY ? T.accent : T.text3, fontWeight: day===TODAY_DAY?700:400 }}>{day}</span>
                </div>
              ))}
              {/* Week markers */}
              {WEEK_MARKERS.map(w => (
                <div key={w.label} style={{
                  position:'absolute', left:(w.day-1)*DAY_PX, top:4,
                  fontSize:10, color:T.text2, fontWeight:700, paddingLeft:3,
                }}>{w.label}</div>
              ))}
            </div>

            {/* Grid + bars */}
            <div style={{ position:'relative', height: svgH }}>
              {/* Vertical grid lines */}
              {Array.from({length:TOTAL_DAYS},(_,i)=>i+1).map(day => (
                <div key={day} style={{
                  position:'absolute', left:(day-1)*DAY_PX, top:0, bottom:0, width:1,
                  background: day===TODAY_DAY ? T.accent : T.border,
                  opacity: day===TODAY_DAY ? 0.8 : 0.4,
                  zIndex: day===TODAY_DAY ? 3 : 1,
                }} />
              ))}

              {/* Sprint markers */}
              {SPRINT_MARKERS.map(sm => (
                <div key={sm.label} style={{ position:'absolute', left:(sm.day-1)*DAY_PX, top:0, bottom:0, width:1, zIndex:2 }}>
                  <div style={{
                    position:'absolute', top:0, left:0, bottom:0,
                    borderLeft:`1.5px dashed ${T.accent}`,
                    opacity:0.4,
                  }} />
                  <div style={{
                    position:'absolute', top:4, left:3, fontSize:9, color:T.accent,
                    background:T.bgPage, padding:'0 3px', borderRadius:2, fontWeight:700,
                    opacity:0.8, whiteSpace:'nowrap',
                  }}>{sm.label}</div>
                </div>
              ))}

              {/* Today marker */}
              <div style={{
                position:'absolute', left:(TODAY_DAY-1)*DAY_PX, top:0, bottom:0, width:2,
                background:T.accent, opacity:0.7, zIndex:4,
              }} />

              {/* Horizontal row lines */}
              {Array.from({length:totalAbsRows},(_,i)=>i).map(row => (
                <div key={row} style={{
                  position:'absolute', left:0, right:0,
                  top: row * ROW_H, height:ROW_H,
                  borderBottom:`1px solid ${T.border}`,
                  background: row % 2 === 0 ? 'transparent' : `${T.bgSurface}44`,
                }} />
              ))}

              {/* Issue bars */}
              {groups.map((group, gi) => {
                let groupHeaderRow = 0
                for (let i = 0; i < gi; i++) groupHeaderRow += groups[i].issues.length + 1

                return (
                  <div key={group.epicId ?? 'none'}>
                    {/* Group header row (no bar) */}
                    <div style={{
                      position:'absolute', top: groupHeaderRow * ROW_H, left:0, right:0, height:ROW_H,
                      background:T.bgSurface2, borderBottom:`1px solid ${T.border}`,
                    }} />

                    {group.issues.map((issue, ii) => {
                      const rowAbs = groupHeaderRow + 1 + ii
                      const bar = bars[issue.key]
                      if (!bar) return null
                      const color = issueBarColor(issue)
                      const left = barLeft(bar.startDay)
                      const width = barWidth(bar.startDay, bar.endDay)
                      const isDragging = dragging?.key === issue.key
                      const isHovered = hovered === issue.key

                      return (
                        <div
                          key={issue.key}
                          onMouseDown={e => onMouseDown(e, issue.key)}
                          onMouseEnter={() => setHovered(issue.key)}
                          onMouseLeave={() => setHovered(null)}
                          style={{
                            position:'absolute',
                            top: rowAbs * ROW_H + 10,
                            left,
                            width,
                            height: ROW_H - 20,
                            background:`${color}28`,
                            border:`1.5px solid ${color}`,
                            borderRadius:5,
                            cursor:'grab',
                            display:'flex', alignItems:'center',
                            padding:'0 6px', gap:4, overflow:'hidden',
                            zIndex: isDragging ? 10 : 2,
                            boxShadow: isDragging ? T.shadowModal : isHovered ? `0 4px 18px rgba(0,0,0,0.4)` : 'none',
                            transform: isDragging ? 'scale(1.02)' : 'none',
                            transition: isDragging ? 'none' : 'box-shadow 0.15s, transform 0.15s',
                          }}
                        >
                          <span style={{ fontSize:9, fontWeight:700, color, flexShrink:0 }}>{issue.key}</span>
                          {width > 60 && (
                            <span style={{ fontSize:9, color:T.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                              {issue.title.slice(0,18)}{issue.title.length>18?'…':''}
                            </span>
                          )}
                          {width > 90 && (
                            <span style={{
                              fontSize:8, fontWeight:700, background: AV_COLOR[issue.assignee]??T.text3,
                              color:'#fff', borderRadius:'50%', width:14, height:14,
                              display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                            }}>{issue.assignee[0]}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* SVG dependency overlay */}
              <svg
                style={{ position:'absolute', top:0, left:0, width:TOTAL_DAYS*DAY_PX, height:svgH, pointerEvents:'none', zIndex:5 }}
                width={TOTAL_DAYS*DAY_PX}
                height={svgH}
              >
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={T.accent} opacity={0.5} />
                  </marker>
                </defs>
                {curves.map(c => {
                  if (!c) return null
                  const { key, x1, y1, x2, y2, cx } = c as { key:string; x1:number; y1:number; x2:number; y2:number; cx:number }
                  return (
                    <path
                      key={key}
                      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                      stroke={T.accent}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      fill="none"
                      opacity={0.45}
                      markerEnd="url(#arrow)"
                    />
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
