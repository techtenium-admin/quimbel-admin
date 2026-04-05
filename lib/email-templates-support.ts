/**
 * Ticket reply HTML — keep in sync with quimbel-nextjs/lib/email-templates.ts (ticket reply block).
 */

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #f6f6f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .wrapper { width: 100%; background-color: #f6f6f6; padding: 40px 0; }
  .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .header { padding: 32px 40px 24px; }
  .content { padding: 0 40px 32px; }
  .footer { padding: 24px 40px; border-top: 1px solid #e5e7eb; }
  .company-name { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
  .muted { color: #6b7280; font-size: 13px; line-height: 1.5; }
  .text { color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
`

export function generateTicketReplyNotificationHTML(data: {
  user_name: string
  ticket_id: string
  subject: string
  reply_body: string
  app_url: string
}): string {
  return `
  <!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New reply on your ticket</title>
    <style>${baseStyles}</style>
  </head><body>
    <div class="wrapper"><div class="container">
      <div style="height:4px;background:#6366f1;"></div>
      <div class="header"><p class="company-name">Quimbel Support</p></div>
      <div class="content">
        <p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;">You have a new reply</p>
        <p class="text">Hi ${data.user_name}, the support team replied to your ticket.</p>
        <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:0 0 20px;border-left:3px solid #6366f1;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Ticket</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">#${data.ticket_id} — ${data.subject}</p>
        </div>
        <p style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Reply</p>
        <p style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;background:#f9fafb;padding:16px;border-radius:6px;margin:0 0 24px;">${data.reply_body}</p>
        <a href="${data.app_url}/support" style="display:inline-block;background:#6366f1;color:#fff;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">View full conversation</a>
      </div>
      <div class="footer"><p class="muted" style="margin:0;">You can reply from the platform or by replying to this email.</p></div>
    </div></div>
  </body></html>`.trim()
}
