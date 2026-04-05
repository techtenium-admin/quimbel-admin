import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/require-admin-session'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')?.trim()

  const where =
    status && status !== 'all'
      ? { status }
      : {}

  const tickets = await db.supportTicket.findMany({
    where,
    orderBy: { updated_at: 'desc' },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })

  return NextResponse.json({ tickets })
}
