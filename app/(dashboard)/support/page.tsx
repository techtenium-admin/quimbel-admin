'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type TicketRow = {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  user: { id: string; email: string; name: string | null }
  messages: { body: string; created_at: string }[]
}

const STATUS_FILTER = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const

function SupportListInner() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') ?? 'all'

  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (status && status !== 'all') params.set('status', status)
        const res = await fetch(`/api/tickets?${params}`)
        if (!res.ok) {
          setError('Failed to load tickets')
          return
        }
        const json = await res.json()
        if (!cancelled) {
          setTickets(json.tickets ?? [])
          setError('')
        }
      } catch {
        if (!cancelled) setError('Failed to load tickets')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status])

  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Support</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Respond from the ticket thread. Replies email the user via the main app (Resend).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/support' : `/support?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm ${
              status === s
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {loading ? <p className="text-zinc-500">Loading…</p> : null}

      <ul className="space-y-2">
        {tickets.map((t) => {
          const preview = t.messages[0]?.body?.slice(0, 120) ?? ''
          return (
            <li key={t.id}>
              <Link
                href={`/support/${t.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-zinc-500">#{t.id.slice(0, 8)}</span>
                    <h2 className="font-medium text-zinc-200">{t.subject}</h2>
                    <p className="text-xs text-zinc-500">
                      {t.user.email} · {t.category} · {t.status}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600">{new Date(t.updated_at).toLocaleString()}</span>
                </div>
                {preview ? <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{preview}</p> : null}
              </Link>
            </li>
          )
        })}
      </ul>

      {!loading && tickets.length === 0 ? (
        <p className="text-zinc-500">No tickets for this filter.</p>
      ) : null}
    </div>
  )
}

export default function SupportListPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
      <SupportListInner />
    </Suspense>
  )
}
