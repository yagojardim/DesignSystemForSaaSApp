import React, { useState } from 'react'
import { T } from '../components/ds/tokens'

// ── helpers ──────────────────────────────────────────────────────────────────
const px = (n: number) => `${n}px`

// ── types ─────────────────────────────────────────────────────────────────────
type Sprint = 's13' | 's14' | 's15'

const SPRINT_LABELS: Record<Sprint, string> = {
  s13: 'S13 – Concluído',
  s14: 'S14 – Ativo',
  s15: 'S15 – Planejado',
}

const REPORT_NAMES = [
  'Burndown Chart',
  'Velocity Chart',
  'CFD / Cumulative Flow',
  'Bugs por Severidade',
  'Criados vs Resolvidos',
  'Workload por Pessoa',
  'Aging de Issues',
  'Lead Time & Cycle Time',
  'Saúde do Projeto',
  'Epic / Release Burndown',
]

// ── sub-components ────────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  span2 = false,
  children,
}: {
  title: string
  subtitle: string
  span2?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        gridColumn: span2 ? 'span 2' : 'span 1',
        background: T.bgSurface,
        border: `1px solid ${T.border}`,
        borderRadius: px(12),
        padding: px(20),
        display: 'flex',
        flexDirection: 'column',
        gap: px(12),
      }}
    >
      <div>
        <div style={{ color: T.text1, fontWeight: 600, fontSize: px(14) }}>{title}</div>
        <div style={{ color: T.text3, fontSize: px(12), marginTop: px(2) }}>{subtitle}</div>
      </div>
      {children}
    </div>
  )
}

// Card 1 — Burndown
function BurndownChart() {
  const W = 520; const H = 180
  const PAD = { top: 12, right: 16, bottom: 30, left: 36 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const days = 14; const maxPts = 40
  const actual = [38, 35, 35, 31, 31, 28, 24, 24, 20, 20, 16, 12, 8, 4]
  const toX = (d: number) => PAD.left + (d / (days - 1)) * cw
  const toY = (p: number) => PAD.top + ch - (p / maxPts) * ch

  const idealPath = `M ${toX(0)} ${toY(38)} L ${toX(13)} ${toY(0)}`

  const pts = actual.map((p, i) => [toX(i), toY(p)] as [number, number])
  let stepPath = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    stepPath += ` H ${pts[i][0]} V ${pts[i][1]}`
  }
  const areaPath = stepPath + ` H ${pts[pts.length - 1][0]} V ${toY(0)} H ${toX(0)} Z`

  const ticks = [0, 10, 20, 30, 40]
  const dayTicks = [1, 3, 5, 7, 9, 11, 13]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* grid */}
      {ticks.map(t => (
        <line key={t} x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)}
          stroke={T.border} strokeWidth={0.5} />
      ))}
      {/* Y labels */}
      {ticks.map(t => (
        <text key={t} x={PAD.left - 6} y={toY(t) + 4} textAnchor="end"
          fontSize={9} fill={T.text3}>{t}</text>
      ))}
      {/* X labels */}
      {dayTicks.map(d => (
        <text key={d} x={toX(d)} y={H - PAD.bottom + 14} textAnchor="middle"
          fontSize={9} fill={T.text3}>D{d + 1}</text>
      ))}
      {/* area fill */}
      <path d={areaPath} fill={T.accentDim} />
      {/* ideal */}
      <path d={idealPath} stroke={T.accent} strokeWidth={1.5} strokeDasharray="5,3" fill="none" />
      {/* actual */}
      <path d={stepPath} stroke={T.text1} strokeWidth={2} fill="none" />
      {/* scope creep dot */}
      <circle cx={toX(5)} cy={toY(28)} r={5} fill={T.warn} />
      <text x={toX(5) + 8} y={toY(28) + 4} fontSize={9} fill={T.warn}>Escopo +3pts</text>
      {/* legend */}
      <g transform={`translate(${W - PAD.right - 130}, ${PAD.top})`}>
        <line x1={0} y1={5} x2={18} y2={5} stroke={T.accent} strokeWidth={1.5} strokeDasharray="5,3" />
        <text x={22} y={9} fontSize={9} fill={T.text2}>Ideal</text>
        <line x1={0} y1={18} x2={18} y2={18} stroke={T.text1} strokeWidth={2} />
        <text x={22} y={22} fontSize={9} fill={T.text2}>Realizado</text>
      </g>
    </svg>
  )
}

// Card 2 — Velocity
function VelocityChart() {
  const W = 200; const H = 140
  const PAD = { top: 12, right: 8, bottom: 28, left: 28 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const sprints = ['S8', 'S9', 'S10', 'S11', 'S12', 'S13']
  const vals = [18, 22, 19, 25, 21, 22]
  const avg = 21
  const maxV = 30
  const bw = (cw / sprints.length) * 0.6
  const toY = (v: number) => PAD.top + ch - (v / maxV) * ch
  const toX = (i: number) => PAD.left + (i / sprints.length) * cw + (cw / sprints.length) * 0.2

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* avg line */}
      <line x1={PAD.left} y1={toY(avg)} x2={W - PAD.right} y2={toY(avg)}
        stroke={T.text3} strokeWidth={1} strokeDasharray="4,3" />
      <text x={W - PAD.right + 2} y={toY(avg) + 4} fontSize={8} fill={T.text3}>avg</text>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={toX(i)} y={toY(v)} width={bw} height={ch - (toY(v) - PAD.top)}
            rx={2} fill={i === vals.length - 1 ? '#b3beff' : T.accent} />
          <text x={toX(i) + bw / 2} y={toY(v) - 3} textAnchor="middle" fontSize={8} fill={T.text2}>{v}</text>
          <text x={toX(i) + bw / 2} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={8} fill={T.text3}>{sprints[i]}</text>
        </g>
      ))}
      {[0, 10, 20, 30].map(t => (
        <text key={t} x={PAD.left - 4} y={toY(t) + 3} textAnchor="end" fontSize={8} fill={T.text3}>{t}</text>
      ))}
    </svg>
  )
}

// Card 3 — CFD
function CFDChart() {
  const W = 520; const H = 160
  const PAD = { top: 12, right: 16, bottom: 28, left: 36 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const days = 14
  // 5 layers stacked: backlog/todo/in-progress/review/done
  const layers = [
    { label: 'Backlog',     color: T.text3,    data: [20,19,18,17,16,15,14,13,12,11,10,9,8,7] },
    { label: 'To Do',       color: T.text2,    data: [5, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1] },
    { label: 'In Progress', color: T.accent,   data: [3, 4, 4, 4, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2] },
    { label: 'Review',      color: T.warn,     data: [1, 1, 2, 2, 2, 3, 3, 3, 2, 2, 2, 1, 1, 1] },
    { label: 'Done',        color: T.success,  data: [0, 1, 1, 2, 3, 3, 5, 7, 9,11,13,15,18,20] },
  ]
  const maxY = 30
  const toX = (d: number) => PAD.left + (d / (days - 1)) * cw
  const toY = (v: number) => PAD.top + ch - (v / maxY) * ch

  // compute stacked
  const stacked = layers.map((_, li) => {
    return Array.from({ length: days }, (_, d) => {
      let sum = 0
      for (let l = 0; l <= li; l++) sum += layers[l].data[d]
      return sum
    })
  })

  const areaPath = (top: number[], bottom: number[]) => {
    const fwd = top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`)
    const bwd = bottom.slice().reverse().map((v, i) => `L ${toX(days - 1 - i)} ${toY(v)}`)
    return [...fwd, ...bwd, 'Z'].join(' ')
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {stacked.map((top, li) => {
        const bottom = li === 0 ? Array(days).fill(0) : stacked[li - 1]
        return (
          <path key={li} d={areaPath(top, bottom)}
            fill={layers[li].color} opacity={0.35} />
        )
      })}
      {stacked.map((top, li) => {
        const line = top.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')
        return <path key={li} d={line} stroke={layers[li].color} strokeWidth={1.2} fill="none" />
      })}
      {/* X labels */}
      {[1, 4, 7, 10, 13].map(d => (
        <text key={d} x={toX(d)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill={T.text3}>D{d + 1}</text>
      ))}
      {/* Y labels */}
      {[0, 10, 20, 30].map(t => (
        <text key={t} x={PAD.left - 4} y={toY(t) + 4} textAnchor="end" fontSize={9} fill={T.text3}>{t}</text>
      ))}
      {/* legend */}
      <g transform={`translate(${PAD.left}, ${PAD.top - 2})`}>
        {layers.map((l, i) => (
          <g key={i} transform={`translate(${i * 88}, 0)`}>
            <rect x={0} y={-7} width={10} height={8} fill={l.color} opacity={0.6} rx={1} />
            <text x={13} y={0} fontSize={8} fill={T.text2}>{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// Card 4 — Bugs Donut
function BugsDonut() {
  const cx = 70; const cy = 70; const R = 50; const r = 28
  const segs = [
    { label: 'Critical', color: T.crit,   val: 2 },
    { label: 'High',     color: T.warn,   val: 3 },
    { label: 'Medium',   color: T.accent, val: 2 },
    { label: 'Low',      color: T.text3,  val: 1 },
  ]
  const total = segs.reduce((s, x) => s + x.val, 0)
  let angle = -Math.PI / 2
  const arcs = segs.map(seg => {
    const sweep = (seg.val / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(angle)
    const y1 = cy + R * Math.sin(angle)
    const x2 = cx + R * Math.cos(angle + sweep)
    const y2 = cy + R * Math.sin(angle + sweep)
    const x3 = cx + r * Math.cos(angle + sweep)
    const y3 = cy + r * Math.sin(angle + sweep)
    const x4 = cx + r * Math.cos(angle)
    const y4 = cy + r * Math.sin(angle)
    const large = sweep > Math.PI ? 1 : 0
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`
    angle += sweep
    return { ...seg, d }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: px(16) }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={T.text1}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill={T.text3}>bugs</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: px(6) }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
            <span style={{ color: T.text2, fontSize: px(12) }}>{s.label}</span>
            <span style={{ color: T.text1, fontSize: px(12), fontWeight: 600, marginLeft: 'auto' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Card 5 — Criados vs Resolvidos
function CreatedVsResolved() {
  const W = 520; const H = 150
  const PAD = { top: 20, right: 16, bottom: 28, left: 28 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const weeks = 8
  const created = [3, 5, 4, 6, 5, 7, 4, 3]
  const resolved = [2, 3, 5, 4, 6, 5, 6, 5]
  const maxV = 8
  const toX = (i: number) => PAD.left + (i / (weeks - 1)) * cw
  const toY = (v: number) => PAD.top + ch - (v / maxV) * ch

  const linePath = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')
  const areaPath = (data: number[], _color: string) => {
    const base = PAD.top + ch
    return linePath(data) + ` L ${toX(weeks - 1)} ${base} L ${toX(0)} ${base} Z`
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* grid */}
      {[0, 2, 4, 6, 8].map(t => (
        <line key={t} x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)}
          stroke={T.border} strokeWidth={0.5} />
      ))}
      <path d={areaPath(created, T.warn)} fill={T.warn} opacity={0.15} />
      <path d={areaPath(resolved, T.success)} fill={T.success} opacity={0.15} />
      <path d={linePath(created)} stroke={T.warn} strokeWidth={2} fill="none" />
      <path d={linePath(resolved)} stroke={T.success} strokeWidth={2} fill="none" />
      {created.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={T.warn} />)}
      {resolved.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={T.success} />)}
      {/* X labels */}
      {Array.from({ length: weeks }, (_, i) => (
        <text key={i} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill={T.text3}>W{i + 1}</text>
      ))}
      {/* legend */}
      <g transform={`translate(${PAD.left}, ${PAD.top - 10})`}>
        <line x1={0} y1={0} x2={14} y2={0} stroke={T.warn} strokeWidth={2} />
        <text x={18} y={4} fontSize={9} fill={T.text2}>Criados</text>
        <line x1={70} y1={0} x2={84} y2={0} stroke={T.success} strokeWidth={2} />
        <text x={88} y={4} fontSize={9} fill={T.text2}>Resolvidos</text>
      </g>
    </svg>
  )
}

// Card 6 — Workload
function WorkloadChart() {
  const people = [
    { name: 'AL', pts: 14 },
    { name: 'NM', pts: 10 },
    { name: 'JN', pts: 8 },
    { name: 'CS', pts: 12 },
    { name: 'RM', pts: 6 },
    { name: 'LF', pts: 9 },
  ]
  const maxPts = 16
  const color = (pts: number) => pts < 10 ? T.success : pts <= 14 ? T.warn : T.crit

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: px(8) }}>
      {people.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
          <div style={{ width: px(24), color: T.text2, fontSize: px(12), fontWeight: 600 }}>{p.name}</div>
          <div style={{ flex: 1, background: T.bgSurface2, borderRadius: px(4), height: px(14), overflow: 'hidden' }}>
            <div style={{
              width: `${(p.pts / maxPts) * 100}%`,
              height: '100%',
              background: color(p.pts),
              borderRadius: px(4),
              opacity: 0.8,
            }} />
          </div>
          <div style={{ width: px(36), color: color(p.pts), fontSize: px(12), fontWeight: 600 }}>{p.pts}pt</div>
        </div>
      ))}
    </div>
  )
}

// Card 7 — Aging
function AgingChart() {
  const issues = [
    { id: 'PM-101', days: 9,  tag: null,        color: T.accent },
    { id: 'PM-102', days: 12, tag: 'Blocked',   color: T.crit },
    { id: 'PM-103', days: 7,  tag: null,        color: T.accent },
    { id: 'PM-104', days: 15, tag: 'Delayed',   color: T.warn },
    { id: 'PM-105', days: 3,  tag: null,        color: T.success },
  ]
  const maxDays = 16

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: px(8) }}>
      {issues.map((iss, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
          <div style={{ width: px(54), color: T.text2, fontSize: px(11), fontFamily: 'monospace' }}>{iss.id}</div>
          <div style={{ flex: 1, background: T.bgSurface2, borderRadius: px(4), height: px(14), overflow: 'hidden' }}>
            <div style={{
              width: `${(iss.days / maxDays) * 100}%`,
              height: '100%',
              background: iss.color,
              borderRadius: px(4),
              opacity: 0.7,
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: px(4), minWidth: px(72) }}>
            <span style={{ color: T.text1, fontSize: px(11), fontWeight: 600 }}>{iss.days}d</span>
            {iss.tag && (
              <span style={{
                fontSize: px(9), fontWeight: 700, padding: '2px 5px',
                borderRadius: px(4), background: iss.color === T.crit ? T.critDim : T.warnDim,
                color: iss.color,
              }}>{iss.tag}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Card 8 — Lead Time & Cycle Time
function LeadCycleChart() {
  const W = 200; const H = 80
  const PAD = { top: 8, right: 8, bottom: 20, left: 28 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const buckets = ['1-3d', '4-6d', '7-9d', '10-14d', '15+d']
  const vals = [1, 3, 5, 4, 2]
  const maxV = 6
  const bw = (cw / buckets.length) * 0.65
  const toX = (i: number) => PAD.left + (i / buckets.length) * cw + (cw / buckets.length) * 0.175
  const toY = (v: number) => PAD.top + ch - (v / maxV) * ch

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: px(12) }}>
      {[
        { label: 'Lead Time médio', value: '8.4 dias', color: T.accent },
        { label: 'Cycle Time médio', value: '4.2 dias', color: T.success },
      ].map((s, i) => (
        <div key={i} style={{
          background: T.bgSurface2, borderRadius: px(8), padding: `${px(10)} ${px(14)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: T.text2, fontSize: px(12) }}>{s.label}</span>
          <span style={{ color: s.color, fontSize: px(18), fontWeight: 700 }}>{s.value}</span>
        </div>
      ))}
      <div style={{ color: T.text3, fontSize: px(11), marginTop: px(4) }}>Distribuição Lead Time</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {vals.map((v, i) => (
          <g key={i}>
            <rect x={toX(i)} y={toY(v)} width={bw} height={ch - (toY(v) - PAD.top)}
              rx={2} fill={T.accent} opacity={0.7} />
            <text x={toX(i) + bw / 2} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={7} fill={T.text3}>{buckets[i]}</text>
          </g>
        ))}
        {[0, 2, 4, 6].map(t => (
          <text key={t} x={PAD.left - 3} y={toY(t) + 3} textAnchor="end" fontSize={7} fill={T.text3}>{t}</text>
        ))}
      </svg>
    </div>
  )
}

// Card 9 — Radar / Project Health
function ProjectHealth() {
  const axes = [
    { label: 'Velocity',        val: 85 },
    { label: 'Quality',         val: 60 },
    { label: 'Predictability',  val: 72 },
    { label: 'Team Morale',     val: 90 },
    { label: 'Risk',            val: 45 },
  ]
  const n = axes.length
  const cx = 85; const cy = 75; const R = 55
  const score = Math.round(axes.reduce((s, a) => s + a.val, 0) / n)

  const angleOf = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2
  const point = (i: number, frac: number) => {
    const a = angleOf(i)
    return [cx + R * frac * Math.cos(a), cy + R * frac * Math.sin(a)] as [number, number]
  }
  const pentagon = (frac: number) =>
    Array.from({ length: n }, (_, i) => point(i, frac)).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z'
  const dataPath = axes.map((a, i) => point(i, a.val / 100))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z'

  const dotColor = (v: number) => v >= 80 ? T.success : v >= 60 ? T.warn : T.crit

  return (
    <div style={{ display: 'flex', gap: px(16), alignItems: 'flex-start' }}>
      <svg width={170} height={150} viewBox="0 0 170 150">
        {[0.25, 0.5, 0.75, 1].map(f => (
          <path key={f} d={pentagon(f)} stroke={T.border2} strokeWidth={0.8} fill="none" />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = point(i, 1)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={T.border2} strokeWidth={0.8} />
        })}
        <path d={dataPath} fill={T.accentDim} stroke={T.accent} strokeWidth={1.5} />
        {axes.map((a, i) => {
          const [x, y] = point(i, 1.22)
          return <text key={i} x={x} y={y} textAnchor="middle" fontSize={8} fill={T.text2}>{a.label}</text>
        })}
        <circle cx={cx} cy={cy} r={20} fill={T.bgSurface2} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={14} fontWeight={700} fill={T.text1}>{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={7} fill={T.text3}>/100</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: px(6), paddingTop: px(12) }}>
        {axes.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: px(6) }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(a.val), flexShrink: 0 }} />
            <span style={{ color: T.text2, fontSize: px(11) }}>{a.label}</span>
            <span style={{ color: T.text1, fontSize: px(11), fontWeight: 600, marginLeft: 'auto' }}>{a.val}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Card 10 — Epic Burndown
function EpicBurndown() {
  const W = 520; const H = 160
  const PAD = { top: 24, right: 16, bottom: 28, left: 36 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom
  const weeks = 6
  const epics = [
    { label: 'EP-01', color: T.accent,  data: [20, 18, 15, 12, 8, 4] },
    { label: 'EP-02', color: T.warn,    data: [15, 14, 13, 10, 7, 3] },
    { label: 'EP-03', color: T.purple,  data: [10, 10, 9,  8,  8, 7] },
  ]
  const maxV = 22
  const toX = (i: number) => PAD.left + (i / (weeks - 1)) * cw
  const toY = (v: number) => PAD.top + ch - (v / maxV) * ch
  const linePath = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {[0, 5, 10, 15, 20].map(t => (
        <line key={t} x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)}
          stroke={T.border} strokeWidth={0.5} />
      ))}
      {epics.map((e, i) => (
        <path key={i} d={linePath(e.data)} stroke={e.color} strokeWidth={2} fill="none" />
      ))}
      {epics.map((e, i) =>
        e.data.map((v, j) => <circle key={`${i}-${j}`} cx={toX(j)} cy={toY(v)} r={3} fill={e.color} />)
      )}
      {Array.from({ length: weeks }, (_, i) => (
        <text key={i} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill={T.text3}>W{i + 1}</text>
      ))}
      {[0, 5, 10, 15, 20].map(t => (
        <text key={t} x={PAD.left - 4} y={toY(t) + 4} textAnchor="end" fontSize={9} fill={T.text3}>{t}</text>
      ))}
      {/* legend top-right */}
      <g transform={`translate(${W - PAD.right - 150}, ${PAD.top - 16})`}>
        {epics.map((e, i) => (
          <g key={i} transform={`translate(${i * 56}, 0)`}>
            <line x1={0} y1={4} x2={12} y2={4} stroke={e.color} strokeWidth={2} />
            <text x={15} y={8} fontSize={9} fill={T.text2}>{e.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function DashboardModal({
  selected,
  onToggle,
  onClose,
  onSave,
}: {
  selected: boolean[]
  onToggle: (i: number) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bgSurface, border: `1px solid ${T.border2}`,
          borderRadius: px(16), padding: px(28), width: px(380),
          boxShadow: T.shadow2,
        }}
      >
        <div style={{ color: T.text1, fontWeight: 700, fontSize: px(16), marginBottom: px(4) }}>
          Atribuir ao Dashboard
        </div>
        <div style={{ color: T.text3, fontSize: px(13), marginBottom: px(20) }}>
          Selecione os relatórios para exibir no painel principal.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: px(10), marginBottom: px(24) }}>
          {REPORT_NAMES.map((name, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: px(10), cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected[i]}
                onChange={() => onToggle(i)}
                style={{ accentColor: T.accent, width: 15, height: 15 }}
              />
              <span style={{ color: T.text2, fontSize: px(13) }}>{name}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: px(10), justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: `${px(8)} ${px(18)}`, borderRadius: px(8),
              border: `1px solid ${T.border2}`, background: 'transparent',
              color: T.text2, fontSize: px(13), cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            style={{
              padding: `${px(8)} ${px(20)}`, borderRadius: px(8),
              border: 'none', background: T.accent,
              color: '#fff', fontSize: px(13), fontWeight: 600, cursor: 'pointer',
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [sprint, setSprint] = useState<Sprint>('s14')
  const [modalOpen, setModalOpen] = useState(false)
  const [dashSelected, setDashSelected] = useState<boolean[]>(REPORT_NAMES.map(() => true))

  const toggleDash = (i: number) => {
    setDashSelected(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  const kpis = [
    { label: 'Total Issues',   value: '42',    color: T.text1 },
    { label: 'Velocity atual', value: '22 pts', color: T.accent },
    { label: 'Avg Lead Time',  value: '8.4 d', color: T.warn },
    { label: 'Bug rate',       value: '19%',   color: T.crit },
  ]

  return (
    <div style={{ background: T.bgPage, minHeight: '100vh', color: T.text1, fontFamily: 'Inter, sans-serif' }}>
      {/* top bar */}
      <div style={{
        padding: `${px(28)} ${px(32)} ${px(0)}`,
        borderBottom: `1px solid ${T.border}`,
        background: T.bgSurface,
      }}>
        {/* title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: px(16) }}>
          <div>
            <h1 style={{ margin: 0, fontSize: px(22), fontWeight: 700, color: T.text1 }}>Relatórios & Insights</h1>
            <p style={{ margin: `${px(4)} 0 0`, fontSize: px(13), color: T.text3 }}>
              Métricas de desempenho da equipe e saúde do projeto.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: `${px(9)} ${px(18)}`, borderRadius: px(8),
              border: 'none', background: T.accent, color: '#fff',
              fontSize: px(13), fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Atribuir ao Dashboard
          </button>
        </div>

        {/* filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: px(10), flexWrap: 'wrap', marginBottom: px(16) }}>
          <select
            value={sprint}
            onChange={e => setSprint(e.target.value as Sprint)}
            style={{
              background: T.bgSurface2, border: `1px solid ${T.border2}`,
              color: T.text1, fontSize: px(13), padding: `${px(6)} ${px(12)}`,
              borderRadius: px(8), cursor: 'pointer',
            }}
          >
            {(Object.keys(SPRINT_LABELS) as Sprint[]).map(k => (
              <option key={k} value={k}>{SPRINT_LABELS[k]}</option>
            ))}
          </select>
          <div style={{
            padding: `${px(6)} ${px(14)}`, borderRadius: px(20),
            border: `1px solid ${T.accentBorder}`, background: T.accentDim,
            color: T.accent, fontSize: px(12), fontWeight: 500,
          }}>
            Jul 1 – Jul 14, 2026
          </div>
          {/* KPI pills */}
          {kpis.map((k, i) => (
            <div key={i} style={{
              padding: `${px(6)} ${px(14)}`, borderRadius: px(20),
              background: T.bgSurface2, border: `1px solid ${T.border}`,
              fontSize: px(12), color: T.text2, display: 'flex', alignItems: 'center', gap: px(6),
            }}>
              <span>{k.label}:</span>
              <span style={{ fontWeight: 700, color: k.color }}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* report grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: px(16),
        padding: px(24),
      }}>
        <Card title="Burndown Chart" subtitle="Sprint S14 · Story points restantes vs. ideal" span2>
          <BurndownChart />
        </Card>

        <Card title="Velocity Chart" subtitle="Story points entregues por sprint">
          <VelocityChart />
        </Card>

        <Card title="CFD / Cumulative Flow" subtitle="Distribuição de itens por status ao longo do tempo" span2>
          <CFDChart />
        </Card>

        <Card title="Bugs por Severidade" subtitle="Issues de tipo Bug abertas no sprint">
          <BugsDonut />
        </Card>

        <Card title="Criados vs Resolvidos" subtitle="Issues criadas e resolvidas por semana (8 semanas)" span2>
          <CreatedVsResolved />
        </Card>

        <Card title="Workload por Pessoa" subtitle="Story points atribuídos por membro da equipe">
          <WorkloadChart />
        </Card>

        <Card title="Aging de Issues" subtitle="Dias em aberto por issue em progresso">
          <AgingChart />
        </Card>

        <Card title="Lead Time & Cycle Time" subtitle="Tempo médio de entrega e execução">
          <LeadCycleChart />
        </Card>

        <Card title="Saúde do Projeto" subtitle="Score geral baseado em 5 dimensões">
          <ProjectHealth />
        </Card>

        <Card title="Epic / Release Burndown" subtitle="Story points restantes por épico ao longo de 6 semanas" span2>
          <EpicBurndown />
        </Card>
      </div>

      {/* modal */}
      {modalOpen && (
        <DashboardModal
          selected={dashSelected}
          onToggle={toggleDash}
          onClose={() => setModalOpen(false)}
          onSave={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
