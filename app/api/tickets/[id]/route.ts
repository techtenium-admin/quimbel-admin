import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/require-admin-session'

const ALLOWED_STATUS = ['open', 'in_progress', 'resolved', 'closed'] as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const { id } = await params

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      messages: {
        orderBy: { created_at: 'asc' },
      },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ticket })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json()
  const status = body?.status as string | undefined

  if (!status || !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const ticket = await db.supportTicket.findUnique({ where: { id } })
  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.supportTicket.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ ticket: updated })
}
