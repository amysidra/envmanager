import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router"
import { api } from "../../lib/api"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useRouteContext({ from: "/_authenticated/dashboard" })

  async function handleLogout() {
    await api.post("/api/auth/logout")
    navigate({ to: "/login" })
  }

  return (
    <main style={s.page}>
      <header style={s.header}>
        <h1 style={s.logo}>Env Manager</h1>
        <div style={s.userInfo}>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>
            Logout
          </button>
        </div>
      </header>
      <section style={s.content}>
        <h2 style={s.welcome}>Welcome back, {user?.name?.split(" ")[0]}!</h2>
        <p style={s.sub}>Your projects will appear here.</p>
      </section>
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
  },
  logo: { margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#111827" },
  userInfo: { display: "flex", alignItems: "center", gap: "1rem" },
  userName: { fontSize: "0.875rem", color: "#6b7280" },
  logoutBtn: {
    padding: "0.4rem 0.9rem",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  content: { padding: "3rem 2rem" },
  welcome: { margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#111827" },
  sub: { color: "#6b7280", margin: 0 },
}
