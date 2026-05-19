export async function sendInvitationEmail(to: string, token: string) {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001"
  const inviteLink = `${apiUrl}/api/invitations/${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log(`[mailer] invite link for ${to}: ${inviteLink}`)
    return
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "noreply@envmanager.local",
      to,
      subject: "You've been invited to a project on EnvManager",
      html: `
        <p>You have been invited to join a project on EnvManager.</p>
        <p><a href="${inviteLink}">Click here to accept the invitation</a></p>
        <p>This link expires in 7 days.</p>
      `,
    }),
  })
}
