import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { api } from "../lib/api"

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: "/dashboard" })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/api/auth/login", { email, password })
      navigate({ to: "/dashboard" })
    } catch (err: unknown) {
      const body = err as { message?: string }
      setError(body?.message ?? "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Sign In</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          {error && <p style={s.error}>{error}</p>}
          <label style={s.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={s.input}
            />
          </label>
          <label style={s.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={s.input}
            />
          </label>
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p style={s.footer}>
          No account?{" "}
          <a href="/register" style={s.link}>
            Register
          </a>
        </p>
      </div>
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "380px",
  },
  title: { margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700 },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.875rem", fontWeight: 500 },
  input: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "1rem",
    outline: "none",
  },
  btn: {
    padding: "0.625rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "0.25rem",
  },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: "0" },
  footer: { textAlign: "center", fontSize: "0.875rem", marginTop: "1.25rem", color: "#6b7280" },
  link: { color: "#2563eb", textDecoration: "none", fontWeight: 500 },
}
