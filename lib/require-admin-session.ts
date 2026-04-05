import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { ADMIN_TOKEN_COOKIE } from '@/lib/admin-jwt'
import { getAdminJwtSecretKey } from '@/lib/admin-env'

/** Returns null if OK, or a 401 Response. */
export async function requireAdminSession(): Promise<Response | null> {
  const jar = await cookies()
  const token = jar.get(ADMIN_TOKEN_COOKIE)?.value
  const secret = getAdminJwtSecretKey()
  if (!token || !secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await jwtVerify(token, secret)
    return null
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
