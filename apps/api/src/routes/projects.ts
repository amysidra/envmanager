import { Hono } from "hono"
import { createProjectSchema } from "@envmanager/types"
import { prisma } from "../lib/prisma"

type Variables = { user: { id: string; email: string; name: string } }

const projects = new Hono<{ Variables: Variables }>()

projects.get("/", async (c) => {
  const user = c.get("user")

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: { include: { envFile: { select: { id: true } } } },
    },
  })

  return c.json(
    memberships.map(({ project, role }) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      hasEnvFile: project.envFile !== null,
      role,
    })),
  )
})

projects.post("/", async (c) => {
  const user = c.get("user")
  const body = await c.req.json()
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input"
    return c.json({ error: "VALIDATION_ERROR", message }, 400)
  }

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({ data: { name: parsed.data.name } })
    await tx.projectMember.create({
      data: { projectId: p.id, userId: user.id, role: "OWNER" },
    })
    return p
  })

  return c.json({ ...project, hasEnvFile: false, role: "OWNER" }, 201)
})

projects.get("/:id", async (c) => {
  const user = c.get("user")
  const { id } = c.req.param()

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
    include: {
      project: { include: { envFile: { select: { id: true } } } },
    },
  })

  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const { project, role } = membership
  return c.json({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    hasEnvFile: project.envFile !== null,
    role,
  })
})

projects.delete("/:id", async (c) => {
  const user = c.get("user")
  const { id } = c.req.param()

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
  })

  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (membership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can delete a project" }, 403)
  }

  await prisma.project.delete({ where: { id } })
  return c.json({ message: "Project deleted" })
})

export default projects
