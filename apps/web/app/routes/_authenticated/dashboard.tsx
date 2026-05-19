import { createFileRoute, Link, redirect, useNavigate, useRouter, useRouteContext } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import type { Project } from "../../lib/server-fns"

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" })
  },
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const router = useRouter()
  const { user } = useRouteContext({ from: "/_authenticated/dashboard" })

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api
      .get<Project[]>("/api/projects")
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }, [])
  const [projectName, setProjectName] = useState("")
  const [formError, setFormError] = useState("")
  const [creating, setCreating] = useState(false)

  async function handleLogout() {
    await api.post("/api/auth/logout")
    await router.invalidate()
    navigate({ to: "/login" })
  }

  function openModal() {
    setProjectName("")
    setFormError("")
    setShowModal(true)
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = projectName.trim()
    if (!name) { setFormError("Project name is required"); return }
    if (name.length > 100) { setFormError("Project name must be 100 characters or less"); return }
    setCreating(true)
    setFormError("")
    try {
      const project = await api.post<Project>("/api/projects", { name })
      setProjects((prev) => [project, ...prev])
      setShowModal(false)
    } catch (err: unknown) {
      const body = err as { message?: string }
      setFormError(body?.message ?? "Failed to create project")
    } finally {
      setCreating(false)
    }
  }

  return (
    <main style={s.page}>
      <header style={s.header}>
        <h1 style={s.logo}>Env Manager</h1>
        <div style={s.userInfo}>
          <span style={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </header>

      <section style={s.content}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>My Projects</h2>
          <button onClick={openModal} style={s.newBtn}>+ New Project</button>
        </div>

        {loadingProjects ? (
          <div style={s.empty}>
            <p style={s.emptyText}>Loading projects…</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>No projects yet. Create your first project.</p>
          </div>
        ) : (
          <div style={s.list}>
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                style={s.card}
              >
                <div style={s.cardLeft}>
                  <span style={s.projectName}>{p.name}</span>
                  <span style={p.role === "OWNER" ? s.badgeOwner : s.badgeMember}>
                    {p.role === "OWNER" ? "Owner" : "Member"}
                  </span>
                </div>
                <span style={p.hasEnvFile ? s.envOn : s.envOff}>
                  {p.hasEnvFile ? "Env file uploaded" : "No env file"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>New Project</h3>
            <form onSubmit={handleCreate} style={s.form}>
              {formError && <p style={s.error}>{formError}</p>}
              <label style={s.label}>
                Project Name
                <input
                  autoFocus
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. My App"
                  style={s.input}
                />
              </label>
              <div style={s.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={s.cancelBtn}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button type="submit" style={s.submitBtn} disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  content: { padding: "2rem", maxWidth: "800px", margin: "0 auto" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  sectionTitle: { margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#111827" },
  newBtn: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    padding: "3rem",
    background: "#fff",
    borderRadius: "10px",
    border: "1px dashed #d1d5db",
  },
  emptyText: { color: "#6b7280", margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
    transition: "box-shadow 0.15s",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  projectName: { fontWeight: 600, fontSize: "0.95rem", color: "#111827" },
  badgeOwner: {
    padding: "0.2rem 0.6rem",
    background: "#dcfce7",
    color: "#16a34a",
    borderRadius: "99px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  badgeMember: {
    padding: "0.2rem 0.6rem",
    background: "#f3f4f6",
    color: "#6b7280",
    borderRadius: "99px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  envOn: { fontSize: "0.8rem", color: "#16a34a" },
  envOff: { fontSize: "0.8rem", color: "#9ca3af" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modal: {
    background: "#fff",
    borderRadius: "10px",
    padding: "2rem",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  },
  modalTitle: { margin: "0 0 1.25rem", fontSize: "1.25rem", fontWeight: 700, color: "#111827" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: 0 },
  label: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.875rem", fontWeight: 500 },
  input: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "1rem",
    outline: "none",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.25rem" },
  cancelBtn: {
    padding: "0.5rem 1rem",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitBtn: {
    padding: "0.5rem 1.25rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
}
