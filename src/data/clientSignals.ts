/**
 * Altech — Shared client signals store (Inspection Mode / mocked).
 * Holds client comments and approvals. Tenant-scoped. Never cross-tenant.
 * PO responsible_po field ensures routing is always to the correct Product Owner.
 */
import { MOCK_TENANT } from './session'

export type SignalType = 'approval' | 'comment'

export interface ClientSignal {
  id:             string
  type:           SignalType
  item_id:        string       // id of the portal item (validation, delivery, etc.)
  item_title:     string
  project:        string
  tenant_id:      string
  responsible_po: string       // user_id of the PO who owns this item
  body?:          string       // present for type='comment'
  author:         string       // client display name (no internal user)
  author_initials: string
  created_at:     string       // ISO 8601
  read_by_po:     boolean
  po_reply?:      string       // public reply from PO, visible to client
}

export interface AuditEntry {
  id:         string
  action:     string
  item_title: string
  by:         string
  when:       string
  tenant_id:  string
}

// ─── Mutable in-memory store ─────────────────────────────────────────────────
let CLIENT_SIGNALS: ClientSignal[] = [
  {
    id:             'cs_001',
    type:           'comment',
    item_id:        'v1',
    item_title:     'Identidade visual — aprovação do guia de marca',
    project:        'Website Relaunch',
    tenant_id:      MOCK_TENANT.tenant_id,
    responsible_po: 'u_po',
    body:           'As cores estão ótimas, mas gostaria de revisar a tipografia do cabeçalho antes de aprovar.',
    author:         'João Silva',
    author_initials: 'JS',
    created_at:     '2025-07-23T10:30:00Z',
    read_by_po:     true,
    po_reply:       'Anotado! Vou preparar duas opções de tipografia para revisão amanhã.',
  },
  {
    id:             'cs_002',
    type:           'comment',
    item_id:        'd3',
    item_title:     'Painel de importação de dados legados',
    project:        'ERP Integration v2',
    tenant_id:      MOCK_TENANT.tenant_id,
    responsible_po: 'u_po',
    body:           'Precisamos que a importação suporte também o formato XLS além de CSV. É um requisito da equipe de operações.',
    author:         'Maria Fernanda',
    author_initials: 'MF',
    created_at:     '2025-07-24T14:15:00Z',
    read_by_po:     false,
  },
  {
    id:             'cs_003',
    type:           'approval',
    item_id:        're1',
    item_title:     'Novo portal de autenticação',
    project:        'Website Relaunch',
    tenant_id:      MOCK_TENANT.tenant_id,
    responsible_po: 'u_po',
    author:         'João Silva',
    author_initials: 'JS',
    created_at:     '2025-07-22T16:00:00Z',
    read_by_po:     true,
  },
]

let AUDIT_LOG: AuditEntry[] = [
  { id: 'al_001', action: 'Comentário do cliente registrado',     item_title: 'Identidade visual — aprovação do guia de marca', by: 'Sistema',       when: '23 jul · 10:30', tenant_id: MOCK_TENANT.tenant_id },
  { id: 'al_002', action: 'Resposta pública do P.O publicada',   item_title: 'Identidade visual — aprovação do guia de marca', by: 'Beatriz Alves', when: '23 jul · 11:00', tenant_id: MOCK_TENANT.tenant_id },
  { id: 'al_003', action: 'Comentário do cliente registrado',     item_title: 'Painel de importação de dados legados',          by: 'Sistema',       when: '24 jul · 14:15', tenant_id: MOCK_TENANT.tenant_id },
  { id: 'al_004', action: 'Aprovação do cliente registrada',      item_title: 'Novo portal de autenticação',                    by: 'Sistema',       when: '22 jul · 16:00', tenant_id: MOCK_TENANT.tenant_id },
]

let _sigCounter = 5
let _logCounter = 5

// ─── Write ────────────────────────────────────────────────────────────────────
export function addClientSignal(sig: Omit<ClientSignal, 'id'>): ClientSignal {
  const newSig: ClientSignal = { ...sig, id: `cs_${String(_sigCounter++).padStart(3, '0')}` }
  CLIENT_SIGNALS = [...CLIENT_SIGNALS, newSig]
  _addAuditEntry({
    action:     sig.type === 'comment' ? 'Comentário do cliente registrado' : 'Aprovação do cliente registrada',
    item_title: sig.item_title,
    by:         'Sistema',
    tenant_id:  sig.tenant_id,
  })
  return newSig
}

export function markReadByPo(id: string): void {
  CLIENT_SIGNALS = CLIENT_SIGNALS.map(s => s.id === id ? { ...s, read_by_po: true } : s)
}

export function markAllReadByPo(po_id: string, tenant_id: string): void {
  CLIENT_SIGNALS = CLIENT_SIGNALS.map(s =>
    s.responsible_po === po_id && s.tenant_id === tenant_id ? { ...s, read_by_po: true } : s
  )
}

export function addPoReply(signal_id: string, reply: string, po_name: string): void {
  CLIENT_SIGNALS = CLIENT_SIGNALS.map(s =>
    s.id === signal_id ? { ...s, po_reply: reply, read_by_po: true } : s
  )
  const sig = CLIENT_SIGNALS.find(s => s.id === signal_id)
  if (sig) {
    _addAuditEntry({
      action:     'Resposta pública do P.O publicada',
      item_title: sig.item_title,
      by:         po_name,
      tenant_id:  sig.tenant_id,
    })
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export function getAllSignals(): ClientSignal[] {
  return CLIENT_SIGNALS
}

export function getUnreadForPo(po_id: string, tenant_id: string): ClientSignal[] {
  return CLIENT_SIGNALS.filter(s =>
    s.responsible_po === po_id &&
    s.tenant_id === tenant_id &&
    !s.read_by_po
  )
}

export function getAllForPo(po_id: string, tenant_id: string): ClientSignal[] {
  return [...CLIENT_SIGNALS]
    .filter(s => s.responsible_po === po_id && s.tenant_id === tenant_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function getSignalsForItem(item_id: string, tenant_id: string): ClientSignal[] {
  return CLIENT_SIGNALS.filter(s => s.item_id === item_id && s.tenant_id === tenant_id)
}

export function getCommentsForProject(project: string, tenant_id: string): ClientSignal[] {
  return [...CLIENT_SIGNALS]
    .filter(s => s.type === 'comment' && s.project === project && s.tenant_id === tenant_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function getAuditLog(tenant_id: string): AuditEntry[] {
  return [...AUDIT_LOG]
    .filter(e => e.tenant_id === tenant_id)
    .reverse()
    .slice(0, 20)
}

// ─── Internal ─────────────────────────────────────────────────────────────────
function _addAuditEntry(entry: Omit<AuditEntry, 'id' | 'when'>): void {
  const now = new Date()
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const when = `${now.getDate()} ${months[now.getMonth()]} · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  AUDIT_LOG = [...AUDIT_LOG, { ...entry, id: `al_${String(_logCounter++).padStart(3,'0')}`, when }]
}
