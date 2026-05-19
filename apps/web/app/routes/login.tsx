import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router"
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
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/api/auth/login", { email, password })
      await router.invalidate()
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
            <div style={s.pwWrap}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={s.pwInput}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={s.eyeBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
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
  pwWrap: { position: "relative" },
  pwInput: {
    width: "100%",
    padding: "0.5rem 2.5rem 0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "0.625rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    padding: 0,
    display: "flex",
    alignItems: "center",
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
