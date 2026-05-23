import { createServer } from "node:http"
import { createReadStream, existsSync, statSync } from "node:fs"
import { join, extname } from "node:path"
import { fileURLToPath } from "node:url"
import server from "./dist/server/server.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const port = Number(process.env.PORT) || 3000
const clientDir = join(__dirname, "dist/client")

const mimeTypes = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
}

const nodeServer = createServer(async (req, res) => {
  const urlPath = req.url.split("?")[0]
  const filePath = join(clientDir, urlPath)

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath)
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream")
    createReadStream(filePath).pipe(res)
    return
  }

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
