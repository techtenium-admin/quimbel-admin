import { NextResponse } from 'next/server'
import { db, ensureConnected } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureConnected()

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      company_name: true,
      timezone: true,
      currency: true,
      country: true,
      subscription_plan: true,
      subscription_status: true,
      roles: true,
      active_role: true,
      created_at: true,
      updated_at: true,
      email_verified: true,
      stripe_customer_id: true,
      stripe_connect_onboarding_complete: true,
      stripe_connect_account_status: true,
      _count: {
        select: {
          invoices: true,
          clients: true,
          estimates: true,
          time_entries: true,
          expenses: true,
          support_tickets: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
}
