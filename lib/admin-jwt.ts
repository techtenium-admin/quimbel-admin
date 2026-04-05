import { SignJWT, jwtVerify } from 'jose'
import { getAdminJwtSecretKey } from './admin-env'

const COOKIE = 'admin-token'

export function getJwtSecretKey(): Uint8Array {
  const k = getAdminJwtSecretKey()
  if (!k) {
    throw new Error('Set ADMIN_JWT_SECRET or JWT_SECRET (min 32 characters)')
  }
  return k
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecretKey())
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecretKey())
    return true
  } catch {
    return false
  }
}

export { COOKIE as ADMIN_TOKEN_COOKIE }
