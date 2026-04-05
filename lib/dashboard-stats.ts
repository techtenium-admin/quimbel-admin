import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

function num(v: bigint | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'bigint' ? Number(v) : v
}

/**
 * Two DB round-trips instead of 13 parallel queries — important on high-latency pools (e.g. Supabase).
 */
export async function fetchDashboardStats(db: PrismaClient, now: Date) {
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [agg] = await db.$queryRaw<
    Array<{
      total_users: bigint
      users_7d: bigint
      users_30d: bigint
      total_invoices: bigint
      invoices_30d: bigint
      invoices_month: bigint
      total_estimates: bigint
      total_time_entries: bigint
      total_clients: bigint
      total_expenses: bigint
      open_tickets: bigint
      paid_total: Prisma.Decimal | null
    }>
  >(
    Prisma.sql`
    SELECT
      (SELECT COUNT(*)::bigint FROM users) AS total_users,
      (SELECT COUNT(*)::bigint FROM users WHERE created_at >= ${d7}) AS users_7d,
      (SELECT COUNT(*)::bigint FROM users WHERE created_at >= ${d30}) AS users_30d,
      (SELECT COUNT(*)::bigint FROM invoices) AS total_invoices,
      (SELECT COUNT(*)::bigint FROM invoices WHERE created_at >= ${d30}) AS invoices_30d,
      (SELECT COUNT(*)::bigint FROM invoices WHERE created_at >= ${monthStart}) AS invoices_month,
      (SELECT COUNT(*)::bigint FROM estimates) AS total_estimates,
      (SELECT COUNT(*)::bigint FROM time_entries) AS total_time_entries,
      (SELECT COUNT(*)::bigint FROM clients) AS total_clients,
      (SELECT COUNT(*)::bigint FROM expenses) AS total_expenses,
      (SELECT COUNT(*)::bigint FROM support_tickets WHERE status IN ('open', 'in_progress')) AS open_tickets,
      (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') AS paid_total
    `
  )

  const byStatusRows = await db.$queryRaw<Array<{ status: string; count: bigint }>>(
    Prisma.sql`
    SELECT status, COUNT(*)::bigint AS count
    FROM invoices
    GROUP BY status
    `
  )

  if (agg == null) {
    throw new Error('Dashboard stats aggregate returned no row')
  }
  const row = agg
  const statusCounts: Record<string, number> = {}
  for (const r of byStatusRows) {
    statusCounts[r.status] = num(r.count)
  }

  const paidStr =
    row.paid_total == null
      ? '0'
      : typeof row.paid_total === 'object' && 'toString' in row.paid_total
        ? row.paid_total.toString()
        : String(row.paid_total)

  return {
    users: {
      total: num(row.total_users),
      newLast7Days: num(row.users_7d),
      newLast30Days: num(row.users_30d),
    },
    invoices: {
      total: num(row.total_invoices),
      createdLast30Days: num(row.invoices_30d),
      createdThisCalendarMonth: num(row.invoices_month),
      byStatus: statusCounts,
    },
    estimates: { total: num(row.total_estimates) },
    timeEntries: { total: num(row.total_time_entries) },
    clients: { total: num(row.total_clients) },
    expenses: { total: num(row.total_expenses) },
    support: { openTickets: num(row.open_tickets) },
    revenue: { paidInvoicesTotal: paidStr },
    generatedAt: now.toISOString(),
  }
}
