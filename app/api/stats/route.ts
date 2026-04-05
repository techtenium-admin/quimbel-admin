import { NextResponse } from 'next/server'
import { db, ensureConnected } from '@/lib/db'
import { fetchDashboardStats } from '@/lib/dashboard-stats'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureConnected()
  const now = new Date()
  const body = await fetchDashboardStats(db, now)
  return NextResponse.json(body)
}
