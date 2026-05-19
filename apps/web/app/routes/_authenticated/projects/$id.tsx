import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { api } from "../../../lib/api"
import type { Project } from "../../../lib/server-fns"

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectDetail,
})

type MemberItem = {
  id: string
  userId: string
  name: string
  email: string
  role: "OWNER" | "MEMBER"
  joinedAt: string
}

function ProjectDetail() {
  const navigate = useNavigate()
  const { user } = useRouteContext({ from: "/_authenticated/projects/$id" })
  const { id } = Route.useParams()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [members, setMembers] = useState<MemberItem[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Project>(`/api/projects/${id}`)
      .then(setProject)
      .catch(() => navigate({ to: "/dashboard" }))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!loading && project) {
      api
        .get<MemberItem[]>(`/api/projects/${id}/members`)
        .then(setMembers)
        .finally(() => setLoadingMembers(false))
    }
  }, [id, loading, project])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.del(`/api/projects/${id}`)
      navigate({ to: "/dashboard" })
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleInvite(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteError("")
    setInviteSuccess("")
    setInviting(true)
    try {
      const res = await api.post<MemberItem | { message: string }>(
        `/api/projects/${id}/members`,
        { email: inviteEmail },
      )
      if ("id" in res) {
        setMembers((prev) => [...prev, res])
        setInviteSuccess(`${res.name} added to the project.`)
      } else {
        setInviteSuccess(`Invitation sent to ${inviteEmail}.`)
      }
      setInviteEmail("")
    } catch (err) {
      setInviteError((err as { message?: string })?.message ?? "Failed to send invitation.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    try {
      await api.del(`/api/projects/${id}/members/${memberId}`)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch {
      // no-op — leave list unchanged on error
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <main style={s.page}>
        <p style={s.loadingText}>Loading…</p>
      </main>
    )
  }

  if (!project) return null

  const isOwner = project.role === "OWNER"

  return (
    <main style={s.page}>
      <header style={s.header}>
        <a href="/dashboard" style={s.back}>← Back to Dashboard</a>
        <h1 style={s.logo}>Env Manager</h1>
        <span style={s.userName}>{user?.name}</span>
      </header>

      <section style={s.content}>
        <div style={s.titleRow}>
          <div style={s.titleLeft}>
            <h2 style={s.projectName}>{project.name}</h2>
            <span style={project.role === "OWNER" ? s.badgeOwner : s.badgeMember}>
              {project.role === "OWNER" ? "Owner" : "Member"}
            </span>
          </div>
          {isOwner && (
            <button onClick={() => setConfirmDelete(true)} style={s.deleteBtn}>
              Delete Project
            </button>
          )}
        </div>

        <div style={s.grid}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Members</h3>

            {loadingMembers ? (
              <p style={s.hint}>Loading members…</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {members.map((m) => (
                  <div key={m.id} style={s.memberRow}>
                    <div style={s.memberAvatar}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={s.memberMeta}>
                      <span style={s.memberName}>{m.name}</span>
                      <span style={s.memberEmail}>{m.email}</span>
                    </div>
                    <span style={m.role === "OWNER" ? s.badgeOwner : s.badgeMember}>
                      {m.role === "OWNER" ? "Owner" : "Member"}
                    </span>
                    <span style={s.memberJoined}>
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </span>
                    {isOwner && m.userId !== user?.id && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={removingId === m.id}
                        style={s.removeBtn}
                      >
                        {removingId === m.id ? "…" : "Remove"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isOwner && (
              <form onSubmit={handleInvite} style={s.inviteForm}>
                <input
                  type="email"
                  placeholder="Invite by email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  style={s.inviteInput}
                />
                <button type="submit" disabled={inviting} style={s.inviteBtn}>
                  {inviting ? "Inviting…" : "Invite"}
                </button>
              </form>
            )}

            {inviteSuccess && <p style={s.successMsg}>{inviteSuccess}</p>}
            {inviteError && <p style={s.errorMsg}>{inviteError}</p>}
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Env File</h3>
            {project.hasEnvFile ? (
              <p style={s.envUploaded}>Env file uploaded</p>
            ) : (
              <p style={s.hint}>No env file uploaded yet.</p>
            )}
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Scan Results</h3>
            <p style={s.hint}>No scans yet.</p>
          </div>
        </div>
      </section>

      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Delete Project?</h3>
            <p style={s.modalBody}>
              This will permanently delete <strong>{project.name}</strong> and all associated env files, scan results, and invitations. This cannot be undone.
            </p>
            <div style={s.modalActions}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={s.cancelBtn}
                disabled={deleting}
              >
                Cancel
              </button>
              <button onClick={handleDelete} style={s.confirmDeleteBtn} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" },
  loadingText: { textAlign: "center", padding: "4rem", color: "#6b7280" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
  },
  back: { fontSize: "0.875rem", color: "#2563eb", textDecoration: "none", fontWeight: 500 },
  logo: { margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#111827" },
  userName: { fontSize: "0.875rem", color: "#6b7280" },
  content: { padding: "2rem", maxWidth: "800px", margin: "0 auto" },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  titleLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  projectName: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" },
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
  deleteBtn: {
    padding: "0.5rem 1rem",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  grid: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "1.25rem 1.5rem",
  },
  cardTitle: { margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, color: "#111827" },
  memberRow: { display: "flex", alignItems: "center", gap: "0.6rem" },
  memberAvatar: {
    width: "2rem",
    height: "2rem",
    borderRadius: "50%",
    background: "#e0e7ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  memberMeta: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0 },
  memberName: { fontSize: "0.875rem", fontWeight: 600, color: "#111827" },
  memberEmail: { fontSize: "0.75rem", color: "#9ca3af" },
  memberJoined: { fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap" },
  removeBtn: {
    padding: "0.2rem 0.6rem",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  inviteForm: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #f3f4f6",
  },
  inviteInput: {
    flex: 1,
    padding: "0.4rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    outline: "none",
  },
  inviteBtn: {
    padding: "0.4rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  successMsg: { margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#16a34a" },
  errorMsg: { margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#dc2626" },
  hint: { margin: 0, fontSize: "0.85rem", color: "#9ca3af" },
  envUploaded: { margin: 0, fontSize: "0.9rem", color: "#16a34a", fontWeight: 500 },
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
  modalTitle: { margin: "0 0 0.75rem", fontSize: "1.25rem", fontWeight: 700, color: "#111827" },
  modalBody: { margin: "0 0 1.5rem", fontSize: "0.9rem", color: "#374151", lineHeight: 1.6 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem" },
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
  confirmDeleteBtn: {
    padding: "0.5rem 1.25rem",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
}
