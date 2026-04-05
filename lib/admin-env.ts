/**
 * Env for quimbel-admin (standalone: DB + Resend + session).
 * Session signing: ADMIN_JWT_SECRET or JWT_SECRET (≥32 chars).
 */

export function getAppUrlForLinks(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) {
    throw new Error('Set NEXT_PUBLIC_APP_URL (Quimbel app URL for email links)')
  }
  return raw.replace(/\/$/, '')
}

export function getAdminJwtSecretKey(): Uint8Array | null {
  const s = process.env.ADMIN_JWT_SECRET?.trim() || process.env.JWT_SECRET?.trim()
  if (!s || s.length < 32) {
    return null
  }
  return new TextEncoder().encode(s)
}
