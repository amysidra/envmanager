import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: Home,
})

function Home() {
  return (
    <div style={s.root}>
      {/* Navbar */}
      <nav style={s.nav}>
        <span style={s.navLogo}>Env Manager</span>
        <div style={s.navLinks}>
          <Link to="/login" style={s.navSignIn}>Sign In</Link>
          <Link to="/register" style={s.navRegister}>Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBadge}>Open for early access</div>
        <h1 style={s.heroTitle}>
          Stop sharing <span style={s.heroAccent}>.env files</span><br />the wrong way
        </h1>
        <p style={s.heroSub}>
          Env Manager keeps your team's secrets encrypted, organized, and always
          accessible — no more Slack DMs, WhatsApp forwards, or email threads with
          plain-text credentials.
        </p>
        <div style={s.heroCtas}>
          <Link to="/register" style={s.ctaPrimary}>Create free account</Link>
          <Link to="/login" style={s.ctaSecondary}>Sign in</Link>
        </div>
      </section>

      {/* Problem */}
      <section style={s.section}>
        <p style={s.sectionLabel}>The problem</p>
        <h2 style={s.sectionTitle}>Every dev team has this problem</h2>
        <div style={s.problemGrid}>
          {problems.map((p) => (
            <div key={p.title} style={s.problemCard}>
              <span style={s.problemIcon}>{p.icon}</span>
              <div>
                <p style={s.problemTitle}>{p.title}</p>
                <p style={s.problemDesc}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...s.section, background: "#f9fafb" }}>
        <p style={s.sectionLabel}>What you get</p>
        <h2 style={s.sectionTitle}>Everything your team needs</h2>
        <div style={s.featGrid}>
          {features.map((f) => (
            <div key={f.title} style={s.featCard}>
              <div style={s.featIcon}>{f.icon}</div>
              <h3 style={s.featTitle}>{f.title}</h3>
              <p style={s.featDesc}>{f.desc}</p>
              {f.badge && <span style={s.comingSoon}>{f.badge}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={s.section}>
        <p style={s.sectionLabel}>How it works</p>
        <h2 style={s.sectionTitle}>Up and running in 3 steps</h2>
        <div style={s.stepsRow}>
          {steps.map((step, i) => (
            <div key={step.title} style={s.stepItem}>
              <div style={s.stepNumber}>{i + 1}</div>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={s.ctaBanner}>
        <h2 style={s.ctaBannerTitle}>Ready to stop the chaos?</h2>
        <p style={s.ctaBannerSub}>
          Join teams that manage secrets the right way. Free to get started, no credit card
          required.
        </p>
        <div style={s.heroCtas}>
          <Link to="/register" style={s.ctaPrimary}>Get started — it's free</Link>
          <Link to="/login" style={{ ...s.ctaSecondary, borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
            Already have an account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={s.footerLogo}>Env Manager</span>
        <p style={s.footerNote}>
          Built with care for developers who value security.
        </p>
      </footer>
    </div>
  )
}

const problems = [
  {
    icon: "💬",
    title: "Sharing secrets over chat",
    desc: "Slack, WhatsApp, Telegram — credentials sent in plain text, stored in logs forever, readable by anyone with access to that channel.",
  },
  {
    icon: "🕵️",
    title: "No idea who has what",
    desc: "Once a .env file is forwarded, you lose all visibility. Who has the latest version? Who still has the old API key you rotated last month?",
  },
  {
    icon: "😩",
    title: "New developer onboarding",
    desc: "\"Hey, can you send me the .env?\" Every. Single. Time. New teammates spend their first hour chasing down credentials from five different people.",
  },
]

const features = [
  {
    icon: "🔐",
    title: "AES-256-GCM Encryption",
    desc: "Your .env file is encrypted at rest with military-grade AES-256-GCM. Only project members can decrypt and view the content.",
  },
  {
    icon: "👥",
    title: "Team invitations",
    desc: "Invite teammates by email. They get instant access to the project's env file — and you can revoke that access anytime.",
  },
  {
    icon: "⬇️",
    title: "One-click download",
    desc: "Download the decrypted .env file straight to your machine with a single click. Works just like a regular file download.",
  },
  {
    icon: "🔍",
    title: "AI-powered secret scanning",
    desc: "Automatically detect leaked keys, weak secrets, and misconfigured variables before they become a security incident.",
    badge: "Coming soon",
  },
]

const steps = [
  {
    title: "Create a project",
    desc: "Give your project a name and you're in. Takes less than 10 seconds.",
  },
  {
    title: "Upload your .env",
    desc: "Drag & drop your .env file or paste the content directly. It's encrypted the moment it leaves your browser.",
  },
  {
    title: "Invite your team",
    desc: "Add teammates by email. They get a secure link to join and can download the file immediately.",
  },
]

const s: Record<string, React.CSSProperties> = {
  root: { fontFamily: "system-ui, sans-serif", color: "#111827", background: "#fff" },

  // Nav
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    borderBottom: "1px solid #f3f4f6",
    position: "sticky",
    top: 0,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },
  navLogo: { fontWeight: 800, fontSize: "1.125rem", color: "#111827", letterSpacing: "-0.02em" },
  navLinks: { display: "flex", gap: "0.75rem", alignItems: "center" },
  navSignIn: {
    padding: "0.4rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
    textDecoration: "none",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  navRegister: {
    padding: "0.4rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#fff",
    textDecoration: "none",
    borderRadius: "6px",
    background: "#111827",
  },

  // Hero
  hero: {
    textAlign: "center",
    padding: "5rem 2rem 4rem",
    maxWidth: "720px",
    margin: "0 auto",
  },
  heroBadge: {
    display: "inline-block",
    padding: "0.3rem 0.9rem",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: "99px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    border: "1px solid #bfdbfe",
  },
  heroTitle: {
    fontSize: "clamp(2rem, 5vw, 3.25rem)",
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    margin: "0 0 1.25rem",
    color: "#111827",
  },
  heroAccent: { color: "#2563eb" },
  heroSub: {
    fontSize: "1.1rem",
    color: "#6b7280",
    lineHeight: 1.7,
    margin: "0 0 2.25rem",
    maxWidth: "580px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  heroCtas: { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" },
  ctaPrimary: {
    padding: "0.7rem 1.5rem",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    borderRadius: "8px",
    textDecoration: "none",
  },
  ctaSecondary: {
    padding: "0.7rem 1.5rem",
    background: "transparent",
    color: "#374151",
    fontWeight: 600,
    fontSize: "0.95rem",
    borderRadius: "8px",
    textDecoration: "none",
    border: "1px solid #d1d5db",
  },

  // Sections
  section: { padding: "5rem 2rem", maxWidth: "1000px", margin: "0 auto" },
  sectionLabel: {
    textAlign: "center",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#2563eb",
    margin: "0 0 0.6rem",
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: "0 0 2.5rem",
    color: "#111827",
  },

  // Problem
  problemGrid: { display: "flex", flexDirection: "column", gap: "1rem" },
  problemCard: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    padding: "1.25rem 1.5rem",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
  },
  problemIcon: { fontSize: "1.5rem", flexShrink: 0, marginTop: "0.1rem" },
  problemTitle: { fontWeight: 700, fontSize: "0.95rem", margin: "0 0 0.25rem", color: "#111827" },
  problemDesc: { fontSize: "0.875rem", color: "#6b7280", margin: 0, lineHeight: 1.6 },

  // Features
  featGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "1rem",
  },
  featCard: {
    padding: "1.5rem",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    position: "relative",
  },
  featIcon: { fontSize: "1.75rem", marginBottom: "0.75rem" },
  featTitle: { fontWeight: 700, fontSize: "0.95rem", margin: "0 0 0.4rem", color: "#111827" },
  featDesc: { fontSize: "0.85rem", color: "#6b7280", margin: 0, lineHeight: 1.6 },
  comingSoon: {
    display: "inline-block",
    marginTop: "0.75rem",
    padding: "0.2rem 0.6rem",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "99px",
    fontSize: "0.72rem",
    fontWeight: 700,
  },

  // Steps
  stepsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "2rem",
  },
  stepItem: { textAlign: "center" },
  stepNumber: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    background: "#111827",
    color: "#fff",
    fontWeight: 800,
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1rem",
  },
  stepTitle: { fontWeight: 700, fontSize: "1rem", margin: "0 0 0.4rem", color: "#111827" },
  stepDesc: { fontSize: "0.875rem", color: "#6b7280", margin: 0, lineHeight: 1.6 },

  // CTA Banner
  ctaBanner: {
    background: "#111827",
    color: "#fff",
    textAlign: "center",
    padding: "5rem 2rem",
  },
  ctaBannerTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: "0 0 0.75rem",
    color: "#fff",
  },
  ctaBannerSub: {
    fontSize: "1rem",
    color: "#9ca3af",
    margin: "0 auto 2rem",
    maxWidth: "480px",
    lineHeight: 1.7,
  },

  // Footer
  footer: {
    borderTop: "1px solid #f3f4f6",
    padding: "2rem",
    textAlign: "center",
  },
  footerLogo: { fontWeight: 800, fontSize: "1rem", color: "#111827" },
  footerNote: { fontSize: "0.8rem", color: "#9ca3af", margin: "0.4rem 0 0" },
}
