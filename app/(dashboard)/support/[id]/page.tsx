'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Message = {
  id: string
  sender_type: string
  sender_name: string | null
  body: string
  created_at: string
}

type Ticket = {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  messages: Message[]
  user: { id: string; email: string; name: string | null }
}

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const

export default function SupportTicketPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [statusDraft, setStatusDraft] = useState<string>('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`)
        if (res.status === 404) {
          setError('Ticket not found')
          return
        }
        if (!res.ok) {
          setError('Failed to load')
          return
        }
        const json = await res.json()
        if (!cancelled && json.ticket) {
          setTicket(json.ticket)
          setStatusDraft(json.ticket.status)
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

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!ticket || !reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reply.trim(),
          status: statusDraft === ticket.status ? undefined : statusDraft,
        }),
      })
      if (!res.ok) {
        setError('Failed to send')
        setSending(false)
        return
      }
      setReply('')
      const refresh = await fetch(`/api/tickets/${id}`)
      const json = await refresh.json()
      if (json.ticket) {
        setTicket(json.ticket)
        setStatusDraft(json.ticket.status)
      }
    } catch {
      setError('Failed to send')
    }
    setSending(false)
  }

  async function saveStatus() {
    if (!ticket) return
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusDraft }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.ticket) {
        setTicket({ ...ticket, status: json.ticket.status })
      }
    }
  }

  if (error) return <p className="text-red-400">{error}</p>
  if (!ticket) return <p className="text-zinc-500">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/support" className="text-sm text-indigo-400 hover:underline">
        ← Support
      </Link>

      <header className="border-b border-zinc-800 pb-4">
        <p className="text-xs text-zinc-500">#{ticket.id.slice(0, 8)}</p>
        <h1 className="text-xl font-semibold text-zinc-100">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {ticket.user.email} · {ticket.category}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void saveStatus()}
            className="rounded-lg bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            Update status
          </button>
        </div>
      </header>

      <ul className="space-y-4">
        {ticket.messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg border p-3 ${
              m.sender_type === 'user'
                ? 'border-zinc-800 bg-zinc-900/30'
                : 'border-indigo-900/50 bg-indigo-950/20'
            }`}
          >
            <p className="text-xs text-zinc-500">
              {m.sender_type === 'user' ? 'User' : 'Support'} ·{' '}
              {new Date(m.created_at).toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{m.body}</p>
          </li>
        ))}
      </ul>

      {ticket.status !== 'closed' ? (
        <form onSubmit={sendReply} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <label className="block text-sm text-zinc-400">
            Reply (emails {ticket.user.email})
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              placeholder="Your message…"
              required
            />
          </label>
          <p className="text-xs text-zinc-600">
            Optional: change status in the dropdown above before sending to set status when the reply is sent.
          </p>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      ) : (
        <p className="text-zinc-500">This ticket is closed. Reopen by changing status first.</p>
      )}
    </div>
  )
}
