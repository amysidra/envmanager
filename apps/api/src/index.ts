import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

const app = new Hono()

// Middleware
app.use("*", logger())
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
)

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok" })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404)
})

// Global error handler
app.onError((err, c) => {
  console.error(err)
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
    500
  )
})

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`)
})
