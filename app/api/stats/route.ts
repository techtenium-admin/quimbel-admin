import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/require-admin-session'

export async function GET() {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    usersLast7d,
    usersLast30d,
    totalInvoices,
    invoicesLast30d,
    invoiceByStatus,
    totalEstimates,
    totalTimeEntries,
    totalClients,
    totalExpenses,
    openTickets,
    paidTotals,
    invoicesThisMonth,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { created_at: { gte: d7 } } }),
    db.user.count({ where: { created_at: { gte: d30 } } }),
    db.invoice.count(),
    db.invoice.count({ where: { created_at: { gte: d30 } } }),
    db.invoice.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    db.estimate.count(),
    db.timeEntry.count(),
    db.client.count(),
    db.expense.count(),
    db.supportTicket.count({
      where: { status: { in: ['open', 'in_progress'] } },
    }),
    db.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { total_amount: true },
    }),
    db.invoice.count({
      where: {
        created_at: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    }),
  ])

  const statusCounts: Record<string, number> = {}
  for (const row of invoiceByStatus) {
    statusCounts[row.status] = row._count._all
  }

  return NextResponse.json({
    users: {
      total: totalUsers,
      newLast7Days: usersLast7d,
      newLast30Days: usersLast30d,
    },
    invoices: {
      total: totalInvoices,
      createdLast30Days: invoicesLast30d,
      createdThisCalendarMonth: invoicesThisMonth,
      byStatus: statusCounts,
    },
    estimates: { total: totalEstimates },
    timeEntries: { total: totalTimeEntries },
    clients: { total: totalClients },
    expenses: { total: totalExpenses },
    support: { openTickets },
    revenue: {
      paidInvoicesTotal: paidTotals._sum.total_amount?.toString() ?? '0',
    },
    generatedAt: now.toISOString(),
  })
}
