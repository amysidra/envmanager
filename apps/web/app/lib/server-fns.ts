import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

export type User = { id: string; email: string; name: string }

export type Project = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  hasEnvFile: boolean
  role: "OWNER" | "MEMBER"
}

export const $getUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    try {
      const request = getRequest()
      const cookie = request.headers.get("cookie") ?? ""
      const API_URL = import.meta.env.VITE_API_URL as string

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: cookie ? { Cookie: cookie } : {},
      })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  },
)

export const $getProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<Project[]> => {
    try {
      const request = getRequest()
      const cookie = request.headers.get("cookie") ?? ""
      const API_URL = import.meta.env.VITE_API_URL as string
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: cookie ? { Cookie: cookie } : {},
      })
      if (!res.ok) return []
      return res.json()
    } catch {
      return []
    }
  },
)

