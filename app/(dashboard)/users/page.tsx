'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type UserRow = {
  id: string
  email: string
  name: string | null
  company_name: string | null
  subscription_plan: string
  subscription_status: string | null
  created_at: string
  email_verified: boolean
  _count: { invoices: number; clients: number }
}

function UsersPageInner() {
  const searchParams = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const q = searchParams.get('q') ?? ''

  const [data, setData] = useState<{
    users: UserRow[]
    pagination: { page: number; totalPages: number; total: number }
  } | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState(q)

  useEffect(() => {
    setQuery(q)
  }, [q])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        if (q) params.set('q', q)
        const res = await fetch(`/api/users?${params}`)
        if (!res.ok) {
          setError('Failed to load users')
          return
        }
        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setError('')
        }
      } catch {
        if (!cancelled) setError('Failed to load users')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, q])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('page', '1')
    if (query.trim()) params.set('q', query.trim())
    window.location.href = `/users?${params}`
  }

  if (error) return <p className="text-red-400">{error}</p>
  if (!data) return <p className="text-zinc-500">Loading…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Account metadata and counts — not invoice contents. Use Support for ticket threads.
        </p>
      </div>

      <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, name, company"
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Clients / invoices</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <Link href={`/users/${u.id}`} className="font-medium text-indigo-400 hover:underline">
                    {u.email}
                  </Link>
                  {u.name ? <p className="text-xs text-zinc-500">{u.name}</p> : null}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {u.subscription_plan}
                  {u.subscription_status ? (
                    <span className="text-zinc-600"> · {u.subscription_status}</span>
                  ) : null}
                  {!u.email_verified ? (
                    <span className="ml-2 text-amber-500/90">unverified</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-400">
                  {u._count.clients} / {u._count.invoices}
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} users)
        </span>
        <div className="flex gap-2">
          {data.pagination.page > 1 ? (
            <Link
              href={`/users?page=${data.pagination.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="text-indigo-400 hover:underline"
            >
              Previous
            </Link>
          ) : null}
          {data.pagination.page < data.pagination.totalPages ? (
            <Link
              href={`/users?page=${data.pagination.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="text-indigo-400 hover:underline"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
      <UsersPageInner />
    </Suspense>
  )
}
