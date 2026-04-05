import { describe, it, expect, vi } from 'vitest'
import { fetchDashboardStats } from './dashboard-stats'
import type { PrismaClient } from '@prisma/client'

describe('fetchDashboardStats', () => {
  it('maps aggregate query and invoice status breakdown', async () => {
    const paidDecimal = { toString: () => '123.45' }
    const $queryRaw = vi
      .fn()
      .mockResolvedValueOnce([
        {
          total_users: 10n,
          users_7d: 2n,
          users_30d: 5n,
          total_invoices: 3n,
          invoices_30d: 1n,
          invoices_month: 1n,
          total_estimates: 0n,
          total_time_entries: 7n,
          total_clients: 4n,
          total_expenses: 2n,
          open_tickets: 1n,
          paid_total: paidDecimal,
        },
      ])
      .mockResolvedValueOnce([
        { status: 'paid', count: 2n },
        { status: 'draft', count: 1n },
      ])

    const db = { $queryRaw } as unknown as PrismaClient

    const out = await fetchDashboardStats(db, new Date('2026-01-15T12:00:00Z'))

    expect(out.users.total).toBe(10)
    expect(out.users.newLast7Days).toBe(2)
    expect(out.invoices.total).toBe(3)
    expect(out.invoices.byStatus.paid).toBe(2)
    expect(out.invoices.byStatus.draft).toBe(1)
    expect(out.timeEntries.total).toBe(7)
    expect(out.revenue.paidInvoicesTotal).toBe('123.45')
    expect(out.generatedAt).toBe('2026-01-15T12:00:00.000Z')
    expect($queryRaw).toHaveBeenCalledTimes(2)
  })
})
