import type { MiddlewareHandler } from "hono"
import { getCookie } from "hono/cookie"
import { verifyToken } from "../lib/jwt"
import { prisma } from "../lib/prisma"

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  let token = getCookie(c, "session")

  if (!token) {
    const header = c.req.header("Authorization")
    if (header?.startsWith("Bearer ")) token = header.slice(7)
  }

  if (!token) return c.json({ error: "UNAUTHORIZED" }, 401)

  try {
    const { sub } = await verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, email: true, name: true },
    })
    if (!user) return c.json({ error: "UNAUTHORIZED" }, 401)
    c.set("user", user)
    await next()
  } catch {
    return c.json({ error: "UNAUTHORIZED" }, 401)
  }
}
