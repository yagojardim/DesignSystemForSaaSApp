/**
 * Altech — Dashboard Card Assignments store (Inspection Mode).
 * Tracks which report cards are assigned to which dashboards, per tenant.
 * Mutated in-place (module-level state, session-persistent).
 */
import { MOCK_TENANT } from './session'
import type { DashboardType } from './session'

export type AssignmentTarget = 'executivo' | 'dashview' | DashboardType

export interface DashboardAssignment {
  id:          string
  card_id:     string
  card_title:  string
  targets:     AssignmentTarget[]
  assigned_by: string
  tenant_id:   string
  updated_at:  string
}

// ─── Target catalog (used for the picker UI) ─────────────────────────────────
export interface TargetDef {
  id:    AssignmentTarget
  label: string
  icon:  string
  group: 'Executivos' | 'Por perfil'
}

export const ASSIGNMENT_TARGETS: TargetDef[] = [
  { id: 'executivo',       label: 'Dashboard Executivo',  icon: '📊', group: 'Executivos' },
  { id: 'dashview',        label: 'Dashview',             icon: '🔭', group: 'Executivos' },
  { id: 'admin',           label: 'Admin',                icon: '🛡️', group: 'Por perfil' },
  { id: 'pmo',             label: 'PMO',                  icon: '🗂️', group: 'Por perfil' },
  { id: 'project-manager', label: 'Project Manager',      icon: '📋', group: 'Por perfil' },
  { id: 'product-manager', label: 'Product Manager',      icon: '🎯', group: 'Por perfil' },
  { id: 'product-owner',   label: 'Product Owner',        icon: '📝', group: 'Por perfil' },
  { id: 'scrum-master',    label: 'Scrum Master',         icon: '🔄', group: 'Por perfil' },
  { id: 'tech-lead',       label: 'Tech Lead',            icon: '⚙️', group: 'Por perfil' },
  { id: 'dev',             label: 'Dev',                  icon: '💻', group: 'Por perfil' },
  { id: 'ux',              label: 'UX / UI',              icon: '🎨', group: 'Por perfil' },
  { id: 'qa',              label: 'QA',                   icon: '🧪', group: 'Por perfil' },
]

// ─── Store ────────────────────────────────────────────────────────────────────
let _assignments: DashboardAssignment[] = [
  // Pre-seed: Burndown on Executivo + scrum-master
  {
    id: 'da_001', card_id: 'burndown', card_title: 'Burndown Chart',
    targets: ['executivo', 'scrum-master'],
    assigned_by: 'u_admin', tenant_id: MOCK_TENANT.tenant_id,
    updated_at: new Date().toISOString(),
  },
  // Velocity on pmo + project-manager
  {
    id: 'da_002', card_id: 'velocity', card_title: 'Velocity Chart',
    targets: ['pmo', 'project-manager'],
    assigned_by: 'u_admin', tenant_id: MOCK_TENANT.tenant_id,
    updated_at: new Date().toISOString(),
  },
]

let _nextId = 10

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export function getAssignment(tenant_id: string, card_id: string): DashboardAssignment | undefined {
  return _assignments.find(a => a.tenant_id === tenant_id && a.card_id === card_id)
}

export function getAllAssignments(tenant_id: string): DashboardAssignment[] {
  return _assignments.filter(a => a.tenant_id === tenant_id)
}

export function getAssignedCards(tenant_id: string, target: AssignmentTarget): DashboardAssignment[] {
  return _assignments.filter(a => a.tenant_id === tenant_id && a.targets.includes(target))
}

export function upsertAssignment(
  tenant_id: string,
  card_id: string,
  card_title: string,
  targets: AssignmentTarget[],
  assigned_by: string,
): DashboardAssignment {
  const existing = _assignments.find(a => a.tenant_id === tenant_id && a.card_id === card_id)
  const updated_at = new Date().toISOString()
  if (existing) {
    existing.targets    = targets
    existing.updated_at = updated_at
    existing.assigned_by = assigned_by
    return existing
  }
  const newA: DashboardAssignment = {
    id: `da_${String(++_nextId).padStart(3, '0')}`,
    card_id, card_title, targets,
    assigned_by, tenant_id, updated_at,
  }
  _assignments = [..._assignments, newA]
  return newA
}

export function removeAssignment(tenant_id: string, card_id: string): void {
  _assignments = _assignments.filter(a => !(a.tenant_id === tenant_id && a.card_id === card_id))
}
