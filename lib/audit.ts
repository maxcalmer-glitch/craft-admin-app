import { getDb } from './supabase'

export async function logAuditAction(username: string, action: string, details: string, targetId?: string) {
  try {
    const db = getDb()
    await db.from('admin_audit_log').insert({
      admin_username: username,
      action,
      details,
      target_id: targetId || null,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    console.error('Audit log error:', e)
  }
}
