import { useState } from 'react'

// ─── Data matching screenshot e20974e4 ──────────────────────────────────────
// Months: JAN(0) FEV(1) MAR(2) ABR(3) MAI(4) JUN(5) JUL(6) AGO(7) SET(8)
// Each month = 60px wide. Total = 9 months = 540px.
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET']
const MONTH_W = 60 // px per month
const TODAY_MONTH = 5.5 // mid-June

interface GRow {
  id: string
  name: string
  isProject?: boolean
  color: string
  start: number   // month index (0 = Jan)
  end: number     // month index end (exclusive)
  pct?: number
  parent?: string
}

const rows: GRow[] = [
  // ── Construção do Galpão Industrial ────────────────────────────────────────
  { id: 'galpao', name: 'Construção do Galpão Industrial', isProject: true, color: '#4d82ff', start: 0, end: 4.5, pct: 9 },
  { id: 'g1', parent: 'galpao', name: 'Fundação e Estrutura',    color: '#4d82ff', start: 0,   end: 3 },
  { id: 'g2', parent: 'galpao', name: 'Instalações Elétricas',   color: '#5a8eff', start: 0.1, end: 3.2 },
  { id: 'g3', parent: 'galpao', name: 'Cobertura e Vedação',     color: '#4d82ff', start: 3.8, end: 5.2 },
  { id: 'g4', parent: 'galpao', name: 'Instalações Hidráulicas', color: '#6a9eff', start: 4,   end: 6 },
  { id: 'g5', parent: 'galpao', name: 'Acabamentos e Entrega',   color: '#324060', start: 5.5, end: 8 },
  // ── Sistema ERP Corporativo ────────────────────────────────────────────────
  { id: 'erp', name: 'Sistema ERP Corporativo', isProject: true, color: '#7C3AED', start: 1, end: 6.5, pct: 48 },
  { id: 'e1', parent: 'erp', name: 'Levantamento de Requisitos', color: '#06C18A', start: 1, end: 3 },
  { id: 'e2', parent: 'erp', name: 'Desenvolvimento do Sistema', color: '#4d82ff', start: 2.5, end: 7 },
  { id: 'e3', parent: 'erp', name: 'Testes e Homologação',       color: '#324060', start: 5.5, end: 9 },
  // ── Reforma da Sede Corporativa ────────────────────────────────────────────
  { id: 'reforma', name: 'Reforma da Sede Corporativa', isProject: true, color: '#06C18A', start: 5, end: 8.5, pct: 5 },
  { id: 'r1', parent: 'reforma', name: 'Projeto Arquitetônico',    color: '#06C18A', start: 5, end: 8 },
  { id: 'r2', parent: 'reforma', name: 'Obras Civis',              color: '#324060', start: 7, end: 9 },
  { id: 'r3', parent: 'reforma', name: 'Mobiliário e Acabamentos', color: '#2a3550', start: 8, end: 9 },
]

function GanttBar({ row }: { row: GRow }) {
  const left = row.start * MONTH_W
  const width = Math.max((row.end - row.start) * MONTH_W, 4)

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 rounded flex items-center px-2 overflow-hidden"
      style={{
        left,
        width,
        height: row.isProject ? 24 : 16,
        background: row.color,
        opacity: row.color === '#324060' || row.color === '#2a3550' ? 0.6 : 1,
      }}
    >
      {row.pct !== undefined && width > 50 && (
        <span className="text-[10px] font-semibold text-white truncate">{row.pct}%</span>
      )}
    </div>
  )
}

export default function GanttPage() {
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())

  function toggleProject(id: string) {
    setCollapsedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visibleRows = rows.filter(r => !r.parent || !collapsedProjects.has(r.parent))
  const totalW = MONTHS.length * MONTH_W

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#080f1c' }}>
      {/* Sub-header */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #162032' }}
      >
        <div className="flex items-center gap-4">
          {[
            { color: '#4d82ff', label: 'Galpão Industrial' },
            { color: '#7C3AED', label: 'ERP Corporativo' },
            { color: '#06C18A', label: 'Reforma da Sede' },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#546278' }}>
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
              {p.label}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#546278' }}>
          <span className="w-3 h-0 border-t border-dashed border-[#F0455A] inline-block opacity-70" style={{ display: 'inline-block', width: 20 }} />
          Hoje (Jun 2025)
        </div>
      </div>

      {/* Scrollable gantt body */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: 200 + totalW }}>
          {/* Month headers */}
          <div className="flex sticky top-0 z-10" style={{ background: '#0a1525', borderBottom: '1px solid #162032' }}>
            {/* Task label column header */}
            <div
              className="flex-shrink-0 flex items-center px-4 py-2.5"
              style={{ width: 200, borderRight: '1px solid #162032' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#3a4d65' }}>
                Tarefa / Projeto
              </span>
            </div>
            {/* Month columns */}
            <div className="flex relative" style={{ width: totalW }}>
              {MONTHS.map((m, i) => (
                <div
                  key={m}
                  className="flex-shrink-0 text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    width: MONTH_W,
                    color: i === 5 ? '#4d82ff' : '#3a4d65',
                    borderRight: '1px solid #162032',
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {visibleRows.map((row, i) => {
            const isProj = row.isProject
            const isCollapsed = isProj && collapsedProjects.has(row.id)

            return (
              <div
                key={row.id}
                className="flex items-center transition-colors"
                style={{
                  height: isProj ? 40 : 32,
                  borderBottom: '1px solid #0d1a2d',
                  background: isProj
                    ? i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'
                    : 'transparent',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)' }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = isProj
                    ? (i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent')
                    : 'transparent'
                }}
              >
                {/* Label */}
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-4"
                  style={{ width: 200, borderRight: '1px solid #162032', height: '100%' }}
                >
                  {isProj ? (
                    <>
                      <button
                        onClick={() => toggleProject(row.id)}
                        className="w-4 h-4 flex items-center justify-center flex-shrink-0 transition-transform"
                        style={{ color: '#3a4d65', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M2 1.5L5.5 4L2 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: row.color }} />
                      <span className="text-xs font-semibold truncate" style={{ color: '#c8d4e8' }}>{row.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex-shrink-0" style={{ width: 16 }} />
                      <span className="w-1 h-1 rounded-full flex-shrink-0 ml-2" style={{ background: row.color, opacity: 0.6 }} />
                      <span className="text-xs truncate ml-1" style={{ color: '#546278' }}>{row.name}</span>
                    </>
                  )}
                </div>

                {/* Bar area */}
                <div className="relative flex-1" style={{ height: '100%', width: totalW }}>
                  {/* Column grid */}
                  {MONTHS.map((_, mi) => (
                    <div
                      key={mi}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: mi * MONTH_W,
                        width: MONTH_W,
                        borderRight: '1px solid #0d1a2d',
                        background: mi === 5 ? 'rgba(77,130,255,0.03)' : 'transparent',
                      }}
                    />
                  ))}
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 z-10"
                    style={{
                      left: TODAY_MONTH * MONTH_W,
                      width: 1,
                      background: '#F0455A',
                      opacity: 0.8,
                    }}
                  />
                  {/* Bar */}
                  <GanttBar row={row} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
