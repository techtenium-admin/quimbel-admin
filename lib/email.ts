import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  from?: 'noreply' | 'contact'
  replyTo?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = getResend()
    if (!client) {
      console.warn('RESEND_API_KEY not set, skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const fromEmail =
      params.from === 'contact'
        ? process.env.EMAIL_CONTACT || process.env.CONTACT_EMAIL || 'onboarding@resend.dev'
        : process.env.EMAIL_NOREPLY || 'onboarding@resend.dev'

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
