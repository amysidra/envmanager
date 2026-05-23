import { Hono } from "hono"
import { setCookie, deleteCookie } from "hono/cookie"
import bcrypt from "bcryptjs"
import { registerSchema, loginSchema } from "@envmanager/types"
import { prisma } from "../lib/prisma"
import { signToken } from "../lib/jwt"
import { authMiddleware } from "../middleware/auth"

type Variables = { user: { id: string; email: string; name: string } }

const auth = new Hono<{ Variables: Variables }>()

const SESSION_COOKIE = "session"
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.USE_HTTPS === "true",
  sameSite: "Lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
}

auth.post("/register", async (c) => {
  const body = await c.req.json()
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input"
    return c.json({ error: "VALIDATION_ERROR", message }, 400)
  }

  const { name, email, password } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: "CONFLICT", message: "Email already in use" }, 409)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true },
  })

  return c.json(user, 201)
})

auth.post("/login", async (c) => {
  const body = await c.req.json()
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input"
    return c.json({ error: "VALIDATION_ERROR", message }, 400)
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  // Always compare to prevent email enumeration via timing
  const hash = user?.passwordHash ?? "$2b$12$invalidhashforenumerationprotection"
  const valid = await bcrypt.compare(password, hash)

  if (!user || !valid) {
    return c.json({ error: "UNAUTHORIZED", message: "Invalid credentials" }, 401)
  }

  const token = await signToken(user.id)
  setCookie(c, SESSION_COOKIE, token, COOKIE_OPTS)
  return c.json({ id: user.id, email: user.email, name: user.name })
})

auth.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" })
  return c.json({ message: "Logged out" })
})

auth.get("/me", authMiddleware, (c) => {
  return c.json(c.get("user"))
})

export default auth
