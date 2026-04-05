import { NextResponse } from 'next/server'
import { ADMIN_TOKEN_COOKIE } from '@/lib/admin-jwt'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_TOKEN_COOKIE)
  return res
}
