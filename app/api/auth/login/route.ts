import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminToken, ADMIN_TOKEN_COOKIE } from '@/lib/admin-jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const password = (body?.password as string | undefined) ?? ''

    const hash = process.env.ADMIN_PASSWORD_HASH
    const plain = process.env.ADMIN_PASSWORD

    let ok = false
    if (hash?.trim()) {
      ok = await bcrypt.compare(password, hash)
    } else if (plain !== undefined && process.env.NODE_ENV === 'development') {
      ok = password === plain
    }

    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createAdminToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
