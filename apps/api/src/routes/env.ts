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

// GET /api/projects/:id/env — list all env files (metadata only)
envFiles.get("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const files = await prisma.envFile.findMany({
    where: { projectId },
    select: { id: true, name: true, projectId: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  })

  return c.json(files)
})

// POST /api/projects/:id/env — upload a new env file
envFiles.post("/", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (membership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can upload env files" }, 403)
  }

  const contentType = c.req.header("content-type") ?? ""
  let content: string
  let name = ".env"

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData()
    const file = formData.get("file")
    if (!file || typeof file === "string") {
      return c.json({ error: "VALIDATION_ERROR", message: "No file provided" }, 400)
    }
    if ((file as File).size > MAX_BYTES) {
      return c.json({ error: "VALIDATION_ERROR", message: "File exceeds 100 KB limit" }, 400)
    }
    name = (formData.get("name") as string) || (file as File).name || ".env"
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
    if (typeof body.name === "string" && body.name.trim()) {
      name = body.name.trim()
    }
  }

  const { encryptedContent, iv } = encrypt(content)

  const envFile = await prisma.envFile.create({
    data: { projectId, name, uploadedById: user.id, encryptedContent, iv },
    select: { id: true, name: true, projectId: true, createdAt: true, updatedAt: true },
  })

  return c.json(envFile, 201)
})

// GET /api/projects/:id/env/:fileId — get decrypted content of a specific file
envFiles.get("/:fileId", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!
  const fileId = c.req.param("fileId")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const envFile = await prisma.envFile.findUnique({ where: { id: fileId } })
  if (!envFile || envFile.projectId !== projectId) {
    return c.json({ error: "NOT_FOUND", message: "Env file not found" }, 404)
  }

  const content = decrypt(envFile.encryptedContent, envFile.iv)
  c.header("Cache-Control", "no-store")
  return c.json({ content })
})

// PUT /api/projects/:id/env/:fileId — replace content of a specific file
envFiles.put("/:fileId", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!
  const fileId = c.req.param("fileId")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (membership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can update env files" }, 403)
  }

  const existing = await prisma.envFile.findUnique({ where: { id: fileId } })
  if (!existing || existing.projectId !== projectId) {
    return c.json({ error: "NOT_FOUND", message: "Env file not found" }, 404)
  }

  const contentType = c.req.header("content-type") ?? ""
  let content: string
  let name = existing.name

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData()
    const file = formData.get("file")
    if (!file || typeof file === "string") {
      return c.json({ error: "VALIDATION_ERROR", message: "No file provided" }, 400)
    }
    if ((file as File).size > MAX_BYTES) {
      return c.json({ error: "VALIDATION_ERROR", message: "File exceeds 100 KB limit" }, 400)
    }
    if (formData.get("name")) name = formData.get("name") as string
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
    if (typeof body.name === "string" && body.name.trim()) {
      name = body.name.trim()
    }
  }

  const { encryptedContent, iv } = encrypt(content)

  const envFile = await prisma.envFile.update({
    where: { id: fileId },
    data: { encryptedContent, iv, name, uploadedById: user.id },
    select: { id: true, name: true, projectId: true, createdAt: true, updatedAt: true },
  })

  return c.json(envFile)
})

// GET /api/projects/:id/env/:fileId/download — download a specific env file
envFiles.get("/:fileId/download", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!
  const fileId = c.req.param("fileId")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)

  const envFile = await prisma.envFile.findUnique({ where: { id: fileId } })
  if (!envFile || envFile.projectId !== projectId) {
    return c.json({ error: "NOT_FOUND", message: "Env file not found" }, 404)
  }

  const content = decrypt(envFile.encryptedContent, envFile.iv)
  const filename = envFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  c.header("Content-Type", "application/octet-stream")
  c.header("Content-Disposition", `attachment; filename="${filename}"`)
  c.header("Cache-Control", "no-store")
  return c.text(content)
})

// DELETE /api/projects/:id/env/:fileId — delete a specific env file
envFiles.delete("/:fileId", async (c) => {
  const user = c.get("user")
  const projectId = c.req.param("id")!
  const fileId = c.req.param("fileId")!

  const membership = await getMembership(projectId, user.id)
  if (!membership) return c.json({ error: "FORBIDDEN", message: "Access denied" }, 403)
  if (membership.role !== "OWNER") {
    return c.json({ error: "FORBIDDEN", message: "Only the owner can delete env files" }, 403)
  }

  const envFile = await prisma.envFile.findUnique({ where: { id: fileId } })
  if (!envFile || envFile.projectId !== projectId) {
    return c.json({ error: "NOT_FOUND", message: "Env file not found" }, 404)
  }

  await prisma.envFile.delete({ where: { id: fileId } })
  return c.json({ message: "Env file deleted" })
})

export default envFiles
