import { Hono } from "hono"
import { prisma } from "../lib/prisma"

const invitations = new Hono()

invitations.get("/:token", async (c) => {
  const { token } = c.req.param()
  const appUrl = process.env.APP_URL

  const invitation = await prisma.invitation.findUnique({ where: { token } })

  if (!invitation || invitation.expiresAt < new Date()) {
    return c.json({ error: "VALIDATION_ERROR", message: "Invalid or expired invitation token" }, 400)
  }

  if (invitation.acceptedAt) {
    return c.redirect(`${appUrl}/dashboard`)
  }

  const invitedUser = await prisma.user.findUnique({ where: { email: invitation.email } })

  if (!invitedUser) {
    return c.redirect(`${appUrl}/register?token=${token}`)
  }

  await prisma.$transaction(async (tx) => {
    const alreadyMember = await tx.projectMember.findUnique({
      where: { projectId_userId: { projectId: invitation.projectId, userId: invitedUser.id } },
    })
    if (!alreadyMember) {
      await tx.projectMember.create({
        data: { projectId: invitation.projectId, userId: invitedUser.id, role: "MEMBER" },
      })
    }
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })
  })

  return c.redirect(`${appUrl}/dashboard`)
})

export default invitations
