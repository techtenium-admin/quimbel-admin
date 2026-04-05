import { NextRequest, NextResponse } from 'next/server'
import { db, ensureConnected } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await ensureConnected()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')?.trim()

  const where =
    status && status !== 'all'
      ? { status }
      : {}

  const tickets = await db.supportTicket.findMany({
    where,
    orderBy: { updated_at: 'desc' },
    take: 150,
    select: {
      id: true,
      subject: true,
      category: true,
      status: true,
      priority: true,
      created_at: true,
      updated_at: true,
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
        select: {
          body: true,
          created_at: true,
        },
      },
    },
  })

  return NextResponse.json({ tickets })
}
