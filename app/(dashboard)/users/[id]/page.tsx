'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type UserDetail = {
  id: string
  email: string
  name: string | null
  company_name: string | null
  timezone: string
  currency: string
  country: string | null
  subscription_plan: string
  subscription_status: string | null
  roles: string[]
  active_role: string
  created_at: string
  updated_at: string
  email_verified: boolean
  stripe_customer_id: string | null
  stripe_connect_onboarding_complete: boolean
  stripe_connect_account_status: string | null
  _count: {
    invoices: number
    clients: number
    estimates: number
    time_entries: number
    expenses: number
    support_tickets: number
  }
}

export default function UserDetailPage() {
  const routeParams = useParams()
  const id = typeof routeParams.id === 'string' ? routeParams.id : ''
  const [user, setUser] = useState<UserDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/users/${id}`)
        if (res.status === 404) {
          setError('User not found')
          return
        }
        if (!res.ok) {
          setError('Failed to load')
          return
        }
        const json = await res.json()
        if (!cancelled) {
          setUser(json.user)
          setError('')
        }
      } catch {
        if (!cancelled) setError('Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) return <p className="text-red-400">{error}</p>
  if (!user) return <p className="text-zinc-500">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/users" className="text-sm text-indigo-400 hover:underline">
          ← Users
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-100">{user.email}</h1>
        <p className="text-sm text-zinc-500">
          {user.name || 'No name'} {user.company_name ? `· ${user.company_name}` : ''}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-xs uppercase text-zinc-500">Plan</dt>
          <dd className="mt-1 text-zinc-200">
            {user.subscription_plan}
            {user.subscription_status ? ` (${user.subscription_status})` : ''}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-xs uppercase text-zinc-500">Roles</dt>
          <dd className="mt-1 text-zinc-200">{user.roles.join(', ')} · active: {user.active_role}</dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-xs uppercase text-zinc-500">Region</dt>
          <dd className="mt-1 text-zinc-200">
            {user.country ?? '—'} · {user.timezone} · {user.currency}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-xs uppercase text-zinc-500">Email verified</dt>
          <dd className="mt-1 text-zinc-200">{user.email_verified ? 'Yes' : 'No'}</dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-xs uppercase text-zinc-500">Stripe</dt>
          <dd className="mt-1 break-all text-zinc-400">
            Customer: {user.stripe_customer_id ?? '—'}
            <br />
            Connect onboarded: {user.stripe_connect_onboarding_complete ? 'yes' : 'no'}
            {user.stripe_connect_account_status
              ? ` · ${user.stripe_connect_account_status}`
              : ''}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-xs uppercase text-zinc-500">Created</dt>
          <dd className="mt-1 text-zinc-200">{new Date(user.created_at).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-medium text-zinc-300">Counts</h2>
        <ul className="mt-2 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
          <li>Clients: {user._count.clients}</li>
          <li>Invoices: {user._count.invoices}</li>
          <li>Estimates: {user._count.estimates}</li>
          <li>Time entries: {user._count.time_entries}</li>
          <li>Expenses: {user._count.expenses}</li>
          <li>Support tickets: {user._count.support_tickets}</li>
        </ul>
      </div>
    </div>
  )
}
