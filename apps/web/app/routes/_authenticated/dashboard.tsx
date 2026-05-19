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
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [formError, setFormError] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api
      .get<Project[]>("/api/projects")
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }, [])

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
    <div style={s.root}>
      <nav style={s.nav}>
        <span style={s.navLogo}>Env Manager</span>
        <div style={s.navRight}>
          <span style={s.navUser}>{user?.name}</span>
          <button onClick={() => setConfirmLogout(true)} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Projects</h1>
            <p style={s.pageSubtitle}>Manage and share secrets with your team</p>
          </div>
          <button onClick={openModal} style={s.newBtn}>+ New project</button>
        </div>

        {loadingProjects ? (
          <div style={s.emptyState}>
            <p style={s.emptyText}>Loading…</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>🗂️</div>
            <p style={s.emptyTitle}>No projects yet</p>
            <p style={s.emptyText}>Create your first project to start managing secrets securely.</p>
            <button onClick={openModal} style={s.emptyBtn}>Create your first project</button>
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
                  <div style={s.cardIcon}>{p.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.cardName}>{p.name}</p>
                    <p style={s.cardMeta}>
                      <span style={p.role === "OWNER" ? s.badgeOwner : s.badgeMember}>
                        {p.role === "OWNER" ? "Owner" : "Member"}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={s.cardRight}>
                  <span style={p.hasEnvFile ? s.envOn : s.envOff}>
                    {p.hasEnvFile ? "● Env file uploaded" : "○ No env file"}
                  </span>
                  <span style={s.cardArrow}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New project modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>New project</h3>
            <p style={s.modalSub}>Give your project a name to get started.</p>
            <form onSubmit={handleCreate} style={s.form}>
              {formError && (
                <div style={s.errorBox}>
                  <span style={s.errorDot} />
                  {formError}
                </div>
              )}
              <label style={s.label}>
                Project name
                <input
                  autoFocus
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. My App Backend"
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
                  {creating ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout modal */}
      {confirmLogout && (
        <div style={s.overlay} onClick={() => setConfirmLogout(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Logout?</h3>
            <p style={s.modalSub}>Are you sure you want to logout?</p>
            <div style={s.modalActions}>
              <button onClick={() => setConfirmLogout(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleLogout} style={s.submitBtn}>Yes, logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  navLogo: {
    fontWeight: 800,
    fontSize: "1.125rem",
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  navRight: { display: "flex", alignItems: "center", gap: "1rem" },
  navUser: { fontSize: "0.875rem", color: "#6b7280" },
  logoutBtn: {
    padding: "0.35rem 0.875rem",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },

  main: { maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  pageTitle: {
    margin: "0 0 0.2rem",
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  pageSubtitle: { margin: 0, fontSize: "0.875rem", color: "#6b7280" },
  newBtn: {
    padding: "0.6rem 1.125rem",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    flexShrink: 0,
  },

  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    background: "#fff",
    borderRadius: "12px",
    border: "1px dashed #e5e7eb",
  },
  emptyIcon: { fontSize: "2.5rem", marginBottom: "0.75rem" },
  emptyTitle: { margin: "0 0 0.35rem", fontWeight: 700, fontSize: "1rem", color: "#111827" },
  emptyText: { margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#9ca3af" },
  emptyBtn: {
    padding: "0.6rem 1.25rem",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
  },

  list: { display: "flex", flexDirection: "column", gap: "0.625rem" },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "0.875rem" },
  cardIcon: {
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    fontWeight: 800,
    flexShrink: 0,
  },
  cardName: { margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.9rem", color: "#111827" },
  cardMeta: { margin: 0 },
  cardRight: { display: "flex", alignItems: "center", gap: "1rem" },
  cardArrow: { color: "#9ca3af", fontSize: "1rem" },

  badgeOwner: {
    padding: "0.15rem 0.5rem",
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  badgeMember: {
    padding: "0.15rem 0.5rem",
    background: "#f3f4f6",
    color: "#6b7280",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  envOn: { fontSize: "0.78rem", color: "#16a34a", fontWeight: 500 },
  envOff: { fontSize: "0.78rem", color: "#d1d5db", fontWeight: 500 },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
    backdropFilter: "blur(2px)",
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb",
  },
  modalTitle: {
    margin: "0 0 0.25rem",
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  modalSub: { margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#6b7280" },
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
  },
  input: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    color: "#111827",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.625rem", marginTop: "0.25rem" },
  cancelBtn: {
    padding: "0.55rem 1rem",
    background: "#f9fafb",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitBtn: {
    padding: "0.55rem 1.25rem",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
  },
}
