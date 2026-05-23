import { createServer } from "node:http"
import server from "./dist/server/server.js"

const port = Number(process.env.PORT) || 3000

const nodeServer = createServer(async (req, res) => {
  const url = `http://${req.headers.host}${req.url}`
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value)
  }

  let body = undefined
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = []
      req.on("data", (chunk) => chunks.push(chunk))
      req.on("end", () => resolve(Buffer.concat(chunks)))
    })
  }

  const request = new Request(url, { method: req.method, headers, body })
  const response = await server.fetch(request)

  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  const buffer = await response.arrayBuffer()
  res.end(Buffer.from(buffer))
})

nodeServer.listen(port, () => {
  console.log(`Web server running on http://localhost:${port}`)
})
