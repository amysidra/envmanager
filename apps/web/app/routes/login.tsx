import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router"
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
    <div style={s.root}>
      <nav style={s.nav}>
        <Link to="/" style={s.navLogo}>Env Manager</Link>
        <Link to="/register" style={s.navLink}>Create account →</Link>
      </nav>

      <main style={s.main}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h1 style={s.title}>Welcome back</h1>
            <p style={s.subtitle}>Sign in to manage your team's secrets</p>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            {error && (
              <div style={s.errorBox}>
                <span style={s.errorDot} />
                {error}
              </div>
            )}
            <label style={s.label}>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
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
                  placeholder="••••••••"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={s.footer}>
            Don't have an account?{" "}
            <Link to="/register" style={s.link}>Create one free</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #f3f4f6",
  },
  navLogo: {
    fontWeight: 800,
    fontSize: "1.125rem",
    color: "#111827",
    textDecoration: "none",
    letterSpacing: "-0.02em",
  },
  navLink: { fontSize: "0.875rem", color: "#6b7280", textDecoration: "none", fontWeight: 500 },
  main: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 57px)",
    padding: "2rem",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
  },
  cardHeader: { marginBottom: "1.75rem" },
  title: {
    margin: "0 0 0.35rem",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  subtitle: { margin: 0, fontSize: "0.875rem", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.65rem 0.875rem",
    background: "#fff5f5",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#dc2626",
  },
  errorDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#dc2626",
    flexShrink: 0,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#374151",
    letterSpacing: "0.01em",
  },
  input: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    color: "#111827",
    background: "#fff",
    transition: "border-color 0.15s",
  },
  pwWrap: { position: "relative" },
  pwInput: {
    width: "100%",
    padding: "0.6rem 2.5rem 0.6rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    color: "#111827",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  btn: {
    padding: "0.7rem",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "0.25rem",
    letterSpacing: "-0.01em",
  },
  footer: {
    textAlign: "center",
    fontSize: "0.8rem",
    marginTop: "1.5rem",
    color: "#9ca3af",
  },
  link: { color: "#111827", textDecoration: "none", fontWeight: 700 },
}
