import { createFileRoute, Link, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router"
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
  const router = useRouter()
  const { user } = useRouteContext({ from: "/_authenticated/projects/$id" })
  const { id } = Route.useParams()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Members state
  const [members, setMembers] = useState<MemberItem[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Env file state
  const [replacing, setReplacing] = useState(false)
  const [envPaste, setEnvPaste] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [envContent, setEnvContent] = useState<string | null>(null)
  const [envRevealed, setEnvRevealed] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [confirmDeleteEnv, setConfirmDeleteEnv] = useState(false)
  const [deletingEnv, setDeletingEnv] = useState(false)

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

  async function handleLogout() {
    await api.post("/api/auth/logout")
    await router.invalidate()
    navigate({ to: "/login" })
  }

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
    setConfirmRemoveId(null)
    setRemovingId(memberId)
    try {
      await api.del(`/api/projects/${id}/members/${memberId}`)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch {
      // leave list unchanged on error
    } finally {
      setRemovingId(null)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024) {
      setUploadError("File exceeds 100 KB limit")
      return
    }
    setUploadError("")
    setEnvPaste(await file.text())
  }

  async function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > 100 * 1024) {
      setUploadError("File exceeds 100 KB limit")
      return
    }
    setUploadError("")
    setEnvPaste(await file.text())
  }

  async function handleUploadEnv(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = envPaste.trim()
    if (!content) { setUploadError("Content is required"); return }
    if (new TextEncoder().encode(content).length > 100 * 1024) {
      setUploadError("Content exceeds 100 KB limit")
      return
    }
    setUploading(true)
    setUploadError("")
    try {
      await api.put(`/api/projects/${id}/env`, { content })
      setProject((prev) => (prev ? { ...prev, hasEnvFile: true } : prev))
      setReplacing(false)
      setEnvPaste("")
      setEnvContent(null)
      setEnvRevealed(false)
    } catch (err) {
      setUploadError((err as { message?: string })?.message ?? "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleViewEnv() {
    if (envContent !== null) {
      setEnvRevealed((v) => !v)
      return
    }
    setLoadingContent(true)
    try {
      const res = await api.get<{ content: string }>(`/api/projects/${id}/env`)
      setEnvContent(res.content)
      setEnvRevealed(true)
    } catch {
      // silent
    } finally {
      setLoadingContent(false)
    }
  }

  function handleDownloadEnv() {
    const apiUrl = import.meta.env.VITE_API_URL as string
    const a = document.createElement("a")
    a.href = `${apiUrl}/api/projects/${id}/env/download`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleDeleteEnv() {
    setDeletingEnv(true)
    try {
      await api.del(`/api/projects/${id}/env`)
      setProject((prev) => (prev ? { ...prev, hasEnvFile: false } : prev))
      setEnvContent(null)
      setEnvRevealed(false)
      setConfirmDeleteEnv(false)
    } catch {
      setDeletingEnv(false)
      setConfirmDeleteEnv(false)
    }
  }

  if (loading) {
    return (
      <div style={s.root}>
        <p style={s.loadingText}>Loading…</p>
      </div>
    )
  }

  if (!project) return null

  const isOwner = project.role === "OWNER"

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <span style={s.navLogo}>Env Manager</span>
          <span style={s.navSep}>/</span>
          <span style={s.navProject}>{project.name}</span>
        </div>
        <div style={s.navRight}>
          <span style={s.navUser}>{user?.name}</span>
          <button onClick={() => setConfirmLogout(true)} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>

      <main style={s.main}>
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
          <Link to="/dashboard" style={s.navBack}>← Dashboard</Link>
        </div>
        <div style={s.pageHeader}>
          <div style={s.pageHeaderLeft}>
            <h1 style={s.pageTitle}>{project.name}</h1>
            <span style={project.role === "OWNER" ? s.badgeOwner : s.badgeMember}>
              {project.role === "OWNER" ? "Owner" : "Member"}
            </span>
          </div>
          {isOwner && (
            <button onClick={() => setConfirmDelete(true)} style={s.deleteBtn}>
              Delete project
            </button>
          )}
        </div>

        <div style={s.grid}>
          {/* Members card */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Members</h3>
            {loadingMembers ? (
              <p style={s.hint}>Loading members…</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {members.map((m) => (
                  <div key={m.id} style={s.memberRow}>
                    <div style={s.memberAvatar}>{m.name.charAt(0).toUpperCase()}</div>
                    <div style={s.memberMeta}>
                      <span style={s.memberName}>{m.name}</span>
                      <span style={s.memberEmail}>{m.email}</span>
                    </div>
                    <span style={m.role === "OWNER" ? s.badgeOwner : s.badgeMember}>
                      {m.role === "OWNER" ? "Owner" : "Member"}
                    </span>
                    <span style={s.memberJoined}>{new Date(m.joinedAt).toLocaleDateString()}</span>
                    {isOwner && m.userId !== user?.id && (
                      <button
                        onClick={() => setConfirmRemoveId(m.id)}
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

          {/* Env File card */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Env File</h3>

            {!project.hasEnvFile || replacing ? (
              isOwner ? (
                <>
                  {replacing && (
                    <p style={s.replaceWarning}>This will overwrite the existing file.</p>
                  )}
                  <form
                    onSubmit={handleUploadEnv}
                    style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <div
                      style={s.dropzone}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                    >
                      <p style={s.dropzoneText}>Drag & drop .env file here, or</p>
                      <label style={s.fileLabel}>
                        Browse file
                        <input
                          type="file"
                          accept=".env"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                    <textarea
                      placeholder="...or paste .env content here"
                      value={envPaste}
                      onChange={(e) => setEnvPaste(e.target.value)}
                      rows={6}
                      style={s.textarea}
                    />
                    {uploadError && <p style={s.errorMsg}>{uploadError}</p>}
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      {replacing && (
                        <button
                          type="button"
                          onClick={() => { setReplacing(false); setEnvPaste(""); setUploadError("") }}
                          style={s.cancelBtn}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={uploading || !envPaste.trim()}
                        style={s.inviteBtn}
                      >
                        {uploading ? "Uploading…" : replacing ? "Replace" : "Upload"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <p style={s.hint}>No env file uploaded yet.</p>
              )
            ) : (
              <>
                <p style={s.envUploaded}>● Env file uploaded</p>
                <div style={s.envActions}>
                  <button onClick={handleViewEnv} disabled={loadingContent} style={s.envActionBtn}>
                    {loadingContent
                      ? "Loading…"
                      : envContent !== null && envRevealed
                        ? "Hide"
                        : "View"}
                  </button>
                  <button onClick={handleDownloadEnv} style={s.envActionBtn}>Download</button>
                  {isOwner && (
                    <button
                      onClick={() => { setReplacing(true); setEnvPaste(""); setUploadError("") }}
                      style={s.envActionBtn}
                    >
                      Replace
                    </button>
                  )}
                  {isOwner && (
                    <button onClick={() => setConfirmDeleteEnv(true)} style={s.deleteEnvBtn}>
                      Delete
                    </button>
                  )}
                </div>
                {envContent !== null && envRevealed && (
                  <pre style={{ ...s.codeBlock, marginTop: "0.75rem" }}>
                    {envContent}
                  </pre>
                )}
              </>
            )}
          </div>

          {/* Scan Results card */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Scan Results</h3>
            <p style={s.hint}>No scans yet.</p>
          </div>
        </div>
      </main>

      {/* Delete project modal */}
      {confirmDelete && (
        <div style={s.overlay} onClick={() => { if (!deleting) setConfirmDelete(false) }}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Delete Project?</h3>
            <p style={s.modalBody}>
              This will permanently delete <strong>{project.name}</strong> and all associated env
              files, scan results, and invitations. This cannot be undone.
            </p>
            <div style={s.modalActions}>
              <button onClick={() => setConfirmDelete(false)} style={s.cancelBtn} disabled={deleting}>
                Cancel
              </button>
              <button onClick={handleDelete} style={s.confirmDeleteBtn} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove member modal */}
      {confirmRemoveId && (() => {
        const member = members.find((m) => m.id === confirmRemoveId)
        return (
          <div style={s.overlay} onClick={() => setConfirmRemoveId(null)}>
            <div style={s.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Remove Member?</h3>
              <p style={s.modalBody}>
                Remove <strong>{member?.name}</strong> ({member?.email}) from this project? They
                will lose access immediately.
              </p>
              <div style={s.modalActions}>
                <button onClick={() => setConfirmRemoveId(null)} style={s.cancelBtn}>
                  Cancel
                </button>
                <button onClick={() => handleRemove(confirmRemoveId)} style={s.confirmDeleteBtn}>
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Logout modal */}
      {confirmLogout && (
        <div style={s.overlay} onClick={() => setConfirmLogout(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Logout?</h3>
            <p style={s.modalBody}>Are you sure you want to logout?</p>
            <div style={s.modalActions}>
              <button onClick={() => setConfirmLogout(false)} style={s.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleLogout} style={s.confirmDeleteBtn}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete env file modal */}
      {confirmDeleteEnv && (
        <div style={s.overlay} onClick={() => { if (!deletingEnv) setConfirmDeleteEnv(false) }}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Delete Env File?</h3>
            <p style={s.modalBody}>
              This will permanently delete the env file and all associated scan results. This cannot
              be undone.
            </p>
            <div style={s.modalActions}>
              <button
                onClick={() => setConfirmDeleteEnv(false)}
                style={s.cancelBtn}
                disabled={deletingEnv}
              >
                Cancel
              </button>
              <button onClick={handleDeleteEnv} style={s.confirmDeleteBtn} disabled={deletingEnv}>
                {deletingEnv ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" },
  loadingText: { textAlign: "center", padding: "6rem", color: "#9ca3af", fontSize: "0.9rem" },

  // Nav
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
  navLeft: { display: "flex", alignItems: "center", gap: "0.5rem" },
  navLogo: { fontWeight: 800, fontSize: "1.125rem", color: "#111827", letterSpacing: "-0.02em" },
  navSep: { color: "#d1d5db", fontSize: "1rem" },
  navProject: { fontSize: "0.9rem", fontWeight: 600, color: "#6b7280", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  navRight: { display: "flex", alignItems: "center", gap: "0.875rem" },
  navBack: { fontSize: "0.8rem", color: "#6b7280", textDecoration: "none", fontWeight: 500 },
  navUser: { fontSize: "0.875rem", color: "#9ca3af" },
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

  // Page layout
  main: { maxWidth: "800px", margin: "0 auto", padding: "2.5rem 2rem" },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  pageHeaderLeft: { display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" },
  pageTitle: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  badgeOwner: {
    padding: "0.2rem 0.6rem",
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  badgeMember: {
    padding: "0.2rem 0.6rem",
    background: "#f3f4f6",
    color: "#6b7280",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  deleteBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },

  // Cards
  grid: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  cardTitle: {
    margin: "0 0 1rem",
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.01em",
  },

  // Members
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f9fafb",
  },
  memberAvatar: {
    width: "2rem",
    height: "2rem",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 800,
    flexShrink: 0,
  },
  memberMeta: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0 },
  memberName: { fontSize: "0.85rem", fontWeight: 600, color: "#111827" },
  memberEmail: { fontSize: "0.75rem", color: "#9ca3af" },
  memberJoined: { fontSize: "0.72rem", color: "#d1d5db", whiteSpace: "nowrap" },
  removeBtn: {
    padding: "0.25rem 0.625rem",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    fontSize: "0.72rem",
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
    padding: "0.5rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.875rem",
    outline: "none",
    color: "#111827",
  },
  inviteBtn: {
    padding: "0.5rem 1rem",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  successMsg: { margin: "0.625rem 0 0", fontSize: "0.8rem", color: "#16a34a" },
  errorMsg: { margin: "0.625rem 0 0", fontSize: "0.8rem", color: "#dc2626" },

  // Env file
  dropzone: {
    border: "2px dashed #e5e7eb",
    borderRadius: "10px",
    padding: "2rem 1.5rem",
    textAlign: "center",
    background: "#f9fafb",
    cursor: "default",
  },
  dropzoneText: { margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#9ca3af" },
  fileLabel: {
    display: "inline-block",
    padding: "0.4rem 1rem",
    background: "#111827",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "0.625rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontFamily: "monospace",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    color: "#111827",
    background: "#fff",
  },
  replaceWarning: {
    margin: "0 0 0.75rem",
    fontSize: "0.8rem",
    color: "#92400e",
    background: "#fffbeb",
    padding: "0.5rem 0.875rem",
    borderRadius: "8px",
    border: "1px solid #fde68a",
  },
  envUploaded: {
    margin: "0 0 0.875rem",
    fontSize: "0.85rem",
    color: "#16a34a",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  envActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  envActionBtn: {
    padding: "0.4rem 0.875rem",
    background: "#f9fafb",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteEnvBtn: {
    padding: "0.4rem 0.875rem",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  codeBlock: {
    background: "#0d1117",
    color: "#e6edf3",
    padding: "1.25rem",
    borderRadius: "10px",
    fontSize: "0.78rem",
    fontFamily: "ui-monospace, monospace",
    overflow: "auto",
    maxHeight: "320px",
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    lineHeight: 1.65,
  },
  hint: { margin: 0, fontSize: "0.85rem", color: "#9ca3af" },

  // Modals
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
    margin: "0 0 0.3rem",
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  modalBody: { margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.625rem" },
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
  confirmDeleteBtn: {
    padding: "0.55rem 1.25rem",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
  },
}
