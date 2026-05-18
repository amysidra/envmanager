import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

export type User = { id: string; email: string; name: string }

export const $getUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    try {
      const request = getRequest()
      const cookie = request.headers.get("cookie") ?? ""

      const res = await fetch("http://localhost:3001/api/auth/me", {
        headers: cookie ? { Cookie: cookie } : {},
      })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  },
)
