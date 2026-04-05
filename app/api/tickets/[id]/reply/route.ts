import { NextRequest, NextResponse } from 'next/server'
import { db, ensureConnected } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { generateTicketReplyNotificationHTML } from '@/lib/email-templates-support'
import { getAppUrlForLinks } from '@/lib/admin-env'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureConnected()

  const { id } = await params
  const body = await request.json()
  const message = (body?.message as string | undefined)?.trim()
  const nextStatus = body?.status as string | undefined

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 })
  }

  const supportEmail =
    process.env.EMAIL_CONTACT || process.env.CONTACT_EMAIL || 'support@quimbel.com'
  const supportName = 'Quimbel Support'

  const created = await db.supportMessage.create({
    data: {
      ticket_id: id,
      sender_type: 'support',
      sender_email: supportEmail,
      sender_name: supportName,
      body: message,
    },
  })

  const statusUpdate =
    nextStatus === 'resolved' || nextStatus === 'closed' || nextStatus === 'open'
      ? nextStatus
      : 'in_progress'

  await db.supportTicket.update({
    where: { id },
    data: { status: statusUpdate },
  })

  let appUrl: string
  try {
    appUrl = getAppUrlForLinks()
  } catch {
    appUrl = 'https://app.quimbel.com'
  }

  const ticketShort = ticket.id.slice(0, 8)

  await sendEmail({
    to: ticket.user.email,
    subject: `Re: [Ticket #${ticketShort}] ${ticket.subject}`,
    html: generateTicketReplyNotificationHTML({
      user_name: ticket.user.name || 'there',
      ticket_id: ticketShort,
      subject: ticket.subject,
      reply_body: message,
      app_url: appUrl,
    }),
    from: 'contact',
  })

  return NextResponse.json({ message: created, ticketStatus: statusUpdate }, { status: 201 })
}
