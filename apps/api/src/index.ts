import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { authMiddleware } from "./middleware/auth"
import auth from "./routes/auth"

type AppVariables = { user: { id: string; email: string; name: string } }

const app = new Hono<{ Variables: AppVariables }>()

app.use("*", logger())
app.use(
  "*",
  cors({
    origin: (origin) => (!origin || origin.startsWith("http://localhost") ? origin : null),
    credentials: true,
  }),
)

// Protect all /api/* routes — skip only auth endpoints and health check
app.use("/api/*", async (c, next) => {
  const { path } = c.req
  if (path.startsWith("/api/auth") || path === "/api/health") return next()
  return authMiddleware(c, next)
})

app.get("/api/health", (c) => c.json({ status: "ok" }))
app.route("/api/auth", auth)

app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, 500)
})

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`)
})
