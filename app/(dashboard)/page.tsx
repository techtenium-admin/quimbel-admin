'use client'

import { useEffect, useState } from 'react'

type Stats = {
  users: { total: number; newLast7Days: number; newLast30Days: number }
  invoices: {
    total: number
    createdLast30Days: number
    createdThisCalendarMonth: number
    byStatus: Record<string, number>
  }
  estimates: { total: number }
  timeEntries: { total: number }
  clients: { total: number }
  expenses: { total: number }
  support: { openTickets: number }
  revenue: { paidInvoicesTotal: string }
  generatedAt: string
}

function Card({
  title,
  value,
  hint,
}: {
  title: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </div>
  )
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/stats')
        if (!res.ok) {
          setError('Failed to load stats')
          return
        }
        const data = (await res.json()) as Stats
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setError('Failed to load stats')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  if (!stats) {
    return <p className="text-zinc-500">Loading…</p>
  }

  const statusLines = Object.entries(stats.invoices.byStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Overview</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Aggregate metrics only. Access individual accounts only when needed for support — follow
          your internal data-access policy.
        </p>
        <p className="mt-1 text-xs text-zinc-600">Updated {new Date(stats.generatedAt).toLocaleString()}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total users" value={stats.users.total} hint={`+${stats.users.newLast30Days} last 30d`} />
        <Card title="Invoices (all time)" value={stats.invoices.total} />
        <Card
          title="Invoices (30d)"
          value={stats.invoices.createdLast30Days}
          hint={`${stats.invoices.createdThisCalendarMonth} this month`}
        />
        <Card title="Open support tickets" value={stats.support.openTickets} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Clients (records)" value={stats.clients.total} />
        <Card title="Estimates" value={stats.estimates.total} />
        <Card title="Time entries" value={stats.timeEntries.total} />
        <Card title="Expenses (records)" value={stats.expenses.total} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Paid invoice total (sum)</p>
        <p className="mt-1 text-lg font-medium text-zinc-200">
          {stats.revenue.paidInvoicesTotal}{' '}
          <span className="text-sm font-normal text-zinc-500">(platform aggregate, not net of fees)</span>
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Invoices by status</p>
        <p className="mt-2 text-sm text-zinc-400">{statusLines || '—'}</p>
      </div>
    </div>
  )
}
