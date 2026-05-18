import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: Home,
})

function Home() {
  return (
    <main>
      <h1>Env Manager</h1>
      <p>Secure environment variable management for small teams.</p>
    </main>
  )
}
