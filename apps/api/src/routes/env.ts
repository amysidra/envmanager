import { Hono } from "hono"
import { prisma } from "../lib/prisma"
import { encrypt, decrypt } from "../lib/crypto"

type Variables = { user: { id: string; email: string; name: string } }

const envFiles = new Hono<{ Variables: Variables }>()

const MAX_BYTES = 100 * 1024

async function getMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
}

// PUT /api/projects/:id/env
envFiles.put("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  // US-11 / FR-16 originally allowed any member to upload, but FR-15 (read-only for members)
  // takes precedence for safety — a malicious member could wipe the env file.
  if (membership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can upload the env file" }, 403)
  }

  const contentType = c.req.header("content-type") ?? ""
  let content: string

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData()
    const file = formData.get("file")
    if (!file || typeof file === "string") {
      return c.json({ error: "VALIDATION_ERROR", message: "No file provided" }, 400)
    }
    if ((file as File).size > MAX_BYTES) {
      return c.json({ error: "VALIDATION_ERROR", message: "File exceeds 100 KB limit" }, 400)
    }
    content = await (file as File).text()
  } else {
    const body = await c.req.json()
    if (typeof body.content !== "string") {
      return c.json({ error: "VALIDATION_ERROR", message: "content is required" }, 400)
    }
    if (Buffer.byteLength(body.content, "utf8") > MAX_BYTES) {
      return c.json({ error: "VALIDATION_ERROR", message: "Content exceeds 100 KB limit" }, 400)
    }
    content = body.content
  }

  const { encryptedContent, iv } = encrypt(content)

  const envFile = await prisma.envFile.upsert({
    where: { projectId },
    create: { projectId, uploadedById: user.id, encryptedContent, iv },
    update: { encryptedContent, iv, uploadedById: user.id },
    select: { id: true, projectId: true, createdAt: true, updatedAt: true },
  })

  return c.json(envFile)
})

// GET /api/projects/:id/env/download
envFiles.get("/download", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const envFile = await prisma.envFile.findUnique({ where: { projectId } })
  if (!envFile) return c.json({ error: "NOT_FOUND", message: "No env file found" }, 404)

  const content = decrypt(envFile.encryptedContent, envFile.iv)
  c.header("Content-Type", "text/plain")
  c.header("Content-Disposition", 'attachment; filename=".env"')
  c.header("Cache-Control", "no-store")
  return c.text(content)
})

// GET /api/projects/:id/env
envFiles.get("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const envFile = await prisma.envFile.findUnique({ where: { projectId } })
  if (!envFile) return c.json({ error: "NOT_FOUND", message: "No env file found" }, 404)

  const content = decrypt(envFile.encryptedContent, envFile.iv)
  c.header("Cache-Control", "no-store")
  return c.json({ content })
})

// DELETE /api/projects/:id/env
envFiles.delete("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (membership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can delete the env file" }, 403)
  }

  const envFile = await prisma.envFile.findUnique({ where: { projectId } })
  if (!envFile) return c.json({ error: "NOT_FOUND", message: "No env file found" }, 404)

  await prisma.envFile.delete({ where: { projectId } })
  return c.json({ message: "Env file deleted" })
})

export default envFiles
