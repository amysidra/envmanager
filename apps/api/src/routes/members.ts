import crypto from "node:crypto"
import { Hono } from "hono"
import { inviteMemberSchema } from "@envmanager/types"
import { prisma } from "../lib/prisma"
import { sendInvitationEmail } from "../lib/mailer"

type Variables = { user: { id: string; email: string; name: string } }

const members = new Hono<{ Variables: Variables }>()

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true } },
} as const

members.get("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: memberSelect,
  })

  return c.json(
    projectMembers.map(({ id, user, role, joinedAt }) => ({
      id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
      joinedAt,
    })),
  )
})

members.post("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const callerMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })
  if (!callerMembership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (callerMembership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can invite members" }, 403)
  }

  const body = await c.req.json()
  const parsed = inviteMemberSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input"
    return c.json({ error: "VALIDATION_ERROR", message }, 400)
  }

  const { email } = parsed.data
  const invitedUser = await prisma.user.findUnique({ where: { email } })

  if (invitedUser) {
    const alreadyMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invitedUser.id } },
    })
    if (alreadyMember) {
      return c.json({ error: "CONFLICT", message: "User is already a member of this project" }, 409)
    }

    const newMember = await prisma.projectMember.create({
      data: { projectId, userId: invitedUser.id, role: "MEMBER" },
      select: memberSelect,
    })

    return c.json(
      {
        id: newMember.id,
        userId: newMember.user.id,
        name: newMember.user.name,
        email: newMember.user.email,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
      },
      201,
    )
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.invitation.create({
    data: { projectId, invitedById: user.id, email, token, expiresAt },
  })

  await sendInvitationEmail(email, token)

  return c.json({ message: "Invitation sent" })
})

members.delete("/:memberId", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!
  const { memberId } = c.req.param()

  const callerMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })
  if (!callerMembership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (callerMembership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can remove members" }, 403)
  }

  const targetMember = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
  })
  if (!targetMember) {
    return c.json({ error: "NOT_FOUND", message: "Member not found" }, 404)
  }
  if (targetMember.userId === user.id) {
    return c.json({ error: "CONFLICT", message: "Owner cannot remove themselves" }, 409)
  }

  await prisma.projectMember.delete({ where: { id: memberId } })
  return c.json({ message: "Member removed" })
})

export default members
