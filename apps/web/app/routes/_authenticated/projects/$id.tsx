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

type EnvFileMeta = {
  id: string
  name: string
  projectId: string
  createdAt: string
  updatedAt: string
}

type Warning = {
  variable: string
  severity: "high" | "medium" | "low"
  issue: string
  recommendation: string
}

type ScanResultData = {
  id: string
  warnings: Warning[]
  summary: { high: number; medium: number; low: number; total: number }
  scannedAt: string
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

  // Env files state
  const [envFiles, setEnvFiles] = useState<EnvFileMeta[]>([])
  const [loadingEnvFiles, setLoadingEnvFiles] = useState(true)
  const [addingEnv, setAddingEnv] = useState(false)
  const [newEnvName, setNewEnvName] = useState(".env")
  const [newEnvPaste, setNewEnvPaste] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null)
  const [replaceEnvName, setReplaceEnvName] = useState("")
  const [replaceEnvPaste, setReplaceEnvPaste] = useState("")
  const [replaceError, setReplaceError] = useState("")
  const [replacing, setReplacing] = useState(false)
  const [revealedFileId, setRevealedFileId] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [loadingContentId, setLoadingContentId] = useState<string | null>(null)
  const [confirmDeleteEnvId, setConfirmDeleteEnvId] = useState<string | null>(null)
  const [deletingEnvId, setDeletingEnvId] = useState<string | null>(null)

  // Scan state
  const [scanResults, setScanResults] = useState<Record<string, ScanResultData>>({})
  const [scanningFileId, setScanningFileId] = useState<string | null>(null)
  const [scanErrors, setScanErrors] = useState<Record<string, string>>({})
  const [expandedScanFileId, setExpandedScanFileId] = useState<string | null>(null)

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

      api
        .get<EnvFileMeta[]>(`/api/projects/${id}/env`)
        .then((files) => {
          setEnvFiles(files)
          files.forEach((file) => {
            api
              .get<ScanResultData>(`/api/projects/${id}/env/${file.id}/scan`)
              .then((result) => setScanResults((prev) => ({ ...prev, [file.id]: result })))
              .catch(() => {})
          })
        })
        .finally(() => setLoadingEnvFiles(false))
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

  async function handleNewFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024) { setUploadError("File exceeds 100 KB limit"); return }
    setUploadError("")
    if (!newEnvName || newEnvName === ".env") setNewEnvName(file.name)
    setNewEnvPaste(await file.text())
  }

  async function handleNewFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > 100 * 1024) { setUploadError("File exceeds 100 KB limit"); return }
    setUploadError("")
    if (!newEnvName || newEnvName === ".env") setNewEnvName(file.name)
    setNewEnvPaste(await file.text())
  }

  async function handleAddEnv(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = newEnvPaste.trim()
    if (!content) { setUploadError("Content is required"); return }
    if (new TextEncoder().encode(content).length > 100 * 1024) {
      setUploadError("Content exceeds 100 KB limit"); return
    }
    setUploading(true)
    setUploadError("")
    try {
      const newFile = await api.post<EnvFileMeta>(`/api/projects/${id}/env`, { content, name: newEnvName || ".env" })
      setEnvFiles((prev) => [...prev, newFile])
      setProject((prev) => (prev ? { ...prev, hasEnvFile: true } : prev))
      setAddingEnv(false)
      setNewEnvName(".env")
      setNewEnvPaste("")
    } catch (err) {
      setUploadError((err as { message?: string })?.message ?? "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleReplaceFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024) { setReplaceError("File exceeds 100 KB limit"); return }
    setReplaceError("")
    setReplaceEnvPaste(await file.text())
  }

  async function handleReplaceFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > 100 * 1024) { setReplaceError("File exceeds 100 KB limit"); return }
    setReplaceError("")
    setReplaceEnvPaste(await file.text())
  }

  async function handleReplaceEnv(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!replacingFileId) return
    const content = replaceEnvPaste.trim()
    if (!content) { setReplaceError("Content is required"); return }
    if (new TextEncoder().encode(content).length > 100 * 1024) {
      setReplaceError("Content exceeds 100 KB limit"); return
    }
    setReplacing(true)
    setReplaceError("")
    try {
      const updated = await api.put<EnvFileMeta>(
        `/api/projects/${id}/env/${replacingFileId}`,
        { content, name: replaceEnvName || undefined },
      )
      setEnvFiles((prev) => prev.map((f) => (f.id === replacingFileId ? updated : f)))
      setFileContents((prev) => { const next = { ...prev }; delete next[replacingFileId]; return next })
      setRevealedFileId(null)
      setReplacingFileId(null)
      setReplaceEnvPaste("")
      setReplaceEnvName("")
    } catch (err) {
      setReplaceError((err as { message?: string })?.message ?? "Replace failed")
    } finally {
      setReplacing(false)
    }
  }

  async function handleViewEnvFile(fileId: string) {
    if (revealedFileId === fileId) {
      setRevealedFileId(null)
      return
    }
    if (fileContents[fileId] !== undefined) {
      setRevealedFileId(fileId)
      return
    }
    setLoadingContentId(fileId)
    try {
      const res = await api.get<{ content: string }>(`/api/projects/${id}/env/${fileId}`)
      setFileContents((prev) => ({ ...prev, [fileId]: res.content }))
      setRevealedFileId(fileId)
    } catch {
      // silent
    } finally {
      setLoadingContentId(null)
    }
  }

  function handleDownloadEnvFile(fileId: string) {
    const apiUrl = import.meta.env.VITE_API_URL as string
    const a = document.createElement("a")
    a.href = `${apiUrl}/api/projects/${id}/env/${fileId}/download`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleDeleteEnvFile() {
    if (!confirmDeleteEnvId) return
    setDeletingEnvId(confirmDeleteEnvId)
    try {
      await api.del(`/api/projects/${id}/env/${confirmDeleteEnvId}`)
      setEnvFiles((prev) => {
        const next = prev.filter((f) => f.id !== confirmDeleteEnvId)
        setProject((p) => (p ? { ...p, hasEnvFile: next.length > 0 } : p))
        return next
      })
      setFileContents((prev) => { const next = { ...prev }; delete next[confirmDeleteEnvId!]; return next })
      if (revealedFileId === confirmDeleteEnvId) setRevealedFileId(null)
      setConfirmDeleteEnvId(null)
    } catch {
      // keep state
    } finally {
      setDeletingEnvId(null)
    }
  }

  async function handleScan(fileId: string) {
    setScanningFileId(fileId)
    setScanErrors((prev) => { const next = { ...prev }; delete next[fileId]; return next })
    try {
      const result = await api.post<ScanResultData>(`/api/projects/${id}/env/${fileId}/scan`)
      setScanResults((prev) => ({ ...prev, [fileId]: result }))
      setExpandedScanFileId(fileId)
    } catch (err) {
      setScanErrors((prev) => ({ ...prev, [fileId]: (err as { message?: string })?.message ?? "Scan failed. Please try again." }))
    } finally {
      setScanningFileId(null)
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

          {/* Env Files card */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ ...s.cardTitle, margin: 0 }}>Env Files</h3>
              {isOwner && !addingEnv && (
                <button
                  onClick={() => { setAddingEnv(true); setNewEnvName(".env"); setNewEnvPaste(""); setUploadError("") }}
                  style={s.addEnvBtn}
                >
                  + Add file
                </button>
              )}
            </div>

            {/* Add new env file form */}
            {addingEnv && (
              <div style={s.addEnvForm}>
                <form onSubmit={handleAddEnv} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="File name (e.g. .env.production)"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    style={s.inviteInput}
                  />
                  <div
                    style={s.dropzone}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleNewFileDrop}
                  >
                    <p style={s.dropzoneText}>Drag & drop .env file here, or</p>
                    <label style={s.fileLabel}>
                      Browse file
                      <input type="file" onChange={handleNewFileChange} style={{ display: "none" }} />
                    </label>
                  </div>
                  <textarea
                    placeholder="...or paste .env content here"
                    value={newEnvPaste}
                    onChange={(e) => setNewEnvPaste(e.target.value)}
                    rows={5}
                    style={s.textarea}
                  />
                  {uploadError && <p style={s.errorMsg}>{uploadError}</p>}
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => { setAddingEnv(false); setUploadError("") }}
                      style={s.cancelBtn}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={uploading || !newEnvPaste.trim()} style={s.inviteBtn}>
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of env files */}
            {loadingEnvFiles ? (
              <p style={s.hint}>Loading…</p>
            ) : envFiles.length === 0 && !addingEnv ? (
              <p style={s.hint}>No env files uploaded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {envFiles.map((file) => (
                  <div key={file.id}>
                    {/* Replace form for this file */}
                    {replacingFileId === file.id ? (
                      <div style={s.replaceBox}>
                        <p style={s.replaceWarning}>Replacing: <strong>{file.name}</strong></p>
                        <form onSubmit={handleReplaceEnv} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <input
                            type="text"
                            placeholder="File name"
                            value={replaceEnvName || file.name}
                            onChange={(e) => setReplaceEnvName(e.target.value)}
                            style={s.inviteInput}
                          />
                          <div
                            style={s.dropzone}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleReplaceFileDrop}
                          >
                            <p style={s.dropzoneText}>Drag & drop .env file here, or</p>
                            <label style={s.fileLabel}>
                              Browse file
                              <input type="file" onChange={handleReplaceFileChange} style={{ display: "none" }} />
                            </label>
                          </div>
                          <textarea
                            placeholder="...or paste .env content here"
                            value={replaceEnvPaste}
                            onChange={(e) => setReplaceEnvPaste(e.target.value)}
                            rows={5}
                            style={s.textarea}
                          />
                          {replaceError && <p style={s.errorMsg}>{replaceError}</p>}
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => { setReplacingFileId(null); setReplaceEnvPaste(""); setReplaceEnvName(""); setReplaceError("") }}
                              style={s.cancelBtn}
                            >
                              Cancel
                            </button>
                            <button type="submit" disabled={replacing || !replaceEnvPaste.trim()} style={s.inviteBtn}>
                              {replacing ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div style={s.envFileRow}>
                        <div style={s.envFileInfo}>
                          <span style={s.envFileName}>{file.name}</span>
                          <span style={s.envFileDate}>{new Date(file.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div style={s.envActions}>
                          <button
                            onClick={() => handleViewEnvFile(file.id)}
                            disabled={loadingContentId === file.id}
                            style={s.envActionBtn}
                          >
                            {loadingContentId === file.id ? "…" : revealedFileId === file.id ? "Hide" : "View"}
                          </button>
                          <button onClick={() => handleDownloadEnvFile(file.id)} style={s.envActionBtn}>Download</button>
                          <button
                            onClick={() => handleScan(file.id)}
                            disabled={scanningFileId === file.id}
                            style={s.scanBtn}
                          >
                            {scanningFileId === file.id ? "Scanning…" : "Scan"}
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => {
                                setReplacingFileId(file.id)
                                setReplaceEnvName(file.name)
                                setReplaceEnvPaste("")
                                setReplaceError("")
                              }}
                              style={s.envActionBtn}
                            >
                              Replace
                            </button>
                          )}
                          {isOwner && (
                            <button onClick={() => setConfirmDeleteEnvId(file.id)} style={s.deleteEnvBtn}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline content viewer */}
                    {revealedFileId === file.id && fileContents[file.id] !== undefined && (
                      <pre style={{ ...s.codeBlock, marginTop: "0.5rem" }}>
                        {fileContents[file.id]}
                      </pre>
                    )}

                    {/* Scan error */}
                    {scanErrors[file.id] && (
                      <p style={{ ...s.errorMsg, marginTop: "0.5rem" }}>{scanErrors[file.id]}</p>
                    )}

                    {/* Scan results inline */}
                    {scanResults[file.id] && (
                      <div style={s.scanResultsBox}>
                        <div style={s.scanSummaryBar}>
                          <button
                            onClick={() => setExpandedScanFileId(expandedScanFileId === file.id ? null : file.id)}
                            style={s.scanSummaryToggle}
                          >
                            {expandedScanFileId === file.id ? "▾" : "▸"}
                          </button>
                          <span style={s.scanSummaryLabel}>Last scan:</span>
                          {scanResults[file.id].summary.high > 0 && (
                            <span style={s.badgeHigh}>{scanResults[file.id].summary.high} High</span>
                          )}
                          {scanResults[file.id].summary.medium > 0 && (
                            <span style={s.badgeMedium}>{scanResults[file.id].summary.medium} Medium</span>
                          )}
                          {scanResults[file.id].summary.low > 0 && (
                            <span style={s.badgeLow}>{scanResults[file.id].summary.low} Low</span>
                          )}
                          {scanResults[file.id].summary.total === 0 && (
                            <span style={s.badgeClean}>No issues found</span>
                          )}
                          <span style={s.scanDate}>
                            {new Date(scanResults[file.id].scannedAt).toLocaleString()}
                          </span>
                        </div>
                        {expandedScanFileId === file.id && (
                          <div style={s.warningsList}>
                            {scanResults[file.id].warnings.length === 0 ? (
                              <p style={s.hint}>No security issues detected.</p>
                            ) : (
                              scanResults[file.id].warnings.map((w, i) => (
                                <div key={i} style={s.warningCard}>
                                  <div style={s.warningHeader}>
                                    <code style={s.warningVariable}>{w.variable}</code>
                                    <span style={w.severity === "high" ? s.badgeHigh : w.severity === "medium" ? s.badgeMedium : s.badgeLow}>
                                      {w.severity}
                                    </span>
                                  </div>
                                  <p style={s.warningIssue}>{w.issue}</p>
                                  <p style={s.warningRec}>
                                    <strong>Fix:</strong> {w.recommendation}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scanning spinner */}
                    {scanningFileId === file.id && (
                      <p style={{ ...s.hint, marginTop: "0.5rem", fontStyle: "italic" }}>
                        Running security scan… this may take up to 15 seconds.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scan Results card */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Security Scan Summary</h3>
            {Object.keys(scanResults).length === 0 ? (
              <p style={s.hint}>
                No scans yet. Click <strong>Scan</strong> on an env file above to run a security scan.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {envFiles
                  .filter((f) => scanResults[f.id])
                  .map((file) => {
                    const result = scanResults[file.id]
                    const total = result.summary.total
                    return (
                      <div key={file.id} style={s.scanSummaryCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" as const }}>
                          <code style={s.envFileName}>{file.name}</code>
                          {result.summary.high > 0 && <span style={s.badgeHigh}>{result.summary.high} High</span>}
                          {result.summary.medium > 0 && <span style={s.badgeMedium}>{result.summary.medium} Medium</span>}
                          {result.summary.low > 0 && <span style={s.badgeLow}>{result.summary.low} Low</span>}
                          {total === 0 && <span style={s.badgeClean}>Clean</span>}
                        </div>
                        <span style={s.scanDate}>{new Date(result.scannedAt).toLocaleString()}</span>
                      </div>
                    )
                  })}
              </div>
            )}
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
      {confirmDeleteEnvId && (() => {
        const file = envFiles.find((f) => f.id === confirmDeleteEnvId)
        return (
          <div style={s.overlay} onClick={() => { if (!deletingEnvId) setConfirmDeleteEnvId(null) }}>
            <div style={s.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Delete Env File?</h3>
              <p style={s.modalBody}>
                Permanently delete <strong>{file?.name}</strong>? This cannot be undone.
              </p>
              <div style={s.modalActions}>
                <button
                  onClick={() => setConfirmDeleteEnvId(null)}
                  style={s.cancelBtn}
                  disabled={!!deletingEnvId}
                >
                  Cancel
                </button>
                <button onClick={handleDeleteEnvFile} style={s.confirmDeleteBtn} disabled={!!deletingEnvId}>
                  {deletingEnvId ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
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

  // Env files
  addEnvBtn: {
    padding: "0.35rem 0.875rem",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  addEnvForm: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  envFileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.625rem 0",
    borderBottom: "1px solid #f3f4f6",
    flexWrap: "wrap" as const,
  },
  envFileInfo: { display: "flex", flexDirection: "column" as const, gap: "0.1rem" },
  envFileName: { fontSize: "0.85rem", fontWeight: 600, color: "#111827", fontFamily: "monospace" },
  envFileDate: { fontSize: "0.72rem", color: "#d1d5db" },
  replaceBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "0.5rem",
  },
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

  // Scan
  scanBtn: {
    padding: "0.4rem 0.875rem",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  scanResultsBox: {
    marginTop: "0.625rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },
  scanSummaryBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#f9fafb",
    flexWrap: "wrap" as const,
  },
  scanSummaryToggle: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "#6b7280",
    padding: "0 0.25rem",
  },
  scanSummaryLabel: { fontSize: "0.75rem", color: "#9ca3af" },
  scanDate: { fontSize: "0.7rem", color: "#d1d5db", marginLeft: "auto" },
  warningsList: {
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.625rem",
  },
  warningCard: {
    background: "#fff",
    border: "1px solid #f3f4f6",
    borderRadius: "8px",
    padding: "0.75rem",
  },
  warningHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.35rem",
  },
  warningVariable: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#111827",
    background: "#f3f4f6",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
  },
  warningIssue: { margin: "0 0 0.35rem", fontSize: "0.8rem", color: "#374151" },
  warningRec: { margin: 0, fontSize: "0.78rem", color: "#6b7280" },
  badgeHigh: {
    padding: "0.15rem 0.5rem",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
    border: "1px solid #fecaca",
  },
  badgeMedium: {
    padding: "0.15rem 0.5rem",
    background: "#fffbeb",
    color: "#d97706",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
    border: "1px solid #fde68a",
  },
  badgeLow: {
    padding: "0.15rem 0.5rem",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
    border: "1px solid #bfdbfe",
  },
  badgeClean: {
    padding: "0.15rem 0.5rem",
    background: "#f0fdf4",
    color: "#15803d",
    borderRadius: "99px",
    fontSize: "0.7rem",
    fontWeight: 700,
    border: "1px solid #bbf7d0",
  },
  scanSummaryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.625rem 0.75rem",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },

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
