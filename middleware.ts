import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getAdminJwtSecretKey } from '@/lib/admin-env'

/**
 * Single JWT verification per request.
 * - API (except /api/auth): 401 JSON — no redirect (so fetch() gets proper errors).
 * - Pages: redirect to /login when unauthenticated.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin-token')?.value
  const secret = getAdminJwtSecretKey()

  const isProtectedApi = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')

  async function verifyOrFailApi(): Promise<NextResponse | null> {
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

  if (isProtectedApi) {
    const fail = await verifyOrFailApi()
    if (fail) return fail
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (!secret) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  try {
    await jwtVerify(token, secret)
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('admin-token')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
