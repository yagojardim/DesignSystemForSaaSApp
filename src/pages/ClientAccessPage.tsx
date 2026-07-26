import { useState, useEffect } from 'react'
import { T } from '../components/ds/tokens'

interface Props {
  onGoToPortal: () => void
  onBack?: () => void
}

const PROJECTS = [
  { id: 'ep01', name: 'Website Relaunch', code: 'EP-01', quarter: 'Q2 2025', status: 'Sprint 14 ativo', issues: 8, color: '#7d92ff' },
  { id: 'ep02', name: 'Infra & Eng', code: 'EP-02', quarter: 'Q2 2025', status: 'Sprint 14 ativo', issues: 5, color: '#35c9ae' },
  { id: 'ep03', name: 'Pesquisa & Conteúdo', code: 'EP-03', quarter: 'Q3 2025', status: 'Planejado', issues: 4, color: '#a78bfa' },
]

function generateHash() {
  return Math.random().toString(36).slice(2, 10)
}

export default function ClientAccessPage({ onGoToPortal }: Props) {
  const [step, setStep] = useState(1)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [permission, setPermission] = useState<'viewer' | 'admin'>('viewer')
  const [done, setDone] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (done) {
      setGeneratedUrl(`https://portal.altech.io/client/${generateHash()}`)
    }
  }, [done])

  function toggleProject(id: string) {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function handleSubmit() {
    setDone(true)
  }

  function reset() {
    setStep(1)
    setClientName('')
    setClientEmail('')
    setSelectedProjects([])
    setPermission('viewer')
    setDone(false)
    setGeneratedUrl('')
    setCopied(false)
  }

  function copyUrl() {
    navigator.clipboard.writeText(generatedUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedProjectObjs = PROJECTS.filter(p => selectedProjects.includes(p.id))
  const permissionLabel = permission === 'viewer' ? 'Visualizador' : 'Administrador'

  // --- Stepper ---
  function Stepper() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
        {[1, 2, 3].map((s, i) => {
          const isActive = step === s && !done
          const isCompleted = done || step > s
          const isPending = !isActive && !isCompleted
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: isCompleted ? T.success : isActive ? T.accent : 'transparent',
                  border: isPending ? `2px solid ${T.border}` : 'none',
                  color: isCompleted || isActive ? '#fff' : T.text3,
                  flexShrink: 0,
                }}>
                  {isCompleted ? '✓' : s}
                </div>
                <span style={{ fontSize: 11, color: isActive ? T.text1 : T.text3, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {['Dados do cliente', 'Projetos', 'Permissão'][i]}
                </span>
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1, height: 2, background: step > s || done ? T.success : T.border,
                  margin: '0 12px', marginBottom: 20,
                }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // --- Confirmation ---
  if (done) {
    return (
      <div style={{ background: T.bgPage, minHeight: '100vh', padding: '40px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Stepper />
          <div style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text1, marginBottom: 8 }}>Acesso criado com sucesso!</div>
            <div style={{ fontSize: 14, color: T.text2, marginBottom: 24 }}>
              Acesso criado para <strong style={{ color: T.text1 }}>{clientName}</strong> ({clientEmail})
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {selectedProjectObjs.map(p => (
                <span key={p.id} style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent, borderRadius: 20, padding: '3px 12px', fontSize: 13 }}>
                  {p.name}
                </span>
              ))}
            </div>
            <div style={{ marginBottom: 28 }}>
              <span style={{
                background: permission === 'viewer' ? T.bgSurface2 : T.accentDim,
                border: `1px solid ${permission === 'viewer' ? T.border2 : T.accentBorder}`,
                color: permission === 'viewer' ? T.text2 : T.accent,
                borderRadius: 20, padding: '3px 14px', fontSize: 13,
              }}>
                {permissionLabel}
              </span>
            </div>

            {/* URL section */}
            <div style={{ background: T.bgSurface2, borderLeft: `4px solid ${T.accent}`, borderRadius: 10, padding: 20, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>URL do portal do cliente</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: T.accent, userSelect: 'all', flex: 1, wordBreak: 'break-all' }}>
                  {generatedUrl}
                </span>
                <button onClick={copyUrl} style={{
                  background: copied ? T.successDim : T.accentDim,
                  border: `1px solid ${copied ? T.success : T.accentBorder}`,
                  color: copied ? T.success : T.accent,
                  borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {copied ? '✓ Copiado!' : '📋 Copiar URL'}
                </button>
              </div>
            </div>

            {/* Notice box */}
            <div style={{ background: T.warnDim, border: `1px solid ${T.warn}`, borderRadius: 10, padding: 16, marginBottom: 28, textAlign: 'left', fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
              📨 <strong style={{ color: T.warn }}>Credenciais enviadas automaticamente:</strong> login e senha temporária foram enviados para <strong style={{ color: T.text1 }}>{clientEmail}</strong>. O cliente deve alterar a senha no primeiro acesso. O e-mail é enviado pelo sistema do tenant Altech Agency.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={reset} style={{
                background: 'transparent', border: `1px solid ${T.border2}`, color: T.text2,
                borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer',
              }}>
                Criar outro acesso
              </button>
              <button onClick={onGoToPortal} style={{
                background: T.accent, border: 'none', color: '#fff',
                borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Ir ao portal do cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Step 1 ---
  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.bgSurface2, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '10px 12px', color: T.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: T.text2, marginBottom: 6, display: 'block', fontWeight: 500 }
  const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 24 }

  return (
    <div style={{ background: T.bgPage, minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Stepper />

        <div style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 36 }}>
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div style={sectionTitle}>Informações do cliente</div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Nome completo *</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>E-mail *</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                />
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginBottom: 32, lineHeight: 1.6 }}>
                Um e-mail com login e senha temporária será enviado ao cliente automaticamente pelo sistema.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  disabled={!clientName.trim() || !clientEmail.trim()}
                  onClick={() => setStep(2)}
                  style={{
                    background: (!clientName.trim() || !clientEmail.trim()) ? T.border2 : T.accent,
                    border: 'none', color: '#fff', borderRadius: 8, padding: '10px 24px',
                    fontSize: 14, fontWeight: 600, cursor: (!clientName.trim() || !clientEmail.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (!clientName.trim() || !clientEmail.trim()) ? 0.5 : 1,
                  }}>
                  Próximo →
                </button>
                <button style={{ background: 'none', border: 'none', color: T.text3, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div style={sectionTitle}>Selecione os projetos que este cliente poderá visualizar</div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent, borderRadius: 20, padding: '3px 12px', fontSize: 12 }}>
                  {selectedProjects.length} projeto(s) selecionado(s)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {PROJECTS.map(p => {
                  const selected = selectedProjects.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        background: selected ? T.accentDim : T.bgSurface2,
                        border: `1px solid ${selected ? T.accentBorder : T.border}`,
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 5, border: `2px solid ${selected ? T.accent : T.border2}`,
                        background: selected ? T.accent : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff',
                      }}>
                        {selected && '✓'}
                      </div>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
                          {p.code} · {p.quarter} · {p.status} · {p.issues} issues abertas
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ background: 'transparent', border: `1px solid ${T.border2}`, color: T.text2, borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                  ← Voltar
                </button>
                <button
                  disabled={selectedProjects.length === 0}
                  onClick={() => setStep(3)}
                  style={{
                    background: selectedProjects.length === 0 ? T.border2 : T.accent,
                    border: 'none', color: '#fff', borderRadius: 8, padding: '10px 24px',
                    fontSize: 14, fontWeight: 600, cursor: selectedProjects.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedProjects.length === 0 ? 0.5 : 1,
                  }}>
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={sectionTitle}>Nível de acesso</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {([
                  {
                    value: 'viewer' as const,
                    icon: '👁',
                    title: 'Visualizador',
                    desc: 'Pode ver o progresso dos projetos, status das issues, roadmap e relatórios. Não pode comentar ou interagir.',
                  },
                  {
                    value: 'admin' as const,
                    icon: '✏️',
                    title: 'Administrador do portal',
                    desc: 'Além de visualizar, pode deixar comentários, solicitar mudanças de prioridade e validar entregas.',
                  },
                ]).map(card => {
                  const selected = permission === card.value
                  return (
                    <div
                      key={card.value}
                      onClick={() => setPermission(card.value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px',
                        background: selected ? T.accentDim : T.bgSurface2,
                        border: `1px solid ${selected ? T.accentBorder : T.border}`,
                        borderLeft: `4px solid ${selected ? T.accent : T.text3}`,
                        borderRadius: 10, cursor: 'pointer',
                      }}>
                      <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{card.icon}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 4 }}>{card.title}</div>
                        <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{card.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 13, color: T.text3, marginRight: 8 }}>Papel atribuído:</span>
                <span style={{
                  background: permission === 'admin' ? T.accentDim : T.bgSurface2,
                  border: `1px solid ${permission === 'admin' ? T.accentBorder : T.border2}`,
                  color: permission === 'admin' ? T.accent : T.text2,
                  borderRadius: 20, padding: '3px 14px', fontSize: 13,
                }}>
                  {permissionLabel}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ background: 'transparent', border: `1px solid ${T.border2}`, color: T.text2, borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    background: T.success, border: 'none', color: '#fff',
                    borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                  Criar acesso e enviar convite
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
