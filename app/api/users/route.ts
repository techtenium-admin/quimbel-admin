import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/require-admin-session'

const PAGE_SIZE = 25

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const q = (searchParams.get('q') ?? '').trim()

  const where =
    q.length > 0
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { company_name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        company_name: true,
        subscription_plan: true,
        subscription_status: true,
        roles: true,
        active_role: true,
        timezone: true,
        currency: true,
        country: true,
        created_at: true,
        email_verified: true,
        stripe_connect_onboarding_complete: true,
        _count: {
          select: {
            invoices: true,
            clients: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  return NextResponse.json({
    users,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  })
}
