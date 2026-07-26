import { useState } from 'react'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { T } from '../components/ds/tokens'
import {
  ISSUES, EPICS, STATUS_CFG, TYPE_ICON, AV_COLOR,
  type IssueStatus,
} from '../data/issues'

const PRESET_COLORS = [T.accent, T.warn, T.purple, T.success, T.crit]

const STATUSES: IssueStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done']

function DonutRing({ pct, size = 48, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border2} strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={T.text1}
        style={{ fontSize: 11, fontWeight: 700 }}>
        {pct}%
      </text>
    </svg>
  )
}

function Avatar({ initials, size = 26 }: { initials: string; size?: number }) {
  const bg = AV_COLOR[initials] ?? T.text3
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  )
}

export default function EpicsPage() {
  const [epicCreate, setEpicCreate] = useState(false)
  const [epicColors, setEpicColors] = useState<Record<string, string>>(
    () => Object.fromEntries(EPICS.map(e => [e.id, e.color]))
  )
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [pickerOpen, setPickerOpen] = useState<string | null>(null)

  return (
    <>
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: T.text1 }}>Épicos</span>
        <span style={{ fontSize: 13, color: T.text3, background: T.neutralDim, borderRadius: 20, padding: '2px 10px' }}>
          {EPICS.length} épicos
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {EPICS.map(epic => {
          const color = epicColors[epic.id] ?? epic.color
          const epicIssues = ISSUES.filter(i => i.epic === epic.id)
          const done = epicIssues.filter(i => i.status === 'done').length
          const total = epicIssues.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          const points = epicIssues.reduce((s, i) => s + i.points, 0)
          const assignees = [...new Set(epicIssues.map(i => i.assignee))]
          const isExpanded = expanded[epic.id]

          const statusCounts = Object.fromEntries(
            STATUSES.map(s => [s, epicIssues.filter(i => i.status === s).length])
          )

          return (
            <div key={epic.id} style={{
              background: T.bgSurface, border: `1px solid ${T.border}`,
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              display: 'flex',
            }}>
              {/* Left color bar */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setPickerOpen(pickerOpen === epic.id ? null : epic.id)}
                  style={{
                    width: 6, height: '100%', minHeight: 180, background: color,
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  title="Alterar cor"
                />
                {pickerOpen === epic.id && (
                  <div style={{
                    position: 'absolute', top: 8, left: 14, zIndex: 100,
                    background: T.bgSurface2, border: `1px solid ${T.border2}`,
                    borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
                    boxShadow: T.shadowModal,
                  }}>
                    {PRESET_COLORS.map(c => (
                      <div key={c} onClick={(e) => {
                        e.stopPropagation()
                        setEpicColors(prev => ({ ...prev, [epic.id]: c }))
                        setPickerOpen(null)
                      }} style={{
                        width: 20, height: 20, borderRadius: '50%', background: c,
                        cursor: 'pointer', border: c === color ? `2px solid ${T.text1}` : '2px solid transparent',
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: '20px 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: 1 }}>
                    {epic.key}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>{epic.label}</span>
                  <span style={{
                    fontSize: 11, color: T.text3, background: T.neutralDim,
                    borderRadius: 20, padding: '2px 10px', border: `1px solid ${T.border}`,
                  }}>{epic.quarter}</span>
                  <div style={{ marginLeft: 'auto' }}>
                    <Avatar initials={epic.owner} size={28} />
                  </div>
                </div>

                <p style={{ fontSize: 13, color: T.text2, margin: '0 0 16px', lineHeight: 1.5 }}>{epic.desc}</p>

                {/* Progress + stats row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
                  {/* Donut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <DonutRing pct={pct} color={color} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{done}/{total} issues</div>
                      <div style={{ fontSize: 11, color: T.text3 }}>concluídas</div>
                    </div>
                  </div>

                  {/* Status dots */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {STATUSES.map(s => {
                      const cnt = statusCounts[s] ?? 0
                      const cfg = STATUS_CFG[s]
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: cnt > 0 ? T.text2 : T.text3 }}>{cnt}</span>
                          <span style={{ fontSize: 11, color: T.text3 }}>{cfg.label}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Points */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: T.text3 }}>Story points:</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color, background: `${color}18`,
                      borderRadius: 6, padding: '2px 8px',
                    }}>{points}</span>
                  </div>
                </div>

                {/* Assignees */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  {assignees.slice(0, 6).map(a => <Avatar key={a} initials={a} size={24} />)}
                  {assignees.length > 6 && (
                    <span style={{ fontSize: 11, color: T.text3, marginLeft: 4 }}>+{assignees.length - 6}</span>
                  )}
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [epic.id]: !prev[epic.id] }))}
                  style={{
                    fontSize: 12, color: color, background: `${color}18`,
                    border: `1px solid ${color}40`, borderRadius: 6, padding: '5px 14px',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {isExpanded ? '▲ Ocultar issues' : `▼ Ver issues (${total})`}
                </button>

                {/* Expanded issue list */}
                {isExpanded && (
                  <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                    {epicIssues.length === 0 ? (
                      <p style={{ fontSize: 13, color: T.text3 }}>Nenhuma issue neste épico.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {epicIssues.map(issue => {
                          const ti = TYPE_ICON[issue.type]
                          const sc = STATUS_CFG[issue.status]
                          return (
                            <div key={issue.key} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', background: T.bgSurface2, borderRadius: 8,
                              border: `1px solid ${T.border}`,
                            }}>
                              <span style={{ color: ti.color, fontSize: 14, flexShrink: 0 }}>{ti.icon}</span>
                              <span style={{ fontSize: 11, color: T.text3, fontFamily: 'monospace', width: 62, flexShrink: 0 }}>{issue.key}</span>
                              <span style={{ fontSize: 13, color: T.text1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {issue.title}
                              </span>
                              <span style={{
                                fontSize: 11, color: sc.color, background: sc.bg,
                                borderRadius: 20, padding: '2px 8px', flexShrink: 0,
                              }}>{sc.label}</span>
                              <Avatar initials={issue.assignee} size={22} />
                              <span style={{
                                fontSize: 11, color: T.text3, background: T.neutralDim,
                                borderRadius: 4, padding: '1px 6px', flexShrink: 0,
                              }}>{issue.points}pt</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {/* Add issue CTA */}
                    <button style={{
                      marginTop: 12, fontSize: 12, color: T.text3,
                      background: 'transparent', border: `1px dashed ${T.border2}`,
                      borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                      width: '100%', textAlign: 'left',
                    }}>
                      + Criar issue neste épico
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    {epicCreate && <CreateIssueModal onClose={()=>setEpicCreate(false)} onCreate={()=>setEpicCreate(false)} />}
    </>
  )
}
